import { describe, expect, it } from 'vitest';
import migration from '../migrations/0007_provider_neutral_commerce.sql?raw';

describe('provider-neutral commerce migration', () => {
  it('adds proposal releases, idempotent attempts, receipts, and held review outbox without secret fields', () => {
    for (const table of ['commerce_checkout_releases', 'commerce_checkout_attempts', 'commerce_payment_receipts', 'commerce_receipt_outbox', 'commerce_consumer_receipts']) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
    expect(migration).toContain("provider IN ('paypal', 'stripe', 'shopify')");
    expect(migration).toContain("state TEXT NOT NULL CHECK (state = 'held_for_review')");
    expect(migration).not.toMatch(/customer_email|client_secret|access_token/i);
  });
});
