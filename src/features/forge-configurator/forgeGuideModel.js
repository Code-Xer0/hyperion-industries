const UNKNOWN = '__unknown__';
const SKIPPED = '__skipped__';

export const GUIDE_UNKNOWN = UNKNOWN;
export const GUIDE_SKIPPED = SKIPPED;
export const COUNTERFACTUALS = Object.freeze([
  ['quieter', 'Quieter', 'Raise acoustic restraint and cooling-envelope priority.'],
  ['smaller', 'Smaller', 'Explore a compact lane with explicit thermal and service tradeoffs.'],
  ['lower_cost', 'Lower-cost posture', 'Favor value and fewer specialized choices.'],
  ['upgrade_room', 'More upgrade room', 'Favor platform longevity, slots, access, and enclosure headroom.'],
  ['performance_headroom', 'More performance headroom', 'Favor sustained power and cooling margin.'],
]);

const isAnswered = (value) => (
  Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''
);

const answerValues = (value) => (Array.isArray(value) ? value : [value]);

export function questionApplies(question, answers) {
  if (!question.conditions) return true;
  return Object.entries(question.conditions).every(([key, allowed]) => (
    answerValues(answers[key]).some((value) => allowed.includes(value))
  ));
}

export function visibleQuestions(bundle, answers, mode = 'full') {
  const ids = mode === 'express' ? new Set(bundle.graph.express_question_ids) : null;
  return bundle.graph.questions.filter((question) => (
    (!ids || ids.has(question.id)) && questionApplies(question, answers)
  ));
}

export function nextQuestionIndex(questions, answers, start = 0) {
  const after = questions.findIndex((question, index) => index >= start && !isAnswered(answers[question.id]));
  if (after >= 0) return after;
  return questions.findIndex((question) => !isAnswered(answers[question.id]));
}

function cueValueMatches(actual, expected) {
  if (expected.includes('__nonempty__')) return isAnswered(actual) && actual !== SKIPPED;
  return answerValues(actual).some((value) => expected.includes(value));
}

export function matchingCues(bundle, answers) {
  return bundle.cues.filter((cue) => (
    Object.entries(cue.when).every(([key, expected]) => cueValueMatches(answers[key], expected))
  ));
}

const laneByDestination = {
  gaming: ['gaming', 'sff', 'custom-loop'],
  creator: ['creator', 'custom-loop', 'sff'],
  local_ai: ['local-ai', 'creator', 'custom-loop'],
  upgrade_repair: ['gaming', 'creator', 'sff'],
  sim_rig: ['gaming', 'custom-loop', 'sff'],
  deployment: ['creator', 'local-ai', 'custom-loop'],
};

export function deriveRecommendations(bundle, answers, counterfactuals = []) {
  const ordered = [...(laneByDestination[answers.destination] || ['gaming', 'creator', 'local-ai'])];
  const promote = (lane) => {
    const current = ordered.indexOf(lane);
    if (current >= 0) ordered.splice(current, 1);
    ordered.unshift(lane);
  };
  if (answers.footprint === 'compact' || counterfactuals.includes('smaller')) promote('sff');
  if (answers.destination === 'local_ai') promote('local-ai');
  if (counterfactuals.includes('upgrade_room')) promote(answers.destination === 'local_ai' ? 'local-ai' : 'creator');
  if (counterfactuals.includes('performance_headroom')) promote('custom-loop');
  if (counterfactuals.includes('lower_cost')) {
    const bespoke = ordered.indexOf('custom-loop');
    if (bespoke >= 0) ordered.splice(bespoke, 1);
  }
  const reasons = [
    answers.destination ? `destination.${answers.destination}` : 'destination.unresolved',
    answers.footprint ? `footprint.${answers.footprint}` : 'footprint.unresolved',
    answers.acoustics ? `acoustics.${answers.acoustics}` : 'acoustics.unresolved',
    ...counterfactuals.map((id) => `counterfactual.${id}`),
  ];
  const items = ordered
    .map((lane) => bundle.product_views.find((item) => item.lane === lane))
    .filter(Boolean)
    .slice(0, 3);
  return { items, reason_codes: [...new Set(reasons)] };
}

const confidence = (answer) => (
  !isAnswered(answer) || [UNKNOWN, SKIPPED, 'guide_me'].includes(answer) ? 0 : 9000
);

