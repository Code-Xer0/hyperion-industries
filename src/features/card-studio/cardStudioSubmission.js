import { evaluateCardPreflight, stableFingerprint } from './cardStudioModel.js';

const PRODUCTION_API_ORIGIN = import.meta.env?.PROD
  ? 'https://hyperion-operator.hyperion-industries-intake.workers.dev'
  : '';
const DEFAULT_BASE_PATH = `${PRODUCTION_API_ORIGIN}/api/card-studio`;
const ACCOUNT_STORAGE_KEY = 'hyperion.card-studio.account-ref.v1';
const ORDER_ACCESS_KEY = 'hyperion.card-studio.order-access.v1';

function randomId(prefix) {
  const value = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replaceAll('-', '')
    : `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${value.slice(0, 32)}`;
}

function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `hcs-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resolveBasePath(value) {
  return String(value || import.meta.env.VITE_CARD_STUDIO_API_PATH || DEFAULT_BASE_PATH)
    .replace(/\/intents\/?$/, '')
    .replace(/\/$/, '');
}

function readAccountRef() {
  try {
    const existing = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (/^acct_[A-Za-z0-9_-]{8,80}$/.test(existing || '')) return existing;
    const created = randomId('acct');
    localStorage.setItem(ACCOUNT_STORAGE_KEY, created);
    return created;
  } catch {
    return randomId('acct');
  }
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || body.error || 'The Card Studio review lane rejected the request.');
    error.status = response.status;
    error.payload = body;
    throw error;
  }
  return body;
}

function storeOrderAccess(value) {
  try {
    sessionStorage.setItem(ORDER_ACCESS_KEY, JSON.stringify(value));
  } catch {
    // Status recovery is optional; the durable Worker record remains authoritative.
  }
}

function readOrderAccess() {
  try {
    const value = JSON.parse(sessionStorage.getItem(ORDER_ACCESS_KEY) || 'null');
    if (
      /^csp_[A-Za-z0-9_-]{12,64}$/.test(value?.projectId || '')
      && /^coi_[A-Za-z0-9_-]{12,64}$/.test(value?.intentId || '')
      && /^css_[A-Za-z0-9_-]{24,80}$/.test(value?.sessionToken || '')
    ) return value;
  } catch {
    // Treat malformed tab-local state as unavailable.
  }
  return null;
}

function textElement(id, text, x, y, width, height, fontToken, color) {
  return {
    id: `el_${id}`,
    kind: 'text',
    x,
    y,
    width,
    height,
    locked: true,
    text,
    font_token: fontToken,
    color,
  };
}

export function buildWorkerDesignDocument(document, projectId, productSku, options = {}) {
  const now = options.now || new Date().toISOString();
  const revision = options.revision || 1;
  const preflight = evaluateCardPreflight(document);
  const warningTokens = preflight.warnings.map((_, index) => `client_warning_${index + 1}`);
  const visibleLinks = [{ label: 'Profile', url: document.sharing.destination }];
  const ink = document.template_id === 'ivory' || document.template_id === 'atelier' || document.template_id === 'verdant'
    ? '#171717'
    : '#F5F5F2';

  return {
    contract_version: 'card-design-document/1',
    document_id: options.documentId || randomId('cdd'),
    project_id: projectId,
    revision,
    template_id: `template_${document.template_id}`,
    product_sku: productSku,
    artboards: [
      {
        side: 'front',
        background: document.style.accent,
        elements: [
          textElement('name', document.identity.name, 0.08, 0.2, 0.72, 0.16, document.style.typography, ink),
          textElement('role', document.identity.role, 0.08, 0.42, 0.72, 0.1, document.style.typography, ink),
          textElement('organization', document.identity.organization, 0.08, 0.57, 0.72, 0.1, document.style.typography, ink),
        ],
      },
      {
        side: 'back',
        background: document.style.accent,
        elements: [
          {
            id: 'el_profile_qr',
            kind: 'qr',
            x: 0.66,
            y: 0.25,
            width: 0.24,
            height: 0.4,
            locked: true,
            destination_ref: `dst_${stableFingerprint(document).replaceAll('-', '').slice(-12)}`,
          },
          textElement('destination', document.sharing.destination, 0.08, 0.62, 0.5, 0.12, 'technical', ink),
        ],
      },
    ],
    profile: {
      display_name: document.identity.name,
      headline: [document.identity.role, document.identity.organization].filter(Boolean).join(' · ').slice(0, 160),
      visibility: 'unlisted',
      links: visibleLinks,
    },
    asset_refs: [],
    preflight: {
      state: preflight.blockers.length ? 'failed' : warningTokens.length ? 'warnings' : 'passed',
      warnings: warningTokens,
      renderer_version: 'public-card-studio.1',
    },
    updated_at: now,
  };
}

export function buildWorkerOrderIntent(projectId, revisionId, document, order, options = {}) {
  const approvedAt = options.now || new Date().toISOString();
  return {
    contract_version: 'card-order-intent/1',
    intent_id: options.intentId || randomId('coi'),
    project_id: projectId,
    revision_id: revisionId,
    product_sku: order.productSku,
    quantity: order.quantity,
    proof_approved: Boolean(order.proofApproved),
    proof_refs: [`proof_${stableFingerprint(document).replaceAll('-', '').slice(-16)}`],
    consent: {
      terms_version: '2026-07-27',
      privacy_version: '2026-07-27',
      approved_at: approvedAt,
    },
  };
}

export async function submitCardStudioBrief(document, order, options = {}) {
  if (!order?.consent) throw Object.assign(new Error('Consent is required.'), { status: 400 });
  if (!order?.inviteToken?.trim()) throw Object.assign(new Error('A Card Studio invitation is required.'), { status: 403 });

  const basePath = resolveBasePath(options.endpoint);
  const accountRef = options.accountRef || readAccountRef();
  const projectResult = await requestJson(`${basePath}/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      account_ref: accountRef,
      invite_token: order.inviteToken.trim(),
    }),
  });
  const projectId = projectResult.project?.project_id;
  const sessionToken = projectResult.session_token;
  if (!projectId || !sessionToken) throw Object.assign(new Error('The Card Studio project receipt was incomplete.'), { status: 502 });

  const design = buildWorkerDesignDocument(document, projectId, order.productSku);
  const revisionResult = await requestJson(`${basePath}/projects/${projectId}/revisions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-card-session': sessionToken,
    },
    credentials: 'same-origin',
    body: JSON.stringify(design),
  });
  const revisionId = revisionResult.revision?.revision_id;
  if (!revisionId) throw Object.assign(new Error('The immutable design revision receipt was incomplete.'), { status: 502 });

  const intent = buildWorkerOrderIntent(projectId, revisionId, document, order);
  const idempotencyKey = options.idempotencyKey || createIdempotencyKey();
  const submitResult = await requestJson(`${basePath}/projects/${projectId}/submit`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
      'x-card-session': sessionToken,
    },
    credentials: 'same-origin',
    body: JSON.stringify(intent),
  });
  storeOrderAccess({ projectId, intentId: intent.intent_id, sessionToken, basePath });
  return {
    ...submitResult,
    reference: submitResult.receipt?.proposal_id || submitResult.receipt?.intent_id || projectId,
    project_id: projectId,
    idempotency_key: idempotencyKey,
  };
}

export async function getCardStudioOrderStatus(options = {}) {
  const access = options.access || readOrderAccess();
  if (!access) throw Object.assign(new Error('This tab has no Card Studio order session.'), { status: 404 });
  const basePath = resolveBasePath(options.endpoint || access.basePath);
  return requestJson(`${basePath}/orders/${access.intentId}/status`, {
    method: 'GET',
    headers: { 'x-card-session': access.sessionToken },
    credentials: 'same-origin',
  });
}
