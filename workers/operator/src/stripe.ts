import Stripe from 'stripe';
import { HttpError } from './http';
import type { Env, RuntimeDependencies } from './types';

export interface StripeCheckoutResult { checkoutId: string; checkoutUrl: string }

function secret(env: Env): string {
  const value = env.STRIPE_RESTRICTED_KEY?.trim() || env.STRIPE_SECRET_KEY?.trim() || '';
  if (!/^sk_(test|live)_[A-Za-z0-9]{16,}$/.test(value)) {
    throw new HttpError(503, 'stripe_not_configured', 'Stripe Checkout is not configured.');
  }
  if (value.startsWith('sk_live_') && env.STRIPE_LIVE_PAYMENTS_ENABLED?.trim().toLowerCase() !== 'true') {
    throw new HttpError(503, 'stripe_live_not_authorized', 'Live Stripe payment capture is not authorized.');
  }
  return value;
}

export function stripeConfigurationPosture(env: Env) {
  try {
    const value = secret(env);
    return { configured: true, environment: value.startsWith('sk_live_') ? 'live' : 'sandbox', liveEnabled: value.startsWith('sk_live_') } as const;
  } catch {
    return { configured: false, environment: 'sandbox', liveEnabled: false } as const;
  }
}

function client(env: Env, deps: RuntimeDependencies): Stripe {
  return new Stripe(secret(env), {
    apiVersion: '2026-07-29.dahlia',
    httpClient: Stripe.createFetchHttpClient(deps.fetcher),
  });
}

export async function createStripeCheckout(
  env: Env,
  deps: RuntimeDependencies,
  input: {
    referenceId: string;
    description: string;
    amountMinor: number;
    currency: 'USD';
    idempotencyKey: string;
    successUrl: string;
    cancelUrl: string;
  },
): Promise<StripeCheckoutResult> {
  const stripe = client(env, deps);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: input.referenceId,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: input.currency.toLowerCase(),
        unit_amount: input.amountMinor,
        product_data: { name: input.description.slice(0, 120), metadata: { hyperion_reference: input.referenceId } },
      },
    }],
    metadata: { hyperion_reference: input.referenceId },
    automatic_tax: { enabled: false },
  }, { idempotencyKey: input.idempotencyKey });
  if (!session.id || !session.url) throw new HttpError(502, 'stripe_checkout_failed', 'Stripe did not create a valid Checkout Session.');
  const checkout = new URL(session.url);
  if (checkout.protocol !== 'https:' || checkout.hostname !== 'checkout.stripe.com') {
    throw new HttpError(502, 'stripe_checkout_url_invalid', 'Stripe returned an unexpected Checkout URL.');
  }
  return { checkoutId: session.id, checkoutUrl: checkout.toString() };
}

export async function verifyStripeWebhook(env: Env, deps: RuntimeDependencies, raw: string, signature: string) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim() ?? '';
  if (!/^whsec_[A-Za-z0-9]{16,}$/.test(webhookSecret)) {
    throw new HttpError(503, 'stripe_webhook_not_configured', 'Stripe webhook verification is not configured.');
  }
  return client(env, deps).webhooks.constructEventAsync(raw, signature, webhookSecret, undefined, Stripe.createSubtleCryptoProvider());
}
