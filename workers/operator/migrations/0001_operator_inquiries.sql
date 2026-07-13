CREATE TABLE IF NOT EXISTS operator_inquiries (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  inquiry_type TEXT NOT NULL CHECK (
    inquiry_type IN (
      'contact',
      'field_work',
      'card_studio_order',
      'beta_access',
      'demo_request',
      'chronos_beta_issue',
      'partnership_funding'
    )
  ),
  timeline TEXT,
  message TEXT NOT NULL,
  source_path TEXT NOT NULL,
  consent_contact INTEGER NOT NULL CHECK (consent_contact = 1),
  consent_version TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    notification_status IN ('pending', 'sent')
  ),
  notification_attempts INTEGER NOT NULL DEFAULT 0 CHECK (notification_attempts >= 0),
  notified_at TEXT,
  last_notification_error_code TEXT
);

CREATE INDEX IF NOT EXISTS idx_operator_inquiries_expires_at
  ON operator_inquiries (expires_at);

CREATE INDEX IF NOT EXISTS idx_operator_inquiries_created_at
  ON operator_inquiries (created_at);

CREATE INDEX IF NOT EXISTS idx_operator_inquiries_notification_status
  ON operator_inquiries (notification_status, created_at);
