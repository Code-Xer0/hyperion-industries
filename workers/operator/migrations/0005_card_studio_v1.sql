-- Card Studio v1 durable order spine. Additive and fail-closed.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS card_studio_accounts (
  account_ref TEXT PRIMARY KEY,
  external_customer_ref TEXT,
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'suspended', 'closed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS card_studio_invites (
  invite_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  assigned_account_ref TEXT,
  status TEXT NOT NULL CHECK (status IN ('issued', 'consumed', 'revoked', 'expired')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_card_studio_invites_expiry
  ON card_studio_invites(status, expires_at);

CREATE TABLE IF NOT EXISTS card_studio_projects (
  project_id TEXT PRIMARY KEY,
  account_ref TEXT NOT NULL,
  invite_id TEXT UNIQUE,
  session_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'review_required', 'submitted', 'checkout_pending', 'paid', 'production', 'closed', 'cancelled')),
  latest_revision INTEGER NOT NULL DEFAULT 0 CHECK (latest_revision >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (account_ref) REFERENCES card_studio_accounts(account_ref),
  FOREIGN KEY (invite_id) REFERENCES card_studio_invites(invite_id)
);

CREATE INDEX IF NOT EXISTS idx_card_studio_projects_account
  ON card_studio_projects(account_ref, updated_at);

CREATE TABLE IF NOT EXISTS card_studio_design_revisions (
  revision_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  supersedes_revision_id TEXT,
  document_json TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (project_id, revision),
  FOREIGN KEY (project_id) REFERENCES card_studio_projects(project_id),
  FOREIGN KEY (supersedes_revision_id) REFERENCES card_studio_design_revisions(revision_id)
);

CREATE INDEX IF NOT EXISTS idx_card_studio_revisions_project
  ON card_studio_design_revisions(project_id, revision DESC);

CREATE TABLE IF NOT EXISTS card_studio_order_intents (
  intent_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  catalog_version TEXT NOT NULL,
  eligibility TEXT NOT NULL CHECK (eligibility IN ('instant_checkout_eligible', 'review_required')),
  status TEXT NOT NULL CHECK (status IN ('proposal_staged', 'review_required', 'proposal_approved', 'changes_requested', 'checkout_pending', 'paid', 'production', 'shipped', 'delivered', 'held', 'declined', 'cancelled', 'refunded', 'conflict_review')),
  payload_hash TEXT NOT NULL,
  idempotency_key_hash TEXT NOT NULL UNIQUE,
  receipt_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES card_studio_projects(project_id),
  FOREIGN KEY (revision_id) REFERENCES card_studio_design_revisions(revision_id)
);

CREATE INDEX IF NOT EXISTS idx_card_studio_orders_project
  ON card_studio_order_intents(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS card_studio_design_proposals (
  proposal_id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL UNIQUE,
  revision_hash TEXT NOT NULL,
  proposal_json TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('active', 'changes_requested', 'proof_approved', 'checkout_released', 'held', 'declined', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (intent_id) REFERENCES card_studio_order_intents(intent_id)
);

CREATE TABLE IF NOT EXISTS card_studio_proposal_outbox (
  outbox_id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL UNIQUE,
  intent_id TEXT NOT NULL UNIQUE,
  revision_hash TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type = 'card_studio.proposal_staged.v1'),
  state TEXT NOT NULL CHECK (state = 'held_for_review'),
  created_at TEXT NOT NULL,
  FOREIGN KEY (proposal_id) REFERENCES card_studio_design_proposals(proposal_id),
  FOREIGN KEY (intent_id) REFERENCES card_studio_order_intents(intent_id)
);

CREATE INDEX IF NOT EXISTS idx_card_studio_outbox_feed
  ON card_studio_proposal_outbox(state, created_at, outbox_id);

CREATE TABLE IF NOT EXISTS card_studio_consumer_receipts (
  consumer_id TEXT NOT NULL,
  outbox_id TEXT NOT NULL,
  intent_id TEXT NOT NULL,
  revision_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  local_receipt_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('received', 'duplicate', 'conflict_quarantined', 'rejected')),
  accepted_business_truth INTEGER NOT NULL CHECK (accepted_business_truth IN (0, 1)),
  first_seen_at TEXT NOT NULL,
  acknowledged_at TEXT NOT NULL,
  PRIMARY KEY (consumer_id, outbox_id),
  FOREIGN KEY (outbox_id) REFERENCES card_studio_proposal_outbox(outbox_id),
  FOREIGN KEY (intent_id) REFERENCES card_studio_order_intents(intent_id)
);

CREATE TABLE IF NOT EXISTS card_studio_revision_conflicts (
  conflict_id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL,
  existing_hash TEXT NOT NULL,
  received_hash TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state = 'quarantined'),
  request_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS card_studio_order_commands (
  command_id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  intent_id TEXT NOT NULL,
  revision_hash TEXT NOT NULL,
  command_hash TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('request_changes', 'approve_proof', 'release_checkout', 'hold', 'decline')),
  reason_code TEXT NOT NULL,
  consumer_id TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  FOREIGN KEY (proposal_id) REFERENCES card_studio_design_proposals(proposal_id),
  FOREIGN KEY (intent_id) REFERENCES card_studio_order_intents(intent_id)
);

CREATE TABLE IF NOT EXISTS card_studio_checkout_projections (
  projection_id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider = 'shopify'),
  provider_order_ref TEXT,
  provider_checkout_ref TEXT,
  status TEXT NOT NULL CHECK (status IN ('not_created', 'staged', 'checkout_pending', 'paid', 'production', 'shipped', 'delivered', 'cancelled', 'refunded', 'conflict_review')),
  projection_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (intent_id) REFERENCES card_studio_order_intents(intent_id)
);

CREATE TABLE IF NOT EXISTS card_studio_upload_sessions (
  upload_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  asset_ref TEXT NOT NULL UNIQUE,
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length >= 1 AND byte_length <= 15728640),
  expected_sha256 TEXT NOT NULL,
  scan_state TEXT NOT NULL CHECK (scan_state IN ('pending_upload', 'quarantined', 'passed', 'rejected', 'expired')),
  broker_session_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES card_studio_projects(project_id)
);

CREATE INDEX IF NOT EXISTS idx_card_studio_upload_expiry
  ON card_studio_upload_sessions(scan_state, expires_at);

CREATE TABLE IF NOT EXISTS card_studio_webhook_receipts (
  provider TEXT NOT NULL CHECK (provider = 'shopify'),
  event_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  body_sha256 TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('received', 'applied', 'duplicate', 'conflict_quarantined', 'rejected')),
  received_at TEXT NOT NULL,
  applied_at TEXT,
  PRIMARY KEY (provider, event_id)
);

CREATE TABLE IF NOT EXISTS card_studio_audit_events (
  audit_id TEXT PRIMARY KEY,
  project_id TEXT,
  intent_id TEXT,
  proposal_id TEXT,
  event_type TEXT NOT NULL,
  actor_class TEXT NOT NULL CHECK (actor_class IN ('client', 'operator', 'service', 'system')),
  request_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_card_studio_audit_order
  ON card_studio_audit_events(intent_id, created_at);
