-- ============================================
-- Migration 007: Admin Audit Log + UTM Columns
-- ============================================

-- 1. Admin Audit Log table
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT
);

CREATE INDEX idx_audit_log_admin_id ON admin_audit_log (admin_id);
CREATE INDEX idx_audit_log_entity ON admin_audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log (created_at DESC);

-- 2. UTM tracking columns on leads
ALTER TABLE leads ADD COLUMN utm_source TEXT;
ALTER TABLE leads ADD COLUMN utm_medium TEXT;
ALTER TABLE leads ADD COLUMN utm_campaign TEXT;
ALTER TABLE leads ADD COLUMN utm_content TEXT;
ALTER TABLE leads ADD COLUMN utm_term TEXT;
ALTER TABLE leads ADD COLUMN referrer TEXT;
