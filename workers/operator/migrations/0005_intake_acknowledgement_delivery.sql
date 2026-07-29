-- Deterministic intake acknowledgement delivery. Additive only.
-- Delivery state never changes intake_outbox business state.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS intake_acknowledgement_deliveries (
  delivery_id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  revision_hash TEXT NOT NULL,
  template_version TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  provider_reference TEXT UNIQUE,
  delivery_state TEXT NOT NULL
    CHECK (delivery_state IN ('pending', 'sent', 'delivered', 'bounced', 'failed')),
  created_at TEXT NOT NULL,
  attempted_at TEXT,
  provider_accepted_at TEXT,
  delivered_at TEXT,
  failed_at TEXT,
  last_event_at TEXT,
  updated_at TEXT NOT NULL,
  error_code TEXT,
  FOREIGN KEY (submission_id) REFERENCES intake_submissions(submission_id)
);

CREATE INDEX IF NOT EXISTS idx_intake_ack_delivery_state
  ON intake_acknowledgement_deliveries(delivery_state, updated_at);

CREATE TABLE IF NOT EXISTS intake_acknowledgement_webhook_events (
  webhook_id TEXT PRIMARY KEY,
  delivery_id TEXT NOT NULL,
  provider_reference TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('email.delivered', 'email.bounced', 'email.failed')),
  event_created_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  FOREIGN KEY (delivery_id) REFERENCES intake_acknowledgement_deliveries(delivery_id)
);

CREATE INDEX IF NOT EXISTS idx_intake_ack_webhook_delivery
  ON intake_acknowledgement_webhook_events(delivery_id, event_created_at);
