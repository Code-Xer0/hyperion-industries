import { HttpError } from './http';
import { createPayPalOrder } from './paypal';
import { createStripeCheckout } from './stripe';
import type { Env, RuntimeDependencies } from './types';

export type PaymentProvider = 'paypal' | 'stripe';

export interface PaymentCheckoutInput {
  provider: PaymentProvider;
  referenceId: string;
  description: string;
  amountMinor: number;
  currency: 'USD';
  idempotencyKey: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createPaymentCheckout(env: Env, deps: RuntimeDependencies, input: PaymentCheckoutInput) {
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor < 50 || input.amountMinor > 10_000_000) {
    throw new HttpError(400, 'payment_amount_invalid', 'The reviewed payment amount is outside the supported range.');
  }
  if (input.provider === 'paypal') {
    return { provider: 'paypal' as const, ...await createPayPalOrder(env, deps, {
      referenceId: input.referenceId,
      description: input.description,
      amountMinor: input.amountMinor,
      currency: input.currency,
      idempotencyKey: input.idempotencyKey,
      returnUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    }) };
  }
  if (input.provider === 'stripe') {
    return { provider: 'stripe' as const, ...await createStripeCheckout(env, deps, input) };
  }
  throw new HttpError(400, 'payment_provider_unsupported', 'The requested payment provider is not supported.');
}
