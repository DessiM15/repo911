// ============================================
// Repo911 — TypeScript Type Definitions
// ============================================

// ---------- Enums / Union Types ----------

export type LeadStatus =
  | 'pending'
  | 'qualified_hot'
  | 'qualified_warm'
  | 'qualified_cold'
  | 'disqualified'
  | 'claimed'
  | 'closed';

export type QualificationTier = 'hot' | 'warm' | 'cold' | 'disqualified';

export type AttorneyStatus = 'pending' | 'active' | 'suspended' | 'deactivated';

export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type CaseStatus = 'open' | 'in_progress' | 'settled' | 'dismissed' | 'closed' | 'paid';

export type ContactType = 'consumer' | 'attorney';

export type LifecycleStage = 'new' | 'contacted' | 'engaged' | 'converted' | 'closed';

export type ActivityType =
  | 'note'
  | 'email_sent'
  | 'call'
  | 'status_change'
  | 'lead_claimed'
  | 'payment';

export type NotificationType = 'new_lead' | 'lead_claimed' | 'payment_received' | 'system';

export type RecipientType = 'attorney' | 'admin';

export type SubscriptionPlan = 'per_lead' | 'monthly_unlimited';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete';

export type AdminRole = 'admin' | 'super_admin';

export type PreferredContact = 'phone' | 'email' | 'text';

export type BestTimeToContact = 'morning' | 'afternoon' | 'evening' | 'anytime';

export type LeaseOrFinance = 'financed' | 'leased' | 'not_sure';

export type YesNoNotSure = 'yes' | 'no' | 'not_sure';

export type YesNo = 'yes' | 'no';

export type BelongingsReturned = 'yes' | 'no' | 'some';

export type RepoTimeOfDay =
  | 'early_morning'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'not_sure';

export type MilitaryBranch =
  | 'army'
  | 'navy'
  | 'air_force'
  | 'marines'
  | 'coast_guard'
  | 'space_force'
  | 'national_guard'
  | 'reserves';

// ---------- Database Models ----------

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  status: LeadStatus;

  // Contact Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_contact: PreferredContact | null;
  best_time_to_contact: BestTimeToContact | null;
  street_address: string | null;
  city: string | null;
  state: string;
  zip_code: string | null;

  // Vehicle Info
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vin: string | null;
  lease_or_finance: LeaseOrFinance | null;

  // Lender Info
  lender_name: string | null;
  repo_company_name: string | null;
  behind_on_payments: YesNoNotSure | null;
  payments_behind: number | null;
  contacted_lender_about_arrangements: boolean | null;
  received_written_notice: YesNoNotSure | null;

  // Repo Details
  repo_date: string | null;
  repo_time_of_day: RepoTimeOfDay | null;
  repo_location: string[] | null;
  repo_state: string | null;

  // Breach of Peace
  verbally_objected: YesNoNotSure | null;
  continued_after_objection: YesNo | null;
  physical_force_or_threats: boolean;
  excessive_noise: boolean;
  entered_locked_area: boolean;
  property_damage: boolean;
  police_present: boolean;
  police_assisted: YesNoNotSure | null;
  repo_at_workplace: boolean;
  public_embarrassment: boolean;
  narrative: string | null;

  // Personal Belongings
  had_belongings: boolean;
  belongings_returned: BelongingsReturned | null;
  belongings_list: string | null;
  belongings_value: number | null;
  charged_fee_for_belongings: boolean;

  // Post-Repo
  received_notice_of_sale: YesNoNotSure | null;
  deficiency_balance_contact: YesNoNotSure | null;
  impacts: string[] | null;
  credit_report_affected: YesNoNotSure | null;

  // Military
  military_service: boolean;
  military_branch: MilitaryBranch | null;
  active_duty_at_repo: boolean;
  loan_before_active_duty: YesNoNotSure | null;

  // FDCPA
  debt_collector_contact: boolean;
  fdcpa_violations: string[] | null;

  // Evidence
  has_photos_videos: boolean;
  has_documents: boolean;
  has_witnesses: boolean;
  witness_info: string | null;

  // File references
  uploaded_files: UploadedFile[] | null;

  // Qualification
  qualification_score: number;
  qualification_tier: QualificationTier | null;
  qualification_breakdown: QualificationBreakdown | null;

  // Claim
  claimed_by: string | null;
  claimed_at: string | null;
  claim_price: number | null;
  stripe_payment_id: string | null;

  // Consent
  electronic_signature: string;
  consent_accurate_info: boolean;
  consent_not_legal_advice: boolean;
  consent_contact: boolean;
  consent_privacy_policy: boolean;

  // Metadata
  ip_address: string | null;
  user_agent: string | null;

  // UTM / Marketing Attribution
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
}

export interface UploadedFile {
  file_name: string;
  storage_path: string;
  file_type: string;
  size: number;
}

export interface QualificationBreakdown {
  breach_of_peace: number;
  belongings: number;
  military: number;
  fdcpa: number;
  notice: number;
  evidence: number;
  penalties: number;
  details: string[];
}

export interface Attorney {
  id: string;
  created_at: string;
  updated_at: string;
  supabase_auth_id: string;

  // Profile
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  firm_name: string | null;
  bar_number: string;
  bar_state: string;
  licensed_states: string[] | null;
  website: string | null;
  profile_photo_url: string | null;

  // Onboarding
  fee_agreement_signed: boolean;
  fee_agreement_signed_at: string | null;
  fee_agreement_ip: string | null;
  fee_agreement_document_url: string | null;

  // Stripe
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;

  // Preferences
  preferred_states: string[] | null;
  preferred_case_types: string[] | null;
  email_notifications: boolean;
  sms_notifications: boolean;

  // Subscription
  subscription_plan: SubscriptionPlan | null;
  subscription_status: SubscriptionStatus | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean;

