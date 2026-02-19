-- =====================================================================
-- 020: Email Verification for Lead Submission Flow
-- =====================================================================
-- Leads are hidden from the attorney marketplace until the consumer
-- verifies their email via a link sent after intake submission.
-- =====================================================================

-- 1. Add email_verified flag to leads
ALTER TABLE leads ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for marketplace query performance
CREATE INDEX idx_leads_email_verified ON leads (email_verified);

-- 2. Verification tokens table
CREATE TABLE lead_email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  token      UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);

CREATE INDEX idx_lead_email_verifications_token   ON lead_email_verifications (token);
CREATE INDEX idx_lead_email_verifications_lead_id ON lead_email_verifications (lead_id);

-- RLS: admin-only access
ALTER TABLE lead_email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email verifications"
  ON lead_email_verifications FOR ALL
  USING (is_admin(auth.uid()));

-- 3. Update attorney RLS policy on leads: add email_verified = TRUE
--    to the unclaimed-leads branch so unverified leads are hidden
--    from attorneys. Attorneys can still see their own claimed leads.
DROP POLICY IF EXISTS "Attorneys see qualified unclaimed leads" ON leads;

CREATE POLICY "Attorneys see qualified unclaimed leads"
  ON leads FOR SELECT
  USING (
    is_admin(auth.uid())
    OR (
      status IN ('qualified_hot', 'qualified_warm', 'qualified_cold')
      AND claimed_by IS NULL
      AND email_verified = TRUE
    )
    OR (
      claimed_by = get_attorney_id(auth.uid())
    )
  );

-- 4. Backfill: mark existing qualified/claimed leads as verified
--    so they remain visible in production.
UPDATE leads
SET email_verified = TRUE
WHERE status IN ('qualified_hot', 'qualified_warm', 'qualified_cold', 'claimed');
