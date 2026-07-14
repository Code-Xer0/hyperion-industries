import Ajv2020 from 'ajv/dist/2020';
import submissionSchema from '../../../shared/intake/contracts/schemas/intake-submission.schema.json';
import type { Env } from './types';

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addFormat('date-time', (value: string) => Number.isFinite(Date.parse(value)));
ajv.addFormat('email', (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
ajv.addFormat('uri', (value: string) => { try { new URL(value); return true; } catch { return false; } });

const prepareSchema = structuredClone(submissionSchema) as typeof submissionSchema;
delete (prepareSchema as { $id?: string }).$id;
prepareSchema.properties.client_reviewed = { type: 'boolean' } as never;
const validatePreparedPayload = ajv.compile(prepareSchema);
const validateSubmissionPayload = ajv.compile(submissionSchema);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class IntakeError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) { super(message); }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decode64url(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

function processingConsent(payload: Record<string, unknown>): boolean {
  const consents = Array.isArray(payload.consents) ? payload.consents : [];
  return consents.some((entry) => {
    const consent = entry as Record<string, unknown>;
    return consent.consent_id === 'process_intake' && consent.granted === true;
  });
}

function validatePayload(payload: unknown, final: boolean): Record<string, unknown> {
  const validator = final ? validateSubmissionPayload : validatePreparedPayload;
  if (!validator(payload)) {
    const details = (validator.errors ?? []).slice(0, 5).map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');
    throw new IntakeError('schema_rejected', `Payload failed schema validation: ${details}`);
  }
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.artifacts) && record.artifacts.length > 0) throw new IntakeError('uploads_unsupported', 'MCP intake does not support uploads or artifact metadata.');
  if (!processingConsent(record)) throw new IntakeError('processing_consent_required', 'Explicit process_intake consent is required.');
  if (final && record.client_reviewed !== true) throw new IntakeError('client_review_required', 'client_reviewed must be true.');
  return record;
}

export async function prepareSubmission(payload: unknown, secret: string, revision: string, now: Date, nonce: string) {
  const record = validatePayload(payload, false);
  // The review acknowledgement is the only field promoted by preparation.
  // Every substantive field is already final and remains hash-bound.
  const boundRecord = { ...record, client_reviewed: true };
  const payloadHash = await sha256(canonical(boundRecord));
  const claims = {
    v: 1,
    payload_hash: payloadHash,
    iat: Math.floor(now.getTime() / 1000),
    exp: Math.floor(now.getTime() / 1000) + 600,
    nonce,
    corpus_revision: revision,
  };
  const encoded = base64url(encoder.encode(JSON.stringify(claims)));
  const signature = await hmac(secret, encoded);
  const identity = (record.identity ?? {}) as Record<string, unknown>;
  const answers = Array.isArray(record.answers) ? record.answers as Array<Record<string, unknown>> : [];
  return {
    confirmation_token: `${encoded}.${signature}`,
    expires_at: new Date(claims.exp * 1000).toISOString(),
    payload_hash: payloadHash,
    review: {
      form_id: record.form_id,
      form_version: record.form_version,
      revision: record.revision,
      answer_ids: answers.map((answer) => answer.question_id),
      answer_count: answers.length,
      contact_present: Boolean(identity.email || identity.phone),
      organization_present: Boolean(identity.organization),
      artifact_count: 0,
      processing_consent: true,
      submit_with_client_reviewed: true,
      values_redacted: true,
      boundary: 'Operator review is required. Preparation is not submission or acceptance.',
    },
  };
}

export async function verifySubmission(payload: unknown, token: string, secret: string, now: Date) {
  const record = validatePayload(payload, true);
  const [encoded, suppliedSignature, extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra) throw new IntakeError('confirmation_token_invalid', 'Confirmation token is invalid.');
  const expectedSignature = await hmac(secret, encoded);
  if (expectedSignature.length !== suppliedSignature.length) throw new IntakeError('confirmation_token_invalid', 'Confirmation token is invalid.');
  let mismatch = 0;
  for (let index = 0; index < expectedSignature.length; index += 1) mismatch |= expectedSignature.charCodeAt(index) ^ suppliedSignature.charCodeAt(index);
  if (mismatch !== 0) throw new IntakeError('confirmation_token_invalid', 'Confirmation token is invalid.');
  let claims: { payload_hash?: string; exp?: number; nonce?: string };
  try { claims = JSON.parse(decoder.decode(decode64url(encoded))); } catch { throw new IntakeError('confirmation_token_invalid', 'Confirmation token is invalid.'); }
  if (!claims.exp || claims.exp <= Math.floor(now.getTime() / 1000)) throw new IntakeError('confirmation_token_expired', 'Confirmation token has expired.');
  const payloadHash = await sha256(canonical(record));
  if (claims.payload_hash !== payloadHash) throw new IntakeError('payload_changed', 'Payload changed after client review. Prepare it again.');
  return { payload: record, idempotencyKey: `mcp_${await sha256(token)}`, payloadHash, nonce: claims.nonce };
}

export async function forwardIntake(env: Env, path: string, body: unknown, idempotencyKey?: string): Promise<unknown> {
  if (!env.OPERATOR_SERVICE) throw new IntakeError('intake_service_unavailable', 'The governed intake service is unavailable.', 503);
  const headers = new Headers({
    'content-type': 'application/json',
    origin: env.SITE_ORIGIN || 'https://hyperion-industries.dev',
    'sec-fetch-site': 'same-origin',
  });
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);
  const response = await env.OPERATOR_SERVICE.fetch(new Request(`https://hyperion-industries.dev${path}`, {
    method: 'POST', headers, body: JSON.stringify(body),
  }));
  const result = await response.json().catch(() => ({ ok: false, error: { code: 'invalid_upstream_response', message: 'Intake service returned an invalid response.' } }));
  if (!response.ok) {
    const error = (result as { error?: { code?: string; message?: string } }).error;
    throw new IntakeError(error?.code || 'intake_service_error', error?.message || 'The governed intake service rejected the request.', response.status);
  }
  return result;
}
