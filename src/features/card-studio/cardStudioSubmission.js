import { buildCardStudioSubmission } from './cardStudioModel.js';

const DEFAULT_ENDPOINT = '/api/card-studio/intents';

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `hcs-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function submitCardStudioBrief(document, consent, options = {}) {
  const endpoint = options.endpoint || import.meta.env.VITE_CARD_STUDIO_API_PATH || DEFAULT_ENDPOINT;
  const idempotencyKey = options.idempotencyKey || createIdempotencyKey();
  const payload = buildCardStudioSubmission(document, consent, idempotencyKey);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || body.error || 'The review lane is not available yet.');
    error.status = response.status;
    error.payload = body;
    throw error;
  }
  return { ...body, idempotency_key: idempotencyKey };
}
