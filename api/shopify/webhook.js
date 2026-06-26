import { createHmac, timingSafeEqual } from 'crypto';
import { json, methodNotAllowed, setCors } from '../../src/server/order-utils.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const recentDeliveries = globalThis.__hyperionShopifyWebhookDeliveries || new Set();
globalThis.__hyperionShopifyWebhookDeliveries = recentDeliveries;

function header(req, name) {
  const lower = name.toLowerCase();
  return req.headers[name] || req.headers[lower] || '';
}

function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body, 'utf8'));
  if (req.body && typeof req.body === 'object') return Promise.resolve(Buffer.from(JSON.stringify(req.body), 'utf8'));

  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > 512_000) reject(new Error('body_too_large'));
      chunks.push(buffer);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function validHmac(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const digest = createHmac('sha256', secret).update(rawBody).digest('base64');
  const incoming = Buffer.from(signature, 'base64');
  const expected = Buffer.from(digest, 'base64');
  return incoming.length === expected.length && timingSafeEqual(incoming, expected);
}

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

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    json(res, 503, { success: false, error: 'shopify_webhook_secret_not_configured' });
    return;
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch {
    json(res, 400, { success: false, error: 'invalid_body' });
    return;
  }

  const signature = header(req, 'x-shopify-hmac-sha256');
  if (!validHmac(rawBody, signature, secret)) {
    json(res, 401, { success: false, error: 'invalid_shopify_hmac' });
    return;
  }

  const deliveryId = header(req, 'x-shopify-webhook-id') || `delivery_${Date.now()}`;
  const topic = header(req, 'x-shopify-topic') || 'unknown';
  const duplicate = recentDeliveries.has(deliveryId);
  recentDeliveries.add(deliveryId);
  if (recentDeliveries.size > 200) {
    const [first] = recentDeliveries;
    recentDeliveries.delete(first);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8') || '{}');
  } catch {
    json(res, 400, { success: false, error: 'invalid_json' });
    return;
  }

  json(res, duplicate ? 200 : 202, {
    success: true,
    verified: true,
    duplicate,
    topic,
    deliveryId,
    shopifyId: payload.id || payload.admin_graphql_api_id || null,
    persisted: false,
  });
}
