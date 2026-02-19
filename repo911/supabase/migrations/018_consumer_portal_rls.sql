-- 018: Consumer Portal — RLS policies for authenticated consumers
-- Allows consumers to read their own leads, fee_tracking, messages,
-- and insert messages for claimed leads.

-- Performance index for email-based lookups
CREATE INDEX IF NOT EXISTS idx_leads_email_lower ON leads (lower(email));

-- 1. Consumers can SELECT their own leads
CREATE POLICY consumer_select_own_leads ON leads
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(auth.email()));

-- 2. Consumers can SELECT fee_tracking rows for their own leads
CREATE POLICY consumer_select_own_fee_tracking ON fee_tracking
  FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE lower(email) = lower(auth.email())
    )
  );

-- 3. Consumers can SELECT messages for their own leads
CREATE POLICY consumer_select_own_messages ON messages
  FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE lower(email) = lower(auth.email())
    )
  );

-- 4. Consumers can INSERT messages for their own *claimed* leads (sender_type = 'consumer')
CREATE POLICY consumer_insert_own_messages ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_type = 'consumer'
    AND lead_id IN (
      SELECT id FROM leads
      WHERE lower(email) = lower(auth.email())
        AND claimed_by IS NOT NULL
    )
  );
