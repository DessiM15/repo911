import { z } from 'zod';

export const intakeFormSchema = z.object({
  // Section 1: Contact Information
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(
    /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
    'Please enter a valid phone number (e.g., (555) 555-5555)'
  ),
  preferred_contact: z.enum(['phone', 'email', 'text'], {
    message: 'Please select a preferred contact method',
  }),
  best_time_to_contact: z.enum(['morning', 'afternoon', 'evening', 'anytime']).optional(),
  street_address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().regex(/^\d{5}$/, 'Please enter a valid 5-digit ZIP code'),

  // Section 2: Vehicle Information
  vehicle_year: z.coerce.number().min(1990, 'Year must be 1990 or later').max(2026, 'Year cannot be after 2026'),
  vehicle_make: z.string().min(1, 'Vehicle make is required'),
  vehicle_model: z.string().min(1, 'Vehicle model is required'),
  vehicle_color: z.string().optional(),
  vin: z.string().optional().refine(
    (val) => !val || val.length === 17,
    'VIN must be exactly 17 characters'
  ),
  lease_or_finance: z.enum(['financed', 'leased', 'not_sure'], {
    message: 'Please select an option',
  }),

  // Section 3: Lender / Creditor Information
  lender_name: z.string().min(1, 'Lender name is required'),
  repo_company_name: z.string().optional(),
  behind_on_payments: z.enum(['yes', 'no', 'not_sure'], {
    message: 'Please select an option',
  }),
  payments_behind: z.coerce.number().optional(),
  contacted_lender_about_arrangements: z.boolean().optional(),
  received_written_notice: z.enum(['yes', 'no', 'not_sure'], {
    message: 'Please select an option',
  }),

  // Section 4: Repossession Details
  repo_date: z.string().min(1, 'Repossession date is required'),
  repo_time_of_day: z.enum(['early_morning', 'morning', 'afternoon', 'evening', 'not_sure'], {
    message: 'Please select a time of day',
  }),
  repo_location: z.array(z.string()).min(1, 'Please select at least one location'),
  repo_state: z.string().min(1, 'State is required'),

  // Section 5: Breach of Peace
  verbally_objected: z.enum(['yes', 'no', 'not_sure'], {
    message: 'Please select an option',
  }),
  continued_after_objection: z.enum(['yes', 'no']).optional(),
  physical_force_or_threats: z.boolean(),
  excessive_noise: z.boolean(),
  entered_locked_area: z.boolean(),
  property_damage: z.boolean(),
  police_present: z.boolean(),
  police_assisted: z.enum(['yes', 'no', 'not_sure']).optional(),
  repo_at_workplace: z.boolean(),
  public_embarrassment: z.boolean(),
  narrative: z.string().min(50, 'Please provide at least 50 characters describing what happened'),

  // Section 6: Personal Belongings
  had_belongings: z.boolean(),
  belongings_returned: z.enum(['yes', 'no', 'some']).optional(),
  belongings_list: z.string().optional(),
  belongings_value: z.coerce.number().optional(),
  charged_fee_for_belongings: z.boolean().optional(),

  // Section 7: Post-Repossession
  received_notice_of_sale: z.enum(['yes', 'no', 'not_sure'], {
    message: 'Please select an option',
  }),
  deficiency_balance_contact: z.enum(['yes', 'no', 'not_sure'], {
    message: 'Please select an option',
  }),
  impacts: z.array(z.string()).optional(),
  credit_report_affected: z.enum(['yes', 'no', 'not_sure']).optional(),

  // Section 8: Military Service
  military_service: z.boolean(),
  military_branch: z.enum([
    'army', 'navy', 'air_force', 'marines', 'coast_guard',
    'space_force', 'national_guard', 'reserves',
  ]).optional(),
  active_duty_at_repo: z.boolean().optional(),
  loan_before_active_duty: z.enum(['yes', 'no', 'not_sure']).optional(),

  // Section 9: FDCPA
  debt_collector_contact: z.boolean(),
  fdcpa_violations: z.array(z.string()).optional(),

  // Section 10: Evidence
  has_photos_videos: z.boolean(),
  has_documents: z.boolean(),
  has_witnesses: z.boolean(),
  witness_info: z.string().optional(),

  // Section 11: Consent
  electronic_signature: z.string().min(1, 'Electronic signature is required'),
  consent_accurate_info: z.literal(true, {
    error: 'You must certify this information is accurate',
  }),
  consent_not_legal_advice: z.literal(true, {
    error: 'You must acknowledge this is not legal advice',
  }),
  consent_contact: z.literal(true, {
    error: 'You must consent to being contacted',
  }),
  consent_privacy_policy: z.literal(true, {
    error: 'You must agree to the Privacy Policy and Terms of Service',
  }),
});

export type IntakeFormData = z.infer<typeof intakeFormSchema>;

// Input type for the form (before validation) — consent fields are boolean, not literal true
export type IntakeFormInput = Omit<IntakeFormData, 'consent_accurate_info' | 'consent_not_legal_advice' | 'consent_contact' | 'consent_privacy_policy'> & {
  consent_accurate_info: boolean;
  consent_not_legal_advice: boolean;
  consent_contact: boolean;
  consent_privacy_policy: boolean;
};
