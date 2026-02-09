-- ============================================
-- Repo911 — Initial Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== ATTORNEYS ==========
CREATE TABLE attorneys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  supabase_auth_id UUID UNIQUE NOT NULL,

  -- Profile
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  firm_name TEXT,
  bar_number TEXT NOT NULL,
  bar_state TEXT NOT NULL,
  licensed_states JSONB,
  website TEXT,
  profile_photo_url TEXT,

  -- Onboarding
  fee_agreement_signed BOOLEAN DEFAULT FALSE,
  fee_agreement_signed_at TIMESTAMPTZ,
  fee_agreement_ip TEXT,
  fee_agreement_document_url TEXT,

  -- Stripe
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,

  -- Preferences
  preferred_states JSONB,
  preferred_case_types JSONB,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,

  -- Status
  status TEXT DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT FALSE
);

-- ========== LEADS ==========
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',

  -- Contact Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_contact TEXT,
  best_time_to_contact TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT NOT NULL,
  zip_code TEXT,

  -- Vehicle Info
  vehicle_year INT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vin TEXT,
  lease_or_finance TEXT,

  -- Lender Info
  lender_name TEXT,
  repo_company_name TEXT,
  behind_on_payments TEXT,
  payments_behind INT,
  contacted_lender_about_arrangements BOOLEAN,
  received_written_notice TEXT,

  -- Repo Details
  repo_date DATE,
  repo_time_of_day TEXT,
  repo_location JSONB,
  repo_state TEXT,

  -- Breach of Peace
  verbally_objected TEXT,
  continued_after_objection TEXT,
  physical_force_or_threats BOOLEAN DEFAULT FALSE,
  excessive_noise BOOLEAN DEFAULT FALSE,
  entered_locked_area BOOLEAN DEFAULT FALSE,
  property_damage BOOLEAN DEFAULT FALSE,
  police_present BOOLEAN DEFAULT FALSE,
  police_assisted TEXT,
  repo_at_workplace BOOLEAN DEFAULT FALSE,
  public_embarrassment BOOLEAN DEFAULT FALSE,
  narrative TEXT,

  -- Personal Belongings
  had_belongings BOOLEAN DEFAULT FALSE,
  belongings_returned TEXT,
  belongings_list TEXT,
  belongings_value DECIMAL,
  charged_fee_for_belongings BOOLEAN DEFAULT FALSE,

  -- Post-Repo
  received_notice_of_sale TEXT,
  deficiency_balance_contact TEXT,
  impacts JSONB,
  credit_report_affected TEXT,

  -- Military
  military_service BOOLEAN DEFAULT FALSE,
  military_branch TEXT,
  active_duty_at_repo BOOLEAN DEFAULT FALSE,
  loan_before_active_duty TEXT,

  -- FDCPA
  debt_collector_contact BOOLEAN DEFAULT FALSE,
  fdcpa_violations JSONB,

  -- Evidence
  has_photos_videos BOOLEAN DEFAULT FALSE,
  has_documents BOOLEAN DEFAULT FALSE,
  has_witnesses BOOLEAN DEFAULT FALSE,
  witness_info TEXT,

  -- File references
  uploaded_files JSONB,

  -- Qualification
  qualification_score INT DEFAULT 0,
  qualification_tier TEXT,
  qualification_breakdown JSONB,

  -- Claim
  claimed_by UUID REFERENCES attorneys(id),
  claimed_at TIMESTAMPTZ,
  claim_price DECIMAL,
  stripe_payment_id TEXT,

  -- Consent
  electronic_signature TEXT NOT NULL,
  consent_accurate_info BOOLEAN DEFAULT TRUE,
  consent_not_legal_advice BOOLEAN DEFAULT TRUE,
  consent_contact BOOLEAN DEFAULT TRUE,
  consent_privacy_policy BOOLEAN DEFAULT TRUE,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT
);

-- ========== ADMIN USERS ==========
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== TRANSACTIONS ==========
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attorney_id UUID REFERENCES attorneys(id),
  lead_id UUID REFERENCES leads(id),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  description TEXT,
  receipt_url TEXT
);

-- ========== FEE TRACKING ==========
CREATE TABLE fee_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  transaction_id UUID REFERENCES transactions(id),
  attorney_id UUID REFERENCES attorneys(id),
  lead_id UUID REFERENCES leads(id),
  case_status TEXT DEFAULT 'open',
  attorney_total_fee DECIMAL,
  repo911_share DECIMAL,
  payment_status TEXT DEFAULT 'pending',
  payment_due_date DATE,
  payment_received_date DATE,
  notes TEXT
);

