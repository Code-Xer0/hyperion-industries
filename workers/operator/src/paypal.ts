import { HttpError } from './http';
import type { Env, RuntimeDependencies } from './types';

export interface PayPalCheckoutResult {
  checkoutId: string;
  checkoutUrl: string;
}

interface PayPalConfig {
  apiOrigin: string;
  approvalHost: string;
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'live';
}

function configuration(env: Env): PayPalConfig {
  const environment = env.PAYPAL_ENVIRONMENT?.trim().toLowerCase() === 'live' ? 'live' : 'sandbox';
  const clientId = env.PAYPAL_CLIENT_ID?.trim() ?? '';
  const secret = env.PAYPAL_CLIENT_SECRET?.trim() ?? '';
  if (clientId.length < 12 || secret.length < 16) {
    throw new HttpError(503, 'paypal_not_configured', 'PayPal checkout is not configured.');
  }
  if (environment === 'live' && env.PAYPAL_LIVE_PAYMENTS_ENABLED?.trim().toLowerCase() !== 'true') {
    throw new HttpError(503, 'paypal_live_not_authorized', 'Live PayPal payment capture is not authorized.');
  }
  return {
    apiOrigin: environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
    approvalHost: environment === 'live' ? 'www.paypal.com' : 'www.sandbox.paypal.com',
    clientId,
    secret,
    environment,
  };
}

export function paypalConfigurationPosture(env: Env) {
  try {
    const settings = configuration(env);
    return { configured: true, environment: settings.environment, liveEnabled: settings.environment === 'live' } as const;
  } catch {
    return { configured: false, environment: env.PAYPAL_ENVIRONMENT?.trim().toLowerCase() === 'live' ? 'live' : 'sandbox', liveEnabled: false } as const;
  }
}

async function accessToken(settings: PayPalConfig, deps: RuntimeDependencies): Promise<string> {
  const encoded = btoa(`${settings.clientId}:${settings.secret}`);
  const response = await deps.fetcher(`${settings.apiOrigin}/v1/oauth2/token`, {
    method: 'POST',
    headers: { authorization: `Basic ${encoded}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const body = await response.json().catch(() => ({})) as { access_token?: unknown };
  if (!response.ok || typeof body.access_token !== 'string' || body.access_token.length < 16) {
    throw new HttpError(502, 'paypal_oauth_failed', 'PayPal authorization failed.');
  }
  return body.access_token;
}

export async function createPayPalOrder(
  env: Env,
  deps: RuntimeDependencies,
  input: {
    referenceId: string;
    description: string;
    amountMinor: number;
    currency: 'USD';
    idempotencyKey: string;
    returnUrl: string;
    cancelUrl: string;
  },
): Promise<PayPalCheckoutResult> {
  const settings = configuration(env);
  const token = await accessToken(settings, deps);
  const response = await deps.fetcher(`${settings.apiOrigin}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'paypal-request-id': input.idempotencyKey,
      prefer: 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: input.referenceId,
        custom_id: input.referenceId,
        description: input.description.slice(0, 127),
        amount: { currency_code: input.currency, value: (input.amountMinor / 100).toFixed(2) },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: 'PAY_NOW',
            shipping_preference: 'GET_FROM_FILE',
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });
  const body = await response.json().catch(() => ({})) as { id?: unknown; links?: Array<{ rel?: unknown; href?: unknown }> };
  const checkoutId = typeof body.id === 'string' ? body.id : '';
  const approval = body.links?.find((link) => link.rel === 'payer-action' || link.rel === 'approve');
  if (!response.ok || !/^[A-Z0-9]{8,32}$/i.test(checkoutId) || typeof approval?.href !== 'string') {
    throw new HttpError(502, 'paypal_order_failed', 'PayPal did not create a valid approval order.');
  }
  let checkout: URL;
  try { checkout = new URL(approval.href); } catch { throw new HttpError(502, 'paypal_checkout_url_invalid', 'PayPal returned an invalid approval URL.'); }
  if (checkout.protocol !== 'https:' || checkout.hostname !== settings.approvalHost) {
    throw new HttpError(502, 'paypal_checkout_url_invalid', 'PayPal returned an unexpected approval URL.');
  }
  return { checkoutId, checkoutUrl: checkout.toString() };
}

export async function capturePayPalOrder(env: Env, deps: RuntimeDependencies, orderId: string, idempotencyKey: string) {
  const settings = configuration(env);
  const token = await accessToken(settings, deps);
  const response = await deps.fetcher(`${settings.apiOrigin}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'paypal-request-id': idempotencyKey,
      prefer: 'return=representation',
    },
    body: '{}',
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || String(body.status ?? '').toUpperCase() !== 'COMPLETED') {
    throw new HttpError(502, 'paypal_capture_failed', 'PayPal did not confirm a completed capture.');
  }
  return body;
}

export async function verifyPayPalWebhook(env: Env, deps: RuntimeDependencies, request: Request, event: unknown): Promise<boolean> {
  const settings = configuration(env);
  const webhookId = env.PAYPAL_WEBHOOK_ID?.trim() ?? '';
  if (webhookId.length < 8) return false;
  const token = await accessToken(settings, deps);
  const response = await deps.fetcher(`${settings.apiOrigin}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      auth_algo: request.headers.get('paypal-auth-algo'),
      cert_url: request.headers.get('paypal-cert-url'),
      transmission_id: request.headers.get('paypal-transmission-id'),
      transmission_sig: request.headers.get('paypal-transmission-sig'),
      transmission_time: request.headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });
  const body = await response.json().catch(() => ({})) as { verification_status?: unknown };
  return response.ok && body.verification_status === 'SUCCESS';
}
