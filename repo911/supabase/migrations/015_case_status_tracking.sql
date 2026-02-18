-- 015_case_status_tracking.sql
-- Add case status tracking columns and policies to fee_tracking table

ALTER TABLE fee_tracking
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS settlement_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS outcome_notes TEXT;

-- Index for attorney case filtering queries
CREATE INDEX IF NOT EXISTS idx_fee_tracking_attorney_status
  ON fee_tracking (attorney_id, case_status);

-- Attorney can update their own fee_tracking records
CREATE POLICY "Attorneys can update own fee_tracking"
  ON fee_tracking FOR UPDATE TO authenticated
  USING (attorney_id = get_attorney_id(auth.uid()))
  WITH CHECK (attorney_id = get_attorney_id(auth.uid()));

-- Admin can update any fee_tracking record
CREATE POLICY "Admins can update fee_tracking"
  ON fee_tracking FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
