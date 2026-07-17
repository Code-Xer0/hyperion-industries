-- Delivery acknowledgement is transport evidence only. It can never express
-- operator approval, dispatch, or acceptance as business truth.
UPDATE intake_consumer_receipts
SET accepted_business_truth = 0
WHERE accepted_business_truth <> 0;

CREATE TRIGGER IF NOT EXISTS trg_intake_consumer_receipts_truth_insert
BEFORE INSERT ON intake_consumer_receipts
WHEN NEW.accepted_business_truth <> 0
BEGIN
  SELECT RAISE(ABORT, 'delivery_receipt_cannot_accept_business_truth');
END;

CREATE TRIGGER IF NOT EXISTS trg_intake_consumer_receipts_truth_update
BEFORE UPDATE OF accepted_business_truth ON intake_consumer_receipts
WHEN NEW.accepted_business_truth <> 0
BEGIN
  SELECT RAISE(ABORT, 'delivery_receipt_cannot_accept_business_truth');
END;
