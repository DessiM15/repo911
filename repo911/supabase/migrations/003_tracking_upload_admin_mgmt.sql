-- Storage bucket for lead evidence uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-evidence', 'lead-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Allow service role to manage files in the lead-evidence bucket
CREATE POLICY "Service role can manage files"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'lead-evidence')
  WITH CHECK (bucket_id = 'lead-evidence');

-- Admin management: allow admins to read all admin records
DROP POLICY IF EXISTS "Admins read own record" ON admins;

CREATE POLICY "Admins read all admin records"
  ON admins FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE supabase_auth_id = auth.uid()));

-- Admin management: allow admins to create other admins
CREATE POLICY "Admins can create other admins"
  ON admins FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE supabase_auth_id = auth.uid()));
