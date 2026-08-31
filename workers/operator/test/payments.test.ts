import { describe, expect, it, vi } from 'vitest';
import { createPayPalOrder } from '../src/paypal';
import { createStripeCheckout } from '../src/stripe';
import { baseEnv } from './helpers';

const deps = (fetcher: typeof fetch) => ({
  fetcher,
  now: () => new Date('2026-08-30T12:00:00.000Z'),
  randomUUID: () => '12345678-1234-4234-8234-123456789abc',
  setTimer: () => 0,
  clearTimer: () => {},
});

describe('PayPal proposal checkout adapter', () => {
  it('creates a sandbox approval order with server-owned amount and opaque reference', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'sandbox-access-token-with-entropy' });
      const body = JSON.parse(String(init?.body)) as { purchase_units: Array<{ custom_id: string; amount: { value: string } }> };
      expect(body.purchase_units[0]).toMatchObject({ custom_id: 'coi_abcdefghijkl', amount: { value: '39.00' } });
      expect(new Headers(init?.headers).get('paypal-request-id')).toBe('card:checkout:abcdefghijkl');
      return Response.json({ id: 'PAYPALORDER12345', links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPALORDER12345' }] });
    });
    const result = await createPayPalOrder(baseEnv({
      PAYPAL_ENVIRONMENT: 'sandbox',
      PAYPAL_CLIENT_ID: 'sandbox-client-id-with-entropy',
      PAYPAL_CLIENT_SECRET: 'sandbox-client-secret-with-entropy',
    }), deps(fetcher as typeof fetch), {
      referenceId: 'coi_abcdefghijkl', description: 'PVC NFC Card', amountMinor: 3900, currency: 'USD',
      idempotencyKey: 'card:checkout:abcdefghijkl', returnUrl: 'https://hyperion-industries.dev/api/commerce/paypal/return',
      cancelUrl: 'https://hyperion-industries.dev/api/commerce/paypal/cancel',
    });
    expect(result).toEqual({ checkoutId: 'PAYPALORDER12345', checkoutUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPALORDER12345' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('refuses live operation without the explicit live enable flag', async () => {
    await expect(createPayPalOrder(baseEnv({
      PAYPAL_ENVIRONMENT: 'live', PAYPAL_CLIENT_ID: 'live-client-id-with-entropy', PAYPAL_CLIENT_SECRET: 'live-client-secret-with-entropy',
    }), deps(vi.fn() as unknown as typeof fetch), {
      referenceId: 'coi_abcdefghijkl', description: 'PVC NFC Card', amountMinor: 3900, currency: 'USD',
      idempotencyKey: 'card:checkout:abcdefghijkl', returnUrl: 'https://hyperion-industries.dev/return', cancelUrl: 'https://hyperion-industries.dev/cancel',
    })).rejects.toMatchObject({ code: 'paypal_live_not_authorized' });
  });
});

describe('Stripe standby Checkout adapter', () => {
  it('creates a sandbox Checkout Session without accepting browser contact data', async () => {
    let submittedBody = '';
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      submittedBody = await request.clone().text();
      return Response.json({ id: 'cs_test_abcdefghijkl', object: 'checkout.session', url: 'https://checkout.stripe.com/c/pay/cs_test_abcdefghijkl' }, { headers: { 'request-id': 'req_test_abcdefghijkl' } });
    });
    const result = await createStripeCheckout(baseEnv({ STRIPE_RESTRICTED_KEY: `sk_test_${'a'.repeat(32)}` }), deps(fetcher as typeof fetch), {
      referenceId: 'coi_abcdefghijkl', description: 'PVC NFC Card', amountMinor: 3900, currency: 'USD',
      idempotencyKey: 'card:checkout:abcdefghijkl', successUrl: 'https://hyperion-industries.dev/store?payment=processing', cancelUrl: 'https://hyperion-industries.dev/store?payment=cancelled',
    });
    expect(result.checkoutId).toBe('cs_test_abcdefghijkl');
    expect(submittedBody).toContain('client_reference_id=coi_abcdefghijkl');
    expect(submittedBody).toContain('line_items[0][price_data][unit_amount]=3900');
    expect(submittedBody).not.toContain('customer_email');
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
