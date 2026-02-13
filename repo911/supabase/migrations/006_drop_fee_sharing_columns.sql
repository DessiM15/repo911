-- Migration: Drop legacy fee-sharing columns from fee_tracking
-- The old revenue-share model (Repo911 takes a % of attorney case outcomes)
-- has been replaced by the upfront lead purchase model. These columns are no
-- longer referenced by application code.

ALTER TABLE fee_tracking
  DROP COLUMN IF EXISTS repo911_share,
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS payment_due_date,
  DROP COLUMN IF EXISTS payment_received_date;
