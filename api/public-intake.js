import { randomUUID } from 'crypto';
import { json, methodNotAllowed, readJsonBody, setCors } from '../src/server/order-utils.js';
import { validatePublicIntake } from '../src/server/public-intake-utils.js';

const recentPublicIntake = globalThis.__hyperionPublicIntake || [];
globalThis.__hyperionPublicIntake = recentPublicIntake;

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    json(res, 400, { success: false, error: 'invalid_json' });
    return;
  }

  const validation = validatePublicIntake(body);
  if (!validation.ok) {
    json(res, 400, { success: false, error: 'invalid_public_intake', details: validation.errors });
    return;
  }

  const intent = {
    id: `hpi_${randomUUID()}`,
    status: 'submitted',
    receivedAt: new Date().toISOString(),
    ...validation.data
  };

  recentPublicIntake.unshift(intent);
  recentPublicIntake.splice(25);

  json(res, 202, {
    success: true,
    persisted: false,
    externalServiceInvoked: false,
    paymentDataReceived: false,
    intent: {
      id: intent.id,
      status: intent.status,
      type: intent.type,
      next: 'operator_review'
    }
  });
}