-- ========== CRM CONTACTS ==========
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contact_type TEXT NOT NULL,
  source_lead_id UUID REFERENCES leads(id),
  source_attorney_id UUID REFERENCES attorneys(id),

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  state TEXT,
  city TEXT,

  tags JSONB,
  notes JSONB,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up DATE,
  lifecycle_stage TEXT DEFAULT 'new',

  custom_fields JSONB
);

-- ========== CRM ACTIVITIES ==========
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contact_id UUID REFERENCES crm_contacts(id),
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  performed_by UUID
);

-- ========== NOTIFICATIONS ==========
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_type TEXT NOT NULL,
  recipient_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  link TEXT
);

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE supabase_auth_id = user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: get attorney ID from auth ID
CREATE OR REPLACE FUNCTION get_attorney_id(user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM attorneys WHERE supabase_auth_id = user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ===== LEADS RLS =====

-- Anyone can insert leads (public form submission)
CREATE POLICY "Anyone can submit leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Attorneys see only qualified leads that are not yet claimed, or their own claimed leads
CREATE POLICY "Attorneys see qualified unclaimed leads"
  ON leads FOR SELECT
  USING (
    is_admin(auth.uid())
    OR (
      status IN ('qualified_hot', 'qualified_warm', 'qualified_cold')
      AND claimed_by IS NULL
    )
    OR (
      claimed_by = get_attorney_id(auth.uid())
    )
  );

-- Only admins can update leads
CREATE POLICY "Admins can update leads"
  ON leads FOR UPDATE
  USING (is_admin(auth.uid()));

-- ===== ATTORNEYS RLS =====

-- Attorneys can read their own record
CREATE POLICY "Attorneys read own record"
  ON attorneys FOR SELECT
  USING (
    supabase_auth_id = auth.uid()
    OR is_admin(auth.uid())
  );

-- Attorneys can update their own record
CREATE POLICY "Attorneys update own record"
  ON attorneys FOR UPDATE
  USING (supabase_auth_id = auth.uid() OR is_admin(auth.uid()));

-- Anyone can insert (registration)
CREATE POLICY "Anyone can register as attorney"
  ON attorneys FOR INSERT
  WITH CHECK (true);

-- ===== ADMINS RLS =====

CREATE POLICY "Admins read own record"
  ON admins FOR SELECT
  USING (supabase_auth_id = auth.uid());

-- ===== TRANSACTIONS RLS =====

CREATE POLICY "Attorneys see own transactions"
  ON transactions FOR SELECT
  USING (
    attorney_id = get_attorney_id(auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "System can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- ===== FEE TRACKING RLS =====

CREATE POLICY "Attorneys see own fee tracking"
  ON fee_tracking FOR SELECT
  USING (
    attorney_id = get_attorney_id(auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "System can insert fee tracking"
  ON fee_tracking FOR INSERT
  WITH CHECK (true);

-- ===== CRM RLS (Admin only) =====

CREATE POLICY "Admins only on crm_contacts"
  ON crm_contacts FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins only on crm_activities"
  ON crm_activities FOR ALL
  USING (is_admin(auth.uid()));

-- ===== NOTIFICATIONS RLS =====

CREATE POLICY "Recipients see own notifications"
  ON notifications FOR SELECT
  USING (
    recipient_id = get_attorney_id(auth.uid())
    OR recipient_id::text = auth.uid()::text
    OR is_admin(auth.uid())
  );

CREATE POLICY "Recipients can update own notifications"
  ON notifications FOR UPDATE
  USING (
    recipient_id = get_attorney_id(auth.uid())
    OR recipient_id::text = auth.uid()::text
  );

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_qualification_tier ON leads(qualification_tier);
CREATE INDEX idx_leads_repo_state ON leads(repo_state);
CREATE INDEX idx_leads_claimed_by ON leads(claimed_by);
CREATE INDEX idx_leads_created_at ON leads(created_at);

CREATE INDEX idx_attorneys_supabase_auth_id ON attorneys(supabase_auth_id);
CREATE INDEX idx_attorneys_status ON attorneys(status);
CREATE INDEX idx_attorneys_email ON attorneys(email);

CREATE INDEX idx_transactions_attorney_id ON transactions(attorney_id);
CREATE INDEX idx_transactions_lead_id ON transactions(lead_id);

CREATE INDEX idx_fee_tracking_attorney_id ON fee_tracking(attorney_id);
CREATE INDEX idx_fee_tracking_lead_id ON fee_tracking(lead_id);

CREATE INDEX idx_crm_contacts_contact_type ON crm_contacts(contact_type);
CREATE INDEX idx_crm_contacts_source_lead_id ON crm_contacts(source_lead_id);

CREATE INDEX idx_crm_activities_contact_id ON crm_activities(contact_id);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================
-- Updated_at trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER attorneys_updated_at
  BEFORE UPDATE ON attorneys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Storage bucket for lead evidence
-- ============================================
-- Run in Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lead-evidence', 'lead-evidence', false);
