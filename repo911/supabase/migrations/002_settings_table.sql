-- ============================================
-- Settings Table for Platform Configuration
-- ============================================

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "Admins only on settings"
  ON settings FOR ALL
  USING (is_admin(auth.uid()));

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('lead_price_hot', '15000'),
  ('lead_price_warm', '10000'),
  ('lead_price_cold', '5000'),
  ('notification_email_from', '"notify@repo911.com"'),
  ('platform_name', '"Repo911"'),
  ('fee_share_percentage', '50');
