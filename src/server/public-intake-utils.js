import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanString } from './order-utils.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DANGEROUS_FIELDS = new Set([
  'cardNumber',
  'creditCard',
  'cvv',
  'cvc',
  'password',
  'secret',
  'token',
  'apiKey',
  'privateMemory',
  'clientTelemetry',
  'command'
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTAL_PATH = path.resolve(__dirname, '../data/portal.json');

export function readPortalContract() {
  return JSON.parse(fs.readFileSync(PORTAL_PATH, 'utf8'));
}

export function publicStatusPayload() {
  const portal = readPortalContract();
  return {
    success: true,
    persisted: false,
    generatedAt: new Date().toISOString(),
    posture: portal.publicStatus,
    systems: portal.systems.map((system) => ({
      id: system.id,
      name: system.name,
      posture: system.posture,
      access: system.access,
      statusRoute: system.statusRoute,
      authorityBoundary: system.authorityBoundary,
      hidePrivateControls: system.hidePrivateControls
    })),
    deployment: portal.site.deployment
  };
}

function hasDangerousFields(raw) {
  return Object.keys(raw || {}).some((key) => DANGEROUS_FIELDS.has(key));
}

export function validatePublicIntake(raw) {
  const portal = readPortalContract();
  const type = cleanString(raw.type || raw.intentType || 'contact', 64);
  const model = portal.intakeModels.find((item) => item.id === type);
  const errors = [];

  if (!model) errors.push('unsupported_intake_model');
  if (hasDangerousFields(raw)) errors.push('sensitive_field_rejected');
  if (!model) return { ok: false, errors };

  const data = { type };
  for (const field of model.allowedFields) {
    if (raw[field] === undefined || raw[field] === null) continue;
    data[field] = cleanString(raw[field], field === 'message' ? 2000 : 360);
  }

  for (const field of model.requiredFields) {
    if (!data[field]) errors.push(`${field}_required`);
  }

  if (data.email && !EMAIL_RE.test(data.email.toLowerCase())) errors.push('valid_email_required');
  if (data.quantity) {
    const parsed = Number.parseInt(data.quantity, 10);
    data.quantity = Number.isFinite(parsed) ? Math.max(1, Math.min(100, parsed)) : 1;
  }

  return {
    ok: errors.length === 0,
    errors,
    data: {
      ...data,
      email: data.email?.toLowerCase(),
      publicSafeOnly: true,
      paymentDataReceived: false,
      externalService: model.externalService,
      persistence: model.persistence
    }
  };
}
