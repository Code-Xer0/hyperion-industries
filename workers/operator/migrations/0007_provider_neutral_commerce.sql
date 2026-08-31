-- Provider-neutral, proposal-bound commerce spine. Existing Shopify tables are
-- retained for rollback and historical readback. No secrets or customer
-- contact data are stored here.

CREATE TABLE IF NOT EXISTS commerce_checkout_attempts (
  attempt_id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('card_studio', 'forge', 'chronos', 'live_site')),
  source_ref TEXT NOT NULL UNIQUE,
  proposal_ref TEXT NOT NULL,
  revision_hash TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'stripe', 'shopify')),
  state TEXT NOT NULL CHECK (state IN ('reserved', 'approval_pending', 'paid', 'cancelled', 'ambiguous', 'reconciled')),
  idempotency_hash TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  provider_checkout_ref TEXT,
  checkout_url TEXT,
  return_state_hash TEXT,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_commerce_attempts_state
  ON commerce_checkout_attempts(state, updated_at);

CREATE TABLE IF NOT EXISTS commerce_checkout_releases (
  release_id TEXT PRIMARY KEY,
  proposal_ref TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('card_studio', 'forge', 'chronos', 'live_site')),
  source_ref TEXT NOT NULL,
  revision_hash TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'stripe')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 50 AND amount_minor <= 10000000),
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  description TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('staged', 'checkout_created', 'cancelled', 'reconciled')),
  command_hash TEXT NOT NULL,
  consumer_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commerce_payment_receipts (
  receipt_id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  proposal_ref TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'stripe', 'shopify')),
  provider_event_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('paid', 'cancelled', 'refunded', 'fulfilled', 'conflict_quarantined')),
  amount_minor INTEGER,
  currency TEXT,
  payload_hash TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (provider, provider_event_id),
  FOREIGN KEY (attempt_id) REFERENCES commerce_checkout_attempts(attempt_id)
);

CREATE TABLE IF NOT EXISTS commerce_receipt_outbox (
  outbox_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state = 'held_for_review'),
  created_at TEXT NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES commerce_payment_receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS commerce_consumer_receipts (
  consumer_id TEXT NOT NULL,
  outbox_id TEXT NOT NULL,
  local_receipt_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('received', 'duplicate', 'conflict_quarantined', 'rejected')),
  payload_hash TEXT NOT NULL,
  acknowledged_at TEXT NOT NULL,
  PRIMARY KEY (consumer_id, outbox_id),
  FOREIGN KEY (outbox_id) REFERENCES commerce_receipt_outbox(outbox_id)
);
