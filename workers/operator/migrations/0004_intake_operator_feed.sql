-- Founder Command delivery receipts. These never advance the intake business outbox.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS intake_consumer_receipts (
  consumer_id TEXT NOT NULL,
  outbox_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  revision_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  local_receipt_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('received', 'duplicate', 'conflict_quarantined', 'rejected')),
  accepted_business_truth INTEGER NOT NULL CHECK (accepted_business_truth IN (0, 1)),
  first_seen_at TEXT NOT NULL,
  acknowledged_at TEXT NOT NULL,
  PRIMARY KEY (consumer_id, outbox_id),
  FOREIGN KEY (outbox_id) REFERENCES intake_outbox(outbox_id),
  FOREIGN KEY (submission_id) REFERENCES intake_submissions(submission_id)
);

CREATE INDEX IF NOT EXISTS idx_intake_consumer_receipts_submission
  ON intake_consumer_receipts(consumer_id, submission_id, acknowledged_at);