  // Status
  status: AttorneyStatus;
  is_verified: boolean;
}

export interface Admin {
  id: string;
  supabase_auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AdminRole;
  created_at: string;
}

export interface Transaction {
  id: string;
  created_at: string;
  attorney_id: string;
  lead_id: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string | null;
  receipt_url: string | null;
  payment_type: 'per_lead' | 'subscription';
}

export interface FeeTracking {
  id: string;
  created_at: string;
  transaction_id: string;
  attorney_id: string;
  lead_id: string;
  case_status: CaseStatus;
  attorney_total_fee: number | null;
  notes: string | null;
}

export interface CrmContact {
  id: string;
  created_at: string;
  updated_at: string;
  contact_type: ContactType;
  source_lead_id: string | null;
  source_attorney_id: string | null;

  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  state: string | null;
  city: string | null;

  tags: string[] | null;
  notes: CrmNote[] | null;
  last_contacted_at: string | null;
  next_follow_up: string | null;
  lifecycle_stage: LifecycleStage;

  custom_fields: Record<string, unknown> | null;
}

export interface CrmNote {
  timestamp: string;
  author: string;
  note_text: string;
}

export interface CrmActivity {
  id: string;
  created_at: string;
  contact_id: string;
  activity_type: ActivityType;
  description: string | null;
  metadata: Record<string, unknown> | null;
  performed_by: string | null;
}

export interface Notification {
  id: string;
  created_at: string;
  recipient_type: RecipientType;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType | null;
  read: boolean;
  read_at: string | null;
  link: string | null;
}

// ---------- API Types ----------

export interface LeadSubmission {
  // Contact Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_contact: PreferredContact;
  best_time_to_contact?: BestTimeToContact;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;

  // Vehicle Info
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color?: string;
  vin?: string;
  lease_or_finance: LeaseOrFinance;

  // Lender Info
  lender_name: string;
  repo_company_name?: string;
  behind_on_payments: YesNoNotSure;
  payments_behind?: number;
  contacted_lender_about_arrangements?: boolean;
  received_written_notice: YesNoNotSure;

  // Repo Details
  repo_date: string;
  repo_time_of_day: RepoTimeOfDay;
  repo_location: string[];
  repo_state: string;

  // Breach of Peace
  verbally_objected: YesNoNotSure;
  continued_after_objection?: YesNo;
  physical_force_or_threats: boolean;
  excessive_noise: boolean;
  entered_locked_area: boolean;
  property_damage: boolean;
  police_present: boolean;
  police_assisted?: YesNoNotSure;
  repo_at_workplace: boolean;
  public_embarrassment: boolean;
  narrative: string;

  // Personal Belongings
  had_belongings: boolean;
  belongings_returned?: BelongingsReturned;
  belongings_list?: string;
  belongings_value?: number;
  charged_fee_for_belongings?: boolean;

  // Post-Repo
  received_notice_of_sale: YesNoNotSure;
  deficiency_balance_contact: YesNoNotSure;
  impacts?: string[];
  credit_report_affected?: YesNoNotSure;

  // Military
  military_service: boolean;
  military_branch?: MilitaryBranch;
  active_duty_at_repo?: boolean;
  loan_before_active_duty?: YesNoNotSure;

  // FDCPA
  debt_collector_contact: boolean;
  fdcpa_violations?: string[];

  // Evidence
  has_photos_videos: boolean;
  has_documents: boolean;
  has_witnesses: boolean;
  witness_info?: string;

  // Consent
  electronic_signature: string;
  consent_accurate_info: boolean;
  consent_not_legal_advice: boolean;
  consent_contact: boolean;
  consent_privacy_policy: boolean;
}

export interface MarketplaceLead {
  id: string;
  qualification_tier: QualificationTier;
  qualification_score: number;
  repo_state: string;
  repo_date: string;
  lender_name: string | null;
  violation_types: string[];
  estimated_value_range: string;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  has_evidence: boolean;
  fdcpa_violation_count: number;
  narrative_preview: string | null;
  qualification_breakdown: QualificationBreakdown | null;
  created_at: string;
}

export interface LeadClaimPrice {
  hot: number;
  warm: number;
  cold: number;
}

// ---------- Error Tracking ----------

export type ErrorLevel = 'error' | 'warning' | 'fatal' | 'info';

export type ErrorStatus = 'unresolved' | 'resolved' | 'ignored' | 'muted';

export interface TrackedError {
  id: string;
  created_at: string;
  updated_at: string;
  fingerprint: string;
  error_type: string;
  message: string;
  environment: string;
  platform: string | null;
  level: ErrorLevel;
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  status: ErrorStatus;
  assigned_to: string | null;
  tags: string[];
}

export interface ErrorOccurrence {
  id: string;
  created_at: string;
  error_id: string;
  stack_trace: string | null;
  source_file: string | null;
  line_number: number | null;
  column_number: number | null;
  user_id: string | null;
  user_ip: string | null;
  user_agent: string | null;
  url: string | null;
  http_method: string | null;
  query_params: Record<string, unknown> | null;
  request_headers: Record<string, string> | null;
  breadcrumbs: Breadcrumb[];
  extra_data: Record<string, unknown>;
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  device_type: string | null;
}

export interface Breadcrumb {
  timestamp: number;
  type: 'navigation' | 'click' | 'input' | 'http' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  created_at: string;
  name: string;
  enabled: boolean;
  error_level: string[] | null;
  error_types: string[] | null;
  tags: string[] | null;
  threshold: number;
  time_window: number;
  notification_channels: { email?: string[]; };
  last_triggered: string | null;
}

// ---------- Admin Audit Log ----------

export interface AuditLogEntry {
  id: string;
  created_at: string;
  admin_id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
}
