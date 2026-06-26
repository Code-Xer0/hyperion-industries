/* global process, Buffer */
import { createHmac } from 'crypto';
import { Readable } from 'stream';
import orderIntake from '../api/order-intake.js';
import draftOrder from '../api/shopify/draft-order.js';
import webhook from '../api/shopify/webhook.js';
import publicIntake from '../api/public-intake.js';
import publicStatus from '../api/public-status.js';

function makeReq({ method = 'POST', body = {}, headers = {} } = {}) {
  const req = Readable.from([typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)]);
  req.method = method;
  req.headers = headers;
  return req;
}

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function invoke(handler, options) {
  const req = makeReq(options);
  const res = makeRes();
  await handler(req, res);
  return res;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const validIntent = {
  productLane: 'card_studio_physical',
  customer: { name: 'Mara Sol', email: 'mara@example.com' },
  template: 'ivory',
  finish: 'pvc-matte',
  quantity: 1,
  profileUrl: 'https://example.com/mara',
  shippingRegion: 'Chicago, IL',
  notes: 'Test draft invoice path. No payment data.',
};

const invalidIntake = await invoke(orderIntake, { body: { productLane: 'card_studio_physical' } });
assert(invalidIntake.statusCode === 400, 'order-intake rejects incomplete card order');

const acceptedIntake = await invoke(orderIntake, { body: validIntent });
assert(acceptedIntake.statusCode === 202, 'order-intake accepts valid card order intent');
assert(acceptedIntake.body.intent.paymentDataReceived === false, 'order-intake reports no payment data');

delete process.env.ORDER_ADMIN_TOKEN;
const noAdminToken = await invoke(draftOrder, { body: validIntent });
assert(noAdminToken.statusCode === 503, 'draft-order requires ORDER_ADMIN_TOKEN configuration');

process.env.ORDER_ADMIN_TOKEN = 'test-admin-token';
delete process.env.SHOPIFY_SHOP_DOMAIN;
delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const missingAuth = await invoke(draftOrder, { body: validIntent });
assert(missingAuth.statusCode === 401, 'draft-order rejects missing admin token');

const stagedDraft = await invoke(draftOrder, {
  body: validIntent,
  headers: { authorization: 'Bearer test-admin-token' },
});
assert(stagedDraft.statusCode === 503, 'draft-order reports staged Shopify config when secrets are absent');
assert(stagedDraft.body.staged === true, 'draft-order staged response is explicit');

process.env.SHOPIFY_WEBHOOK_SECRET = 'test-webhook-secret';
const rawWebhook = JSON.stringify({ id: 123, admin_graphql_api_id: 'gid://shopify/Order/123' });
const validHmac = createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET).update(rawWebhook).digest('base64');

const rejectedWebhook = await invoke(webhook, {
  body: rawWebhook,
  headers: {
    'x-shopify-hmac-sha256': 'not-valid',
    'x-shopify-topic': 'orders/create',
    'x-shopify-webhook-id': 'verify-1',
  },
});
assert(rejectedWebhook.statusCode === 401, 'webhook rejects invalid HMAC');

const acceptedWebhook = await invoke(webhook, {
  body: rawWebhook,
  headers: {
    'x-shopify-hmac-sha256': validHmac,
    'x-shopify-topic': 'orders/create',
    'x-shopify-webhook-id': 'verify-2',
  },
});
assert(acceptedWebhook.statusCode === 202, 'webhook accepts valid Shopify HMAC');
assert(acceptedWebhook.body.verified === true, 'webhook reports verified delivery');

const rejectedPublicIntake = await invoke(publicIntake, {
  body: {
    type: 'contact',
    name: 'Public Probe',
    email: 'probe@example.com',
    message: 'Hello',
    token: 'should-not-be-accepted',
  },
});
assert(rejectedPublicIntake.statusCode === 400, 'public-intake rejects sensitive fields');

const acceptedPublicIntake = await invoke(publicIntake, {
  body: {
    type: 'demo_request',
    name: 'Public Probe',
    email: 'probe@example.com',
    system: 'chronos',
    message: 'Requesting a public-safe demo.',
  },
});
assert(acceptedPublicIntake.statusCode === 202, 'public-intake accepts public-safe demo request');
assert(acceptedPublicIntake.body.persisted === false, 'public-intake reports staged persistence');
assert(acceptedPublicIntake.body.paymentDataReceived === false, 'public-intake reports no payment data');

const statusProbe = await invoke(publicStatus, { method: 'GET', body: '' });
assert(statusProbe.statusCode === 200, 'public-status responds to GET');
assert(statusProbe.body.persisted === false, 'public-status reports declassified static posture');
assert(statusProbe.body.systems.every((system) => system.hidePrivateControls === true), 'public-status hides private controls for every system');

console.log('order API posture checks passed');
