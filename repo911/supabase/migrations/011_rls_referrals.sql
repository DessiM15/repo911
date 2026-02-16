-- RLS policies for the referrals table
-- RLS was enabled in 008_referral_program.sql but no policies were defined,
-- blocking all SELECT/UPDATE for non-service-role clients.

-- 1. Attorneys can read referrals where they are the referrer
CREATE POLICY "attorneys_select_own_referrals"
ON referrals FOR SELECT
TO authenticated
USING (
  referrer_id IN (
    SELECT id FROM attorneys WHERE supabase_auth_id = auth.uid()
  )
);

-- 2. Admins can read all referrals
CREATE POLICY "admins_select_all_referrals"
ON referrals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins WHERE supabase_auth_id = auth.uid()
  )
);

-- 3. Admins can update referrals (completing referrals when activating attorneys)
CREATE POLICY "admins_update_referrals"
ON referrals FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins WHERE supabase_auth_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins WHERE supabase_auth_id = auth.uid()
  )
);
