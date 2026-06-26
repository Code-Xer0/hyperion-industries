import { json, methodNotAllowed, setCors } from '../src/server/order-utils.js';
import { publicStatusPayload } from '../src/server/public-intake-utils.js';

export default async function handler(req, res) {
  setCors(res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET, OPTIONS');
    return;
  }

  try {
    json(res, 200, publicStatusPayload());
  } catch (error) {
    json(res, 500, {
      success: false,
      error: 'public_status_unavailable',
      details: error?.message || 'Unknown status error'
    });
  }
}
