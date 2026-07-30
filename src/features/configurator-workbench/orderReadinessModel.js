const FIXTURE_POSTURES = new Set([
  'bundled_fixture_fallback',
  'fixture_only',
  'loading',
  'local_draft_only',
  'unknown',
]);

const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};

export async function sha256Document(value) {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function makeOpaqueId(prefix) {
  const value = globalThis.crypto?.randomUUID?.()?.replaceAll('-', '');
  if (!value) throw new Error('A secure browser context is required to open the purchase desk.');
  return `${prefix}_${value}`;
}

export function createOrderAttempt() {
  return {
    intake: makeOpaqueId('int'),
    session: makeOpaqueId('ses'),
    submission: makeOpaqueId('sub'),
    trace: makeOpaqueId('trc').slice(0, 64),
    idempotency: makeOpaqueId('idem'),
  };
}

export function assessOrderReadiness({
  roles,
  selectedIds,
  issues,
  sourcePosture,
  runtimeState,
  pricedCount,
}) {
  const selectedCount = roles.filter((role) => Boolean(selectedIds[role])).length;
  const selectionComplete = selectedCount === roles.length;
  const browserFitClear = issues.length === 0;
  const fixtureSource = FIXTURE_POSTURES.has(sourcePosture);
  const engineeringCreated = runtimeState === 'complete';

  const gates = [
    {
      id: 'selection',
      label: 'System manifest',
      state: selectionComplete ? 'ready' : 'blocked',
      detail: selectionComplete
        ? `${selectedCount} of ${roles.length} required roles selected.`
        : `${roles.length - selectedCount} required role${roles.length - selectedCount === 1 ? '' : 's'} still open.`,
    },
    {
      id: 'browser_fit',
      label: 'Fit preflight',
      state: browserFitClear ? 'ready' : 'blocked',
      detail: browserFitClear
        ? 'No deterministic browser blocker found.'
        : `${issues.length} browser fit blocker${issues.length === 1 ? '' : 's'} must be resolved.`,
    },
    {
      id: 'engineering_authority',
      label: 'Engineering authority',
      state: engineeringCreated ? 'ready' : 'review',
      detail: engineeringCreated
        ? 'The managed engineering desk returned an immutable draft.'
        : 'Formal compatibility and immutable configuration creation remain an operator gate.',
    },
    {
      id: 'offer_refresh',
      label: 'Purchase-time offers',
      state: fixtureSource || pricedCount < selectedCount ? 'review' : 'pending',
      detail: fixtureSource
        ? 'Current prices are fixture or fallback estimates; live merchant offers are required.'
        : 'Exact listings, stock, shipping, tax, and payable totals require a five-minute refresh.',
    },
    {
      id: 'operator_release',
      label: 'Fulfillment release',
      state: 'pending',
      detail: 'An operator must review the manifest before any quote or merchant handoff.',
    },
  ];

  return {
    gates,
    selectedCount,
    totalCount: roles.length,
    blockingCount: gates.filter((gate) => gate.state === 'blocked').length,
    reviewCount: gates.filter((gate) => gate.state === 'review').length,
    readyCount: gates.filter((gate) => gate.state === 'ready').length,
    canStage: selectionComplete && browserFitClear,
    sourceClass: fixtureSource ? 'fixture_or_fallback' : 'managed_source',
  };
}

function answer(questionId, value, answeredAt) {
  return {
    question_id: questionId,
    value,
    answered_at: answeredAt,
    source: 'client',
    data_classification: 'client_confidential',
  };
}

export async function buildOrderSubmission({
  attempt,
  lane,
  formId,
  formVersion,
  identity,
  fulfillment,
  requirements,
  roles,
  selectedIds,
  sourcePosture,
  runtime,
  issues,
  totalMinor,
  entryUrl,
  effectsMode,
}) {
  const submittedAt = new Date().toISOString();
  const selection = roles
    .filter((role) => Boolean(selectedIds[role]))
    .map((role) => `${role}:${selectedIds[role]}`);
  const selectionDocument = {
    schema_version: 'hyperion-order-readiness/1',
    lane,
    requirements,
    selection,
  };
  const selectionHash = await sha256Document(selectionDocument);
  const engineeringAuthority = runtime?.result
    ? runtime.result.build_id || runtime.result.plan_id || 'managed_authority_receipt'
    : 'operator_review_required';
  const commonAnswers = [
    answer('configurator.selection', selection, submittedAt),
    answer('configurator.selection_hash', selectionHash, submittedAt),
    answer('configurator.source_posture', sourcePosture, submittedAt),
    answer('configurator.browser_fit_posture', issues.length ? 'blocked' : 'clear_preview', submittedAt),
    answer('configurator.estimated_total_minor', String(totalMinor), submittedAt),
    answer('configurator.estimate_authority', 'not_a_quote', submittedAt),
    answer('configurator.engineering_authority', engineeringAuthority, submittedAt),
    answer('configurator.fulfillment_country', fulfillment.country, submittedAt),
    answer('configurator.purchase_timing', fulfillment.timing, submittedAt),
    answer('configurator.fulfillment_mode', fulfillment.mode, submittedAt),
    answer('configurator.condition_policy', fulfillment.marketplaceOptIn ? 'new_plus_marketplace_review' : 'new_only', submittedAt),
  ];
  const routingAnswers = lane === 'forge'
    ? [
        answer('desired_outcome', `${requirements.workload.replaceAll('_', ' ')} system staged for fulfillment review`, submittedAt),
        answer('build_surface', 'hardware', submittedAt),
        answer('local_first', 'unknown', submittedAt),
        answer('integration_count', '0', submittedAt),
        answer('constraints', `Budget posture ${requirements.budget}; priority ${requirements.priority}; delivery country ${fulfillment.country}.`, submittedAt),
      ]
    : [
        answer('deployment_goal', `${lane.replaceAll('_', ' ')} plan staged for site and fulfillment review`, submittedAt),
        answer('site_control', 'unknown', submittedAt),
        answer('power_network_readiness', 'partial', submittedAt),
        answer('regulated_environment', 'unknown', submittedAt),
        answer('onsite_sponsor', 'unknown', submittedAt),
      ];

  return {
    intake_id: attempt.intake,
    session_id: attempt.session,
    submission_id: attempt.submission,
    revision: 1,
    supersedes_submission_id: null,
    form_id: formId,
    form_version: formVersion,
    locale: globalThis.navigator?.language || 'en-US',
    submitted_at: submittedAt,
    trace_id: attempt.trace,
    client_reviewed: true,
    identity: {
      contact_name: identity.name.trim(),
      email: identity.email.trim().toLowerCase(),
      phone: null,
      organization: identity.organization.trim() || null,
      organization_domain: null,
      existing_client_reference: null,
    },
    answers: [...routingAnswers, ...commonAnswers],
    artifacts: [],
    consents: [
      {
        consent_id: 'process_intake',
        notice_version: formVersion,
        granted: true,
        recorded_at: submittedAt,
      },
      {
        consent_id: 'automated_classification',
        notice_version: formVersion,
        granted: true,
        recorded_at: submittedAt,
      },
    ],
    client_context: {
      entry_url: entryUrl,
      effects_mode: effectsMode,
      save_resume_used: true,
    },
  };
}
