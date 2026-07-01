import { json, methodNotAllowed, readJsonBody, setCors, validateOrderIntent } from '../../src/server/order-utils.js';

const DRAFT_ORDER_MUTATION = `
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        status
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function authHeader(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return req.headers['x-order-admin-token'] || req.headers['X-Order-Admin-Token'] || '';
}

function requireAdmin(req, res) {
  const token = process.env.ORDER_ADMIN_TOKEN;
  if (!token) {
    json(res, 503, { success: false, error: 'order_admin_token_not_configured' });
    return false;
  }
  if (authHeader(req) !== token) {
    json(res, 401, { success: false, error: 'unauthorized' });
    return false;
  }
  return true;
}

function shopifyConfig() {
  const shop = process.env.SHOPIFY_SHOP_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const version = process.env.SHOPIFY_API_VERSION || '2026-04';
  if (!shop || !token) return null;
  return {
    endpoint: `https://${shop}/admin/api/${version}/graphql.json`,
    token,
  };
}

function draftInputFor(intent) {
  const title = intent.productLane === 'card_studio_physical'
    ? `Hyperion Card - ${intent.finish}`
    : `Hyperion ${intent.productLane.replaceAll('_', ' ')}`;

  return {
    email: intent.customer.email,
    note: intent.notes || 'Created from Hyperion order intake. Operator-reviewed draft invoice.',
    tags: ['hyperion', intent.productLane, 'operator-reviewed'],
    lineItems: [
      {
        title,
        quantity: intent.quantity,
        originalUnitPrice: String(intent.price || 0),
        requiresShipping: intent.productLane !== 'chronos_download',
        customAttributes: [
          { key: 'template', value: intent.template || 'n/a' },
          { key: 'finish', value: intent.finish || 'n/a' },
          { key: 'profileUrl', value: intent.profileUrl || 'n/a' },
          { key: 'shippingRegion', value: intent.shippingRegion || 'n/a' },
        ],
      },
    ],
    customAttributes: [
      { key: 'source', value: 'hyperion_site_order_intake' },
      { key: 'productLane', value: intent.productLane },
      { key: 'operatorReview', value: 'required' },
      { key: 'paymentDataStoredLocally', value: 'false' },
    ],
  };
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
  if (!requireAdmin(req, res)) return;

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

  const config = shopifyConfig();
  if (!config) {
    json(res, 503, {
      success: false,
      error: 'shopify_not_configured',
      staged: true,
      intent: validation.data,
    });
    return;
  }

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.token,
    },
    body: JSON.stringify({
      query: DRAFT_ORDER_MUTATION,
      variables: { input: draftInputFor(validation.data) },
    }),
  });

  const payload = await response.json();
  const result = payload.data?.draftOrderCreate;
  const userErrors = result?.userErrors || [];
  if (!response.ok || payload.errors || userErrors.length) {
    json(res, 502, {
      success: false,
      error: 'shopify_draft_order_failed',
      shopifyStatus: response.status,
      details: payload.errors || userErrors,
    });
    return;
  }

  json(res, 201, {
    success: true,
    draftOrder: result.draftOrder,
    paymentDataStoredLocally: false,
  });
}
