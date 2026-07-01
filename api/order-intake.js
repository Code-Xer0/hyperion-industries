import { randomUUID } from 'crypto';
import { json, methodNotAllowed, readJsonBody, setCors, validateOrderIntent } from '../src/server/order-utils.js';

const recentIntake = globalThis.__hyperionRecentOrderIntake || [];
globalThis.__hyperionRecentOrderIntake = recentIntake;

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

  const validation = validateOrderIntent(body);
  if (!validation.ok) {
    json(res, 400, { success: false, error: 'invalid_order_intent', details: validation.errors });
    return;
  }

  const intent = {
    id: `hoi_${randomUUID()}`,
    status: 'submitted',
    receivedAt: new Date().toISOString(),
    ...validation.data,
  };

  recentIntake.unshift(intent);
  recentIntake.splice(25);

  json(res, 202, {
    success: true,
    intent: {
      id: intent.id,
      status: intent.status,
      productLane: intent.productLane,
      next: 'operator_review',
      paymentDataReceived: false,
    },
  });
}
