-- Hyperion Site Intake OS v1. Additive only; public submissions remain held for review.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS intake_magic_link_grants (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  draft_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  session_hash TEXT UNIQUE,
  session_expires_at TEXT,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_intake_grants_email ON intake_magic_link_grants(email_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_intake_grants_expiry ON intake_magic_link_grants(expires_at);
CREATE INDEX IF NOT EXISTS idx_intake_grants_session ON intake_magic_link_grants(session_hash);

CREATE TABLE IF NOT EXISTS intake_drafts (
  id TEXT PRIMARY KEY,
  owner_hash TEXT NOT NULL,
  lane TEXT NOT NULL,
  form_version TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intake_drafts_owner ON intake_drafts(owner_hash, updated_at);
CREATE INDEX IF NOT EXISTS idx_intake_drafts_expiry ON intake_drafts(expires_at);

CREATE TABLE IF NOT EXISTS intake_submissions (
  submission_id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  supersedes_submission_id TEXT,
  form_id TEXT NOT NULL,
  form_version TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  identity_json TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  consents_json TEXT NOT NULL,
  client_context_json TEXT NOT NULL,
  client_reviewed INTEGER NOT NULL CHECK (client_reviewed = 1),
  payload_hash TEXT NOT NULL,
  idempotency_key_hash TEXT NOT NULL UNIQUE,
  receipt_json TEXT NOT NULL,
  retention_basis TEXT,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (supersedes_submission_id) REFERENCES intake_submissions(submission_id)
);

CREATE INDEX IF NOT EXISTS idx_intake_submissions_intake ON intake_submissions(intake_id, revision);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_expiry ON intake_submissions(expires_at, retention_basis);

CREATE TABLE IF NOT EXISTS intake_routing_decisions (
  decision_id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL UNIQUE,
  intake_id TEXT NOT NULL,
  submission_id TEXT NOT NULL UNIQUE,
  ruleset_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  agent_contract_version TEXT NOT NULL,
  input_revision_hash TEXT NOT NULL,
  minimized_projection_hash TEXT NOT NULL,
  analyzer_kind TEXT NOT NULL CHECK (analyzer_kind IN ('deterministic', 'nest')),
  analyzer_id TEXT NOT NULL,
  analyzer_version TEXT NOT NULL,
  proposal_state TEXT NOT NULL CHECK (proposal_state IN ('active', 'stale', 'approved', 'expired', 'cancelled')),
  primary_route TEXT NOT NULL,
  classification TEXT NOT NULL,
  decision_json TEXT NOT NULL,
  client_reviewed INTEGER NOT NULL CHECK (client_reviewed = 1),
  created_at TEXT NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES intake_submissions(submission_id)
);

CREATE TABLE IF NOT EXISTS intake_outbox (
  outbox_id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  submission_id TEXT NOT NULL UNIQUE,
  proposal_id TEXT NOT NULL,
  revision_hash TEXT NOT NULL,
  event_type TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('held_for_review', 'approved', 'dispatched', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  acknowledged_at TEXT,
  acknowledgment_outcome TEXT CHECK (acknowledgment_outcome IS NULL OR acknowledgment_outcome IN ('received', 'duplicate', 'conflict_quarantined', 'rejected')),
  local_receipt_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES intake_submissions(submission_id),
  FOREIGN KEY (proposal_id) REFERENCES intake_routing_decisions(proposal_id)
);

CREATE INDEX IF NOT EXISTS idx_intake_outbox_state ON intake_outbox(state, created_at);

CREATE TABLE IF NOT EXISTS intake_audit_events (
  audit_id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  submission_id TEXT,
  event_type TEXT NOT NULL,
  actor_class TEXT NOT NULL,
  request_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intake_audit_intake ON intake_audit_events(intake_id, created_at);

CREATE TABLE IF NOT EXISTS intake_revision_conflicts (
  conflict_id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  existing_hash TEXT NOT NULL,
  received_hash TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state = 'quarantined'),
  request_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intake_conflicts_submission ON intake_revision_conflicts(submission_id, created_at);
