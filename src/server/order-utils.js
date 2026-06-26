import { Buffer } from 'buffer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PRODUCT_LANES = new Set([
  'card_studio_physical',
  'build_archive_card',
  'forge_build',
  'chronos_download',
  'pilot_advisory',
]);

export const FINISH_PRICES = new Map([
  ['pvc-matte', 39],
  ['pvc-gloss', 39],
  ['pvc-soft', 49],
  ['metal-brushed', 89],
  ['metal-matte', 99],
  ['metal-polished', 109],
  ['metal-gold', 129],
]);

export function cleanString(value, max = 240) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function json(res, status, payload) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.json(payload);
}

export function methodNotAllowed(res, allow = 'POST, OPTIONS') {
  res.setHeader('Allow', allow);
  json(res, 405, { success: false, error: 'method_not_allowed' });
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Order-Admin-Token, X-Shopify-Hmac-Sha256, X-Shopify-Topic, X-Shopify-Webhook-Id');
}

export function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}');
  }

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 64_000) {
        reject(new Error('body_too_large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

export function validateOrderIntent(raw) {
  const lane = cleanString(raw.productLane || raw.lane || 'card_studio_physical', 64);
  const customer = raw.customer || {};
  const email = cleanString(customer.email || raw.email, 180).toLowerCase();
  const name = cleanString(customer.name || raw.name, 160);
  const template = cleanString(raw.template || raw.templateKey || '', 48);
  const finish = cleanString(raw.finish || raw.finishKey || '', 48);
  const quantity = Math.max(1, Math.min(50, Number.parseInt(raw.quantity || '1', 10) || 1));
  const notes = cleanString(raw.notes, 1200);
  const profileUrl = cleanString(raw.profileUrl || raw.url, 360);
  const shippingRegion = cleanString(raw.shippingRegion || raw.region, 120);

  const errors = [];
  if (!PRODUCT_LANES.has(lane)) errors.push('unsupported_product_lane');
  if (!email || !EMAIL_RE.test(email)) errors.push('valid_email_required');
  if (!name) errors.push('customer_name_required');
  if (lane === 'card_studio_physical') {
    if (!template) errors.push('template_required');
    if (!FINISH_PRICES.has(finish)) errors.push('supported_finish_required');
  }

  return {
    ok: errors.length === 0,
    errors,
    data: {
      productLane: lane,
      customer: { name, email },
      template,
      finish,
      quantity,
      notes,
      profileUrl,
      shippingRegion,
      price: FINISH_PRICES.get(finish) || null,
      paymentDataReceived: false,
    },
  };
}
