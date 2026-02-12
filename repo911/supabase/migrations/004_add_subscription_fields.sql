-- ============================================================
-- 004: Add subscription fields for monthly unlimited plan
-- ============================================================

-- Add subscription columns to attorneys table
ALTER TABLE attorneys
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Add CHECK constraints for valid values
ALTER TABLE attorneys
  ADD CONSTRAINT chk_subscription_plan
    CHECK (subscription_plan IS NULL OR subscription_plan IN ('per_lead', 'monthly_unlimited'));

ALTER TABLE attorneys
  ADD CONSTRAINT chk_subscription_status
    CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'past_due', 'canceled', 'incomplete'));

-- Add payment_type column to transactions table
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'per_lead';

ALTER TABLE transactions
  ADD CONSTRAINT chk_payment_type
    CHECK (payment_type IN ('per_lead', 'subscription'));
