-- Enable Row Level Security on admin_audit_log
-- This table was the only sensitive table without RLS, allowing any
-- authenticated Supabase user to read/write audit records directly.

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit log entries
CREATE POLICY "Admins can view audit log"
  ON admin_audit_log FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can insert audit log entries
CREATE POLICY "Admins can insert audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- No UPDATE or DELETE policies: audit logs are immutable.