export function deriveRequirements(bundle, answers, counterfactuals = []) {
  const destination = bundle.mappings.destination[answers.destination] || {};
  const footprint = bundle.mappings.footprint[answers.footprint] || {};
  const budget = bundle.mappings.budget_minor[answers.budget];
  const priorities = {
    workload_fit: answers.destination ? 5 : 0,
    cost: counterfactuals.includes('lower_cost') ? 5 : answers.budget === 'guide_me' ? 3 : 4,
    power_headroom: bundle.mappings.priority_signals.power_headroom[answers.load_pattern] ?? 2,
    evidence: 5,
    serviceability: bundle.mappings.priority_signals.serviceability[answers.service] ?? 2,
    compactness: counterfactuals.includes('smaller') ? 5 : footprint.compactness ?? 2,
    upgradeability: counterfactuals.includes('upgrade_room') ? 5 : answers.service === 'self_service' ? 4 : 2,
    acoustics: counterfactuals.includes('quieter') ? 5 : bundle.mappings.priority_signals.acoustics[answers.acoustics] ?? 2,
  };
  if (counterfactuals.includes('performance_headroom')) priorities.power_headroom = 5;

  const unresolved = [];
  for (const question of bundle.graph.questions) {
    if (!questionApplies(question, answers)) continue;
    const value = answers[question.id];
    if (!isAnswered(value) || value === UNKNOWN || value === SKIPPED || value === 'guide_me') {
      unresolved.push({ field: question.id, reason_code: value === SKIPPED ? 'visitor_skipped' : 'requires_clarification' });
    }
  }
  const workloadSelections = Array.isArray(answers.workloads)
    ? answers.workloads.filter((item) => !String(item).startsWith('note:'))
    : [];
  const operatorNotes = [
    ...(Array.isArray(answers.workloads) ? answers.workloads : []),
    ...(Array.isArray(answers.reuse) ? answers.reuse : []),
  ].filter((item) => String(item).startsWith('note:')).map((item) => String(item).slice(5, 405));
  const inference = [
    ['workload_profile', 'destination_mapping', confidence(answers.destination)],
    ['operational_lane', 'destination_mapping', confidence(answers.destination)],
    ['parts_budget_ceiling_minor', 'visitor_budget_posture', confidence(answers.budget)],
    ['allowed_motherboard_form_factors', 'room_footprint_mapping', confidence(answers.footprint)],
    ['priorities.acoustics', 'room_acoustics_mapping', confidence(answers.acoustics)],
    ['priorities.serviceability', 'service_preference_mapping', confidence(answers.service)],
  ].map(([field, reason_code, confidence_basis_points]) => ({ field, reason_code, confidence_basis_points }));

  return {
    schema_version: 'forge-requirements/1',
    source: 'forge-guide-session/1',
    workload_profile: destination.workload_profile || null,
    operational_lane: destination.operational_lane || null,
    workload_refs: workloadSelections,
    budget: Number.isInteger(budget) ? { currency: 'USD', parts_ceiling_minor: budget } : null,
    cooling_mode: 'any',
    allowed_motherboard_form_factors: footprint.allowed_motherboard_form_factors || [],
    fresh_offer_required: true,
    unknown_policy: 'review',
    required_parts: [],
    excluded_parts: [],
    priorities,
    inference,
    unresolved,
    operator_notes: operatorNotes,
    requested_counterfactuals: [...counterfactuals],
  };
}

export function mapGuideToIntake(answers) {
  const system = {
    gaming: 'desktop',
    creator: 'creator',
    local_ai: 'local_ai',
    upgrade_repair: 'upgrade_repair',
    sim_rig: 'sim_rig',
    deployment: 'deployment',
  }[answers.destination] || 'unknown';
  const budget = answers.budget === '4000_plus' ? '4000_6500' : answers.budget;
  const timeline = {
    exploring: 'flexible', month: 'one_month', two_weeks: 'urgent', urgent: 'urgent',
  }[answers.timeline] || 'unknown';
  const form = {
    compact: 'very_compact', balanced: 'standard_tower', expandable: 'no_constraint', rack: 'rack',
  }[answers.footprint] || 'unknown';
  const acoustics = {
    near_silent: 'near_silent', quiet: 'quiet_studio', balanced: 'normal_office', performance_first: 'flexible',
  }[answers.acoustics] || 'unknown';
  const load = {
    bursty: 'rare_bursts', few_hours: 'hours_daily', all_day: 'hours_daily', continuous: 'continuous',
  }[answers.load_pattern] || 'unknown';
  const workloadText = (answers.workloads || []).map((value) => String(value).replace(/^note:/, '')).join(', ');
  return {
    'forge.system_type': system,
    'forge.outcome': workloadText || 'Operator clarification required',
    'forge.local_first': ['local_required', 'local_preferred', 'regulated'].includes(answers.privacy_posture) ? 'yes' : answers.privacy_posture === 'standard' ? 'no' : 'unknown',
    'forge.budget': budget || 'unknown',
    'forge.timeline': timeline,
    'forge.form_factor': form,
    'forge.acoustics': acoustics,
    'forge.sustained_load': load,
  };
}

export function migrateLegacyDraft(legacy) {
  if (!legacy || legacy.expires_at <= Date.now()) return null;
  const old = legacy.answers || {};
  const branchDestination = {
    desktop: 'gaming', creator: 'creator', local_ai: 'local_ai', upgrade_repair: 'upgrade_repair',
    sim_rig: 'sim_rig', deployment: 'deployment',
  };
  const answers = {
    destination: branchDestination[legacy.branch || old['forge.system_type']],
    budget: old['forge.budget'] === '4000_6500' || old['forge.budget'] === '6500_plus' ? '4000_plus' : old['forge.budget'],
    timeline: { flexible: 'exploring', one_month: 'month', quarter: 'month', urgent: 'urgent' }[old['forge.timeline']],
    footprint: { standard_tower: 'balanced', compact: 'compact', very_compact: 'compact', rack: 'rack', no_constraint: 'expandable' }[old['forge.form_factor']],
    acoustics: { flexible: 'performance_first', normal_office: 'balanced', quiet_studio: 'quiet', near_silent: 'near_silent' }[old['forge.acoustics']],
    load_pattern: { rare_bursts: 'bursty', hours_weekly: 'few_hours', hours_daily: 'all_day', continuous: 'continuous' }[old['forge.sustained_load']],
  };
  const workload = old['forge.applications'] || old['forge.outcome'];
  if (workload) answers.workloads = [`note:${String(workload).slice(0, 400)}`];
  return {
    answers: Object.fromEntries(Object.entries(answers).filter(([, value]) => value)),
    identity: legacy.identity || {},
    consent: Boolean(legacy.consent),
    revision: legacy.revision || 1,
    supersedes: legacy.supersedes || null,
    ids: legacy.ids || null,
    migrated_from: 'local-storage-v1',
  };
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function sha256Document(value) {
  const data = new TextEncoder().encode(canonical(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
