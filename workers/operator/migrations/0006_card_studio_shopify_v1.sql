-- Card Studio Shopify provider boundary.
-- A reserved attempt is written before any provider request. Ambiguous attempts
-- require operator reconciliation rather than creating a second cart.

CREATE TABLE IF NOT EXISTS card_studio_checkout_attempts (
  attempt_id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL UNIQUE,
  projection_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('reserved', 'applied', 'ambiguous', 'reconciled')),
  request_hash TEXT NOT NULL,
  provider_checkout_ref TEXT,
  checkout_url TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (intent_id) REFERENCES card_studio_order_intents(intent_id),
  FOREIGN KEY (projection_id) REFERENCES card_studio_checkout_projections(projection_id)
);

CREATE INDEX IF NOT EXISTS idx_card_studio_checkout_attempt_state
  ON card_studio_checkout_attempts(state, updated_at);
