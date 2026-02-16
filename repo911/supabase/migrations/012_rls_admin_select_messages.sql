-- RLS policy for admin SELECT on the messages table
-- The messages table (009_messaging.sql) has RLS enabled with attorney policies
-- but no admin SELECT policy, blocking admin users from reading messages
-- through the Supabase client (non-service-role).

CREATE POLICY "admins_select_all_messages"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins WHERE supabase_auth_id = auth.uid()
  )
);
