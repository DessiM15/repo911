# REPO911 — Product Requirements Document (PRD)

## Copy/paste this entire document into Claude Code as your initial prompt.

---

## 1. PROJECT OVERVIEW

**Product Name:** Repo911
**Type:** Full-stack web application (responsive — works as both website and mobile web app)
**Purpose:** Lead generation marketplace that screens consumers for wrongful vehicle repossession claims, qualifies them using rule-based AI logic, and sells qualified leads to attorneys on a first-come, first-serve basis.
**Business Model:** Repo911 earns 50% of the attorney's legal fees for each lead claimed. Attorneys digitally sign a fee-sharing agreement before gaining platform access. One attorney per lead — exclusive claim.

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router) with TypeScript |
| Styling | Tailwind CSS |
| Backend / API | Next.js API Routes (serverless functions) |
| Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Payments | Stripe (Connect for fee-sharing, Checkout for lead purchases) |
| Hosting | Vercel |
| Email | Resend (transactional emails — confirmations, notifications, receipts) |
| File Storage | Supabase Storage (document uploads from consumers) |
| AI Qualification | Rule-based scoring engine (server-side TypeScript function) |

---

## 3. USER ROLES & PORTALS

### 3.1 Consumer Portal (Public-Facing)
- **Who:** People whose vehicles were wrongfully repossessed
- **Access:** No login required — public intake form
- **Design Tone:** Warm, friendly, inviting, empathetic. Use calming colors (soft blue `#4A90D9`, white `#FFFFFF`, warm accent `#F5A623`). Large readable fonts. Mobile-first. The user is stressed — the UI should feel safe and supportive. Think: "We're here to help you fight back."
- **Key Pages:**
  - Landing / Home page
  - Intake screening form
  - Submission confirmation page
  - FAQ / "How It Works" page
  - Privacy Policy page
  - Terms of Service page
  - Disclaimer page ("This is not legal advice")

### 3.2 Attorney Portal (Authenticated)
- **Who:** Licensed attorneys / law firms who purchase leads
- **Access:** Account registration + login required. Must digitally sign fee-sharing agreement before accessing leads.
- **Design Tone:** Professional, clean, corporate. Dark navy `#1B2A4A`, white `#FFFFFF`, accent green `#2ECC71` for CTAs. Minimal, data-driven dashboard. Think: Bloomberg terminal meets legal CRM.
- **Key Pages:**
  - Registration / onboarding (including fee-sharing agreement e-sign)
  - Login
  - Lead marketplace (browse available qualified leads)
  - Lead detail view (partial info visible, full info after purchase)
  - My claimed leads (purchased leads with full contact info)
  - Billing / payment history
  - Profile / settings

### 3.3 Admin Portal (Internal — Repo911 Staff)
- **Who:** Repo911 team members managing the platform
- **Access:** Authenticated admin accounts (Supabase Auth with admin role)
- **Design Tone:** Functional, utilitarian dashboard. Can reuse attorney portal styling.
- **Key Pages:**
  - Dashboard (KPIs: total leads, qualified leads, claimed leads, revenue, conversion rates)
  - All leads list (filterable, sortable, searchable)
  - Lead detail view (full info + qualification score + status history)
  - Attorney management (view all attorneys, their claimed leads, payment status)
  - CRM (see Section 10)
  - Settings / configuration

---

## 4. CONSUMER INTAKE FORM — FULL SPECIFICATION

This is the core of the product. A single-page scrolling form. Sections should be visually separated with clear headers and helper text. Show a progress indicator at the top.

### Section 1: Contact Information
| Field | Type | Required | Notes |
|---|---|---|---|
| First Name | Text | Yes | |
| Last Name | Text | Yes | |
| Email Address | Email | Yes | Validate format |
| Phone Number | Phone | Yes | Format: (XXX) XXX-XXXX |
| Preferred Contact Method | Radio | Yes | Options: Phone, Email, Text Message |
| Best Time to Contact | Select | No | Options: Morning, Afternoon, Evening, Anytime |
| Street Address | Text | Yes | |
| City | Text | Yes | |
| State | Select dropdown | Yes | All 50 US states + DC + territories |
| ZIP Code | Text | Yes | 5-digit validation |

### Section 2: Vehicle Information
| Field | Type | Required | Notes |
|---|---|---|---|
| Vehicle Year | Select (years) | Yes | Range: 1990–2026 |
| Vehicle Make | Text | Yes | |
| Vehicle Model | Text | Yes | |
| Vehicle Color | Text | No | |
| VIN (if known) | Text | No | 17-character validation if provided |
| Was this a leased or financed vehicle? | Radio | Yes | Options: Financed, Leased, Not Sure |

### Section 3: Lender / Creditor Information
| Field | Type | Required | Notes |
|---|---|---|---|
| Lender / Finance Company Name | Text/Select | Yes | Provide common lender dropdown + "Other" with free text. Common lenders: Ally Financial, Santander Consumer USA, Capital One Auto Finance, Credit Acceptance, Westlake Financial, Bridgecrest/DriveTime, Exeter Finance, CarMax Auto Finance, GM Financial, Ford Motor Credit, Toyota Financial Services, Chase Auto Finance, Wells Fargo Auto, PNC Bank Auto, US Bank Auto, BMW Financial, Nissan Motor Acceptance, Hyundai Capital America, CNAC/JD Byrider, Regional Acceptance Corp, Other |
| Repossession Company Name (if known) | Text | No | |
| Were you behind on payments at the time of repossession? | Radio | Yes | Options: Yes, No, Not Sure |
| If yes, how many payments behind? | Select | Conditional | Options: 1, 2, 3, 4, 5+ |
| Had you been in contact with your lender about payment arrangements? | Radio | No | Options: Yes, No |
| Did you receive any written notice before the repossession? | Radio | Yes | Options: Yes, No, Not Sure |

### Section 4: Repossession Details
| Field | Type | Required | Notes |
|---|---|---|---|
| Date of Repossession | Date picker | Yes | Cannot be future date |
| Approximate Time of Day | Select | Yes | Options: Early Morning (12am–6am), Morning (6am–12pm), Afternoon (12pm–6pm), Evening (6pm–12am), Not Sure |
| Where was your vehicle when it was taken? | Checkbox (multi-select) | Yes | Options: Driveway, Street in front of home, Closed/locked garage, Gated community or gated property, Private parking lot, Workplace parking lot, Public parking lot, Other (free text) |
| State where repossession occurred | Select | Yes | Pre-fill from contact info state, allow override |

### Section 5: Breach of Peace Screening (CRITICAL — Primary Qualification Criteria)

**Header text to display:** *"The law protects you from aggressive or unlawful behavior during a repossession. Please check ALL that apply to your experience."*

| Field | Type | Required | Notes |
|---|---|---|---|
| Did you verbally object to the repossession? (e.g., "Stop," "Leave my car," "You can't take it") | Radio | Yes | Yes / No / Not Sure |
| Did the repo agent continue taking the vehicle AFTER you objected? | Radio | Conditional (if objected = Yes) | Yes / No — **HIGH VALUE QUALIFIER** |
| Did the repo agent use physical force, threats, or intimidation? | Radio | Yes | Yes / No |
| Did the repo agent yell, cause a scene, or create excessive noise? | Radio | Yes | Yes / No |
| Did the repo agent enter a locked or gated area without permission? (e.g., closed garage, gated yard, gated community) | Radio | Yes | Yes / No |
| Did the repo agent damage your property during the repossession? (e.g., broke a lock, damaged gate, scratched another vehicle) | Radio | Yes | Yes / No |
| Were police called or present during the repossession? | Radio | Yes | Yes / No |
| If police were present, did they assist or encourage the repo agent? | Radio | Conditional | Yes / No / Not Sure — **HIGH VALUE QUALIFIER (police cannot assist in civil repo)** |
| Did the repo agent come to your workplace? | Radio | Yes | Yes / No |
| Did the repossession happen in a way that caused public embarrassment or humiliation? | Radio | Yes | Yes / No |
| Describe what happened in your own words | Textarea | Yes | Min 50 characters. Prompt: "Please describe the repossession in as much detail as possible. Include what the repo agent said or did, where you were, who witnessed it, and anything else you remember." |

### Section 6: Personal Belongings
| Field | Type | Required | Notes |
|---|---|---|---|
| Did you have personal belongings in the vehicle at the time? | Radio | Yes | Yes / No |
| If yes, were your belongings returned to you? | Radio | Conditional | Yes / No / Some were returned |
| If not returned, what items were in the vehicle? | Textarea | Conditional | Prompt: "List all personal items (laptops, phones, tools, car seats, medications, documents, etc.)" |
| Estimated value of unreturned belongings | Currency input | Conditional | |
| Did the lender or repo company charge you a fee to retrieve your belongings? | Radio | Conditional | Yes / No — **QUALIFIER (this is illegal in many states)** |

### Section 7: Post-Repossession
| Field | Type | Required | Notes |
|---|---|---|---|
| Have you received a Notice of Sale (notice that your vehicle will be sold at auction)? | Radio | Yes | Yes / No / Not Sure |
| Have you been contacted about a deficiency balance (remaining loan amount after the vehicle is sold)? | Radio | Yes | Yes / No / Not Sure |
| Have you experienced any of the following as a result of the repossession? | Checkbox (multi-select) | No | Options: Lost job or missed work, Missed medical appointments, Children couldn't get to school, Emotional distress / anxiety / depression, Negative impact on credit score, Harassment from lender or collections, Other (free text) |
| Has the repossession been reported on your credit report? | Radio | No | Yes / No / Not Sure |

### Section 8: Military Service (SCRA Protection)
| Field | Type | Required | Notes |
|---|---|---|---|
| Are you currently serving or have you recently served in the US military? | Radio | Yes | Yes / No |
| If yes, branch of service | Select | Conditional | Army, Navy, Air Force, Marines, Coast Guard, Space Force, National Guard, Reserves |
| Were you on active duty at the time of the repossession? | Radio | Conditional | Yes / No — **HIGH VALUE QUALIFIER (SCRA violation)** |
| Was your auto loan originated before your active duty service began? | Radio | Conditional | Yes / No / Not Sure |

### Section 9: Illegal Debt Collection (FDCPA Violations)
| Field | Type | Required | Notes |
|---|---|---|---|
| Has any debt collector contacted you about this vehicle? | Radio | Yes | Yes / No |
| If yes, have they done any of the following? | Checkbox (multi-select) | Conditional | Options: Called before 8am or after 9pm, Called your workplace after being told not to, Used abusive or profane language, Threatened arrest or jail, Told friends/family/employer about your debt, Continued calling after you requested they stop in writing, Misrepresented the amount you owe, Failed to send written validation of the debt |

### Section 10: Evidence & Documents
| Field | Type | Required | Notes |
|---|---|---|---|
| Do you have any photos or videos of the repossession? | File upload | No | Accept: jpg, png, mp4, mov. Max 10 files, 25MB each |
| Do you have any documents related to your loan or repossession? | File upload | No | Accept: pdf, jpg, png, doc, docx. E.g., loan agreement, repo notice, correspondence |
| Do you have any witnesses to the repossession? | Radio | No | Yes / No |
| If yes, witness name(s) and contact info | Textarea | Conditional | |

### Section 11: Consent & Submission
| Field | Type | Required | Notes |
|---|---|---|---|
| Electronic Signature (Full Legal Name) | Text | Yes | Must match first + last name |
| Date | Auto-filled | Yes | Today's date |
| Consent checkbox 1 | Checkbox | Yes | "I certify that the information provided is true and accurate to the best of my knowledge." |
| Consent checkbox 2 | Checkbox | Yes | "I understand that submitting this form does not create an attorney-client relationship. This is not legal advice." |
| Consent checkbox 3 | Checkbox | Yes | "I consent to being contacted by Repo911 and its network of attorneys via phone, email, or text message regarding my case." |
| Privacy Policy agreement | Checkbox | Yes | "I have read and agree to the Privacy Policy and Terms of Service." (linked) |

---

## 5. AI LEAD QUALIFICATION ENGINE

### Overview
A **rule-based scoring system** (not LLM-based) that runs server-side after form submission. Each qualifying factor adds points. Leads are categorized as: **Hot**, **Warm**, **Cold**, or **Disqualified**.

### Scoring Rules

**Breach of Peace Indicators (Primary — Highest Value)**
| Factor | Points |
|---|---|
| Consumer objected AND repo agent continued | +40 |
| Repo agent used physical force or threats | +35 |
| Repo agent entered locked/gated area without permission | +30 |
| Police assisted with the repossession | +30 |
| Repo agent caused property damage | +25 |
| Consumer objected verbally (regardless of outcome) | +15 |
| Excessive noise / public disturbance | +15 |
| Repossession at workplace | +10 |
| Public embarrassment / humiliation | +10 |

**Personal Belongings Violations**
| Factor | Points |
|---|---|
| Belongings not returned | +20 |
| Charged a fee to retrieve belongings | +25 |
| High value belongings unreturned (>$500) | +10 |

**Military / SCRA Violations**
| Factor | Points |
|---|---|
| On active duty at time of repo | +40 |
| Loan originated before active duty | +10 (additional) |

**FDCPA Violations (Debt Collection)**
| Factor | Points |
|---|---|
| Each FDCPA violation checked | +10 each |
| 3+ FDCPA violations | +15 bonus |

**Notice & Process Violations**
| Factor | Points |
|---|---|
| No written notice before repossession | +10 |
| No Notice of Sale received | +10 |

**Supporting Evidence**
| Factor | Points |
|---|---|
| Has photos/videos of repossession | +10 |
| Has documents (loan agreement, notices) | +5 |
| Has witnesses | +10 |

**Negative / Disqualifying Factors**
| Factor | Points |
|---|---|
| Repossession occurred more than 2 years ago | -50 (likely past statute of limitations) |
| No breach of peace indicators AND no belongings issues AND no SCRA AND no FDCPA violations | Disqualified |

### Qualification Tiers
| Tier | Score Range | Label | Action |
|---|---|---|---|
| Hot | 60+ | 🔴 Hot Lead | Immediately available in attorney marketplace. Push notification to attorneys. |
| Warm | 30–59 | 🟡 Warm Lead | Available in attorney marketplace. Standard notification. |
| Cold | 10–29 | 🔵 Cold Lead | Available in marketplace but flagged as lower priority. |
| Disqualified | <10 or Disqualified flag | ⚪ Not Qualified | NOT shown to attorneys. Consumer receives a polite message: "Based on the information you provided, your situation may not meet the criteria for a wrongful repossession claim. However, we recommend consulting with a local attorney for a personalized review." Store in DB for admin review. |

### Post-Qualification Flow
1. Score is calculated immediately on server after form submission
2. Lead record is created in Supabase with all form data + score + tier
3. If qualified (Hot/Warm/Cold): Lead appears in attorney marketplace
4. If Hot: Email/in-app notification sent to all registered attorneys
5. Consumer sees confirmation page with their tier result (friendly language, not the raw score)
6. CRM contact record is auto-created (see Section 10)

---

## 6. DATABASE SCHEMA (Supabase / PostgreSQL)

### Tables

```sql
-- CONSUMERS (lead submissions)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, qualified_hot, qualified_warm, qualified_cold, disqualified, claimed, closed

  -- Contact Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_contact TEXT, -- phone, email, text
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
  lease_or_finance TEXT, -- financed, leased, not_sure

  -- Lender Info
  lender_name TEXT,
  repo_company_name TEXT,
  behind_on_payments TEXT, -- yes, no, not_sure
  payments_behind INT,
  contacted_lender_about_arrangements BOOLEAN,
  received_written_notice TEXT, -- yes, no, not_sure

  -- Repo Details
  repo_date DATE,
  repo_time_of_day TEXT,
  repo_location JSONB, -- array of selected locations
  repo_state TEXT,

  -- Breach of Peace
  verbally_objected TEXT, -- yes, no, not_sure
  continued_after_objection TEXT, -- yes, no
  physical_force_or_threats BOOLEAN DEFAULT FALSE,
  excessive_noise BOOLEAN DEFAULT FALSE,
  entered_locked_area BOOLEAN DEFAULT FALSE,
  property_damage BOOLEAN DEFAULT FALSE,
  police_present BOOLEAN DEFAULT FALSE,
  police_assisted TEXT, -- yes, no, not_sure
  repo_at_workplace BOOLEAN DEFAULT FALSE,
  public_embarrassment BOOLEAN DEFAULT FALSE,
  narrative TEXT, -- consumer's own words description

  -- Personal Belongings
  had_belongings BOOLEAN DEFAULT FALSE,
  belongings_returned TEXT, -- yes, no, some
  belongings_list TEXT,
  belongings_value DECIMAL,
  charged_fee_for_belongings BOOLEAN DEFAULT FALSE,

  -- Post-Repo
  received_notice_of_sale TEXT, -- yes, no, not_sure
  deficiency_balance_contact TEXT, -- yes, no, not_sure
  impacts JSONB, -- array of selected impacts
  credit_report_affected TEXT, -- yes, no, not_sure

  -- Military
  military_service BOOLEAN DEFAULT FALSE,
  military_branch TEXT,
  active_duty_at_repo BOOLEAN DEFAULT FALSE,
  loan_before_active_duty TEXT, -- yes, no, not_sure

  -- FDCPA
  debt_collector_contact BOOLEAN DEFAULT FALSE,
  fdcpa_violations JSONB, -- array of selected violations

  -- Evidence
  has_photos_videos BOOLEAN DEFAULT FALSE,
  has_documents BOOLEAN DEFAULT FALSE,
  has_witnesses BOOLEAN DEFAULT FALSE,
  witness_info TEXT,

  -- File references (stored in Supabase Storage)
  uploaded_files JSONB, -- array of {file_name, storage_path, file_type, size}

  -- Qualification
  qualification_score INT DEFAULT 0,
  qualification_tier TEXT, -- hot, warm, cold, disqualified
  qualification_breakdown JSONB, -- detailed scoring breakdown for admin review

  -- Claim
  claimed_by UUID REFERENCES attorneys(id),
  claimed_at TIMESTAMPTZ,
  claim_price DECIMAL, -- price attorney paid to claim
  stripe_payment_id TEXT,

  -- Consent
  electronic_signature TEXT NOT NULL,
  consent_accurate_info BOOLEAN DEFAULT TRUE,
  consent_not_legal_advice BOOLEAN DEFAULT TRUE,
  consent_contact BOOLEAN DEFAULT TRUE,
  consent_privacy_policy BOOLEAN DEFAULT TRUE,

  -- Signature
  ip_address TEXT,
  user_agent TEXT
);

-- ATTORNEYS
CREATE TABLE attorneys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  supabase_auth_id UUID UNIQUE NOT NULL, -- links to Supabase Auth user

  -- Profile
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  firm_name TEXT,
  bar_number TEXT NOT NULL,
  bar_state TEXT NOT NULL,
  licensed_states JSONB, -- array of states where attorney is licensed
  website TEXT,
  profile_photo_url TEXT,

  -- Onboarding
  fee_agreement_signed BOOLEAN DEFAULT FALSE,
  fee_agreement_signed_at TIMESTAMPTZ,
  fee_agreement_ip TEXT,
  fee_agreement_document_url TEXT, -- stored signed agreement PDF

  -- Stripe
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,

  -- Preferences
  preferred_states JSONB, -- states they want leads for
  preferred_case_types JSONB, -- breach_of_peace, scra, fdcpa, belongings
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, active, suspended, deactivated
  is_verified BOOLEAN DEFAULT FALSE
);

-- ADMIN USERS
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin', -- admin, super_admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS / TRANSACTIONS
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attorney_id UUID REFERENCES attorneys(id),
  lead_id UUID REFERENCES leads(id),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount DECIMAL NOT NULL, -- amount charged to attorney
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending', -- pending, succeeded, failed, refunded
  description TEXT,
  receipt_url TEXT
);

-- ATTORNEY FEE TRACKING (for the 50% fee-share model)
CREATE TABLE fee_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  transaction_id UUID REFERENCES transactions(id),
  attorney_id UUID REFERENCES attorneys(id),
  lead_id UUID REFERENCES leads(id),
  case_status TEXT DEFAULT 'open', -- open, settled, dismissed, paid
  attorney_total_fee DECIMAL, -- total fee attorney earned from case
  repo911_share DECIMAL, -- 50% of attorney fee
  payment_status TEXT DEFAULT 'pending', -- pending, invoiced, paid, overdue
  payment_due_date DATE,
  payment_received_date DATE,
  notes TEXT
);

-- CRM CONTACTS (auto-created from leads + attorney records)
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contact_type TEXT NOT NULL, -- consumer, attorney
  source_lead_id UUID REFERENCES leads(id),
  source_attorney_id UUID REFERENCES attorneys(id),

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  state TEXT,
  city TEXT,

  tags JSONB, -- array of tags: ["hot_lead", "military", "breach_of_peace"]
  notes JSONB, -- array of {timestamp, author, note_text}
  last_contacted_at TIMESTAMPTZ,
  next_follow_up DATE,
  lifecycle_stage TEXT DEFAULT 'new', -- new, contacted, engaged, converted, closed

  custom_fields JSONB -- flexible key-value for anything else
);

-- CRM ACTIVITY LOG
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contact_id UUID REFERENCES crm_contacts(id),
  activity_type TEXT NOT NULL, -- note, email_sent, call, status_change, lead_claimed, payment
  description TEXT,
  metadata JSONB, -- any extra data
  performed_by UUID -- admin user id
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_type TEXT NOT NULL, -- attorney, admin
  recipient_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- new_lead, lead_claimed, payment_received, system
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  link TEXT -- URL to navigate to
);
```

### Row Level Security (RLS) Policies
- **Leads:** Attorneys can only see qualified leads (not disqualified). Claimed leads are only fully visible to the claiming attorney. Admins see everything.
- **Attorneys:** Each attorney can only read/update their own record. Admins see all.
- **Transactions:** Each attorney sees only their own. Admins see all.
- **CRM:** Admin-only access.
- **Notifications:** Recipients see only their own.

---

## 7. ATTORNEY MARKETPLACE — LEAD PURCHASE FLOW

### How It Works

1. **Attorney browses available leads** — sees a card/list view with:
   - Lead qualification tier (Hot / Warm / Cold) with color badge
   - State where repossession occurred
   - Date of repossession
   - Primary violation type(s): e.g., "Breach of Peace," "SCRA Violation," "Kept Belongings"
   - Lender name
   - Estimated case value range (based on qualification score)
   - **NO** consumer name, email, phone, or address shown

2. **Attorney clicks "View Details"** — sees expanded (but still anonymized) view:
   - All violation indicators (which boxes were checked)
   - Qualification score breakdown
   - Summary of consumer's narrative (first 200 characters, redacted of PII)
   - Vehicle year/make/model
   - Number of FDCPA violations
   - Whether consumer has evidence (photos, docs, witnesses)
   - **"Claim This Lead — $[PRICE]"** button

3. **Attorney clicks "Claim This Lead"** — Stripe Checkout flow:
   - Lead claim price is determined by tier:
     - Hot Lead: $150
     - Warm Lead: $100
     - Cold Lead: $50
   - *(These prices are configurable by admin in the future)*
   - Payment processes via Stripe
   - On successful payment:
     - Lead status changes to `claimed`
     - `claimed_by` is set to attorney ID
     - Full consumer contact info is revealed to attorney
     - Lead is removed from marketplace (no longer visible to other attorneys)
     - Transaction record created
     - Fee tracking record created (for the 50% fee-share tracking)
     - Email sent to consumer: "An attorney has reviewed your case and will be contacting you shortly."
     - Email sent to attorney: receipt + lead details
     - CRM activity logged

4. **Attorney's "My Leads" dashboard** shows all claimed leads with:
   - Full consumer contact info
   - All form data
   - Uploaded documents/evidence (downloadable)
   - Case status tracker (Open → In Progress → Settled → Closed)
   - Notes field for attorney's own records
   - Fee reporting section (attorney reports case outcome + fees earned for the 50% share)

---

## 8. ATTORNEY ONBOARDING & FEE-SHARING AGREEMENT

### Registration Flow
1. Attorney fills out registration form:
   - First name, last name, email, phone
   - Firm name
   - Bar number + state of primary bar membership
   - All states where licensed (multi-select)
   - Practice areas of interest (wrongful repo, FDCPA, SCRA, FCRA)
   - Payment method (Stripe card on file)

2. **Digital Fee-Sharing Agreement** — before accessing the marketplace, attorney must read and sign:
   - Display the full agreement text in a scrollable container
   - Attorney types their full legal name as electronic signature
   - Checkbox: "I agree to the terms of this Fee-Sharing Agreement"
   - Record: timestamp, IP address, user agent
   - Generate a PDF of the signed agreement and store in Supabase Storage
   - Link the PDF to the attorney's record

3. **Agreement Key Terms** (build this as a template stored in the DB or as a static page):
   - Attorney agrees to pay Repo911 50% of all legal fees earned from leads acquired through the platform
   - Payment is due within 30 days of case settlement or fee collection
   - Attorney agrees to report case outcomes and fees earned through the platform
   - Repo911 reserves the right to audit fee reports
   - Leads are exclusive — attorney may not share lead info with other attorneys
   - Agreement is per-lead and survives termination of the attorney's account
   - Governing law, dispute resolution, etc.

4. **Admin reviews** attorney registration (optional manual verification step — bar number validation)
5. Once approved, attorney gains full marketplace access

---

## 9. STRIPE PAYMENT INTEGRATION

### Setup Requirements
- **Stripe Account:** Standard Stripe account for Repo911
- **Products:**
  - `lead_claim_hot` — $150
  - `lead_claim_warm` — $100
  - `lead_claim_cold` — $50
- **Checkout Flow:** Use Stripe Checkout Sessions (server-side created)
- **Webhooks:** Listen for:
  - `checkout.session.completed` — mark lead as claimed, unlock info
  - `payment_intent.payment_failed` — handle failure gracefully
  - `charge.refunded` — unclaim lead if refund issued

### Implementation Notes
- Create a Stripe Customer for each attorney on registration
- Store `stripe_customer_id` on attorney record
- On lead claim: create Checkout Session with attorney's customer ID, lead metadata
- On success webhook: update lead status, create transaction, send notifications
- Build admin page to issue refunds if needed

---

## 10. BUILT-IN CRM

### Overview
A lightweight but functional CRM built directly into the admin portal. Auto-populated from lead submissions and attorney registrations. Designed for the Repo911 team to track relationships, follow up, and manage the pipeline.

### CRM Features

**Contact Management**
- Auto-created contacts from every lead submission (type: consumer)
- Auto-created contacts from every attorney registration (type: attorney)
- Contact card shows: name, email, phone, state, tags, lifecycle stage, all associated leads/transactions
- Add/edit notes with timestamps
- Set follow-up reminders (next_follow_up date)
- Tag system: hot_lead, military, breach_of_peace, scra, fdcpa, high_value, needs_follow_up, vip_attorney, etc.

**Pipeline View**
- Kanban board for leads: New → Qualified → In Marketplace → Claimed → Case Open → Settled → Closed
- Drag-and-drop status changes (updates DB)
- Filter by state, tier, date range, tags

**Activity Timeline**
- Every contact has a timeline showing all events:
  - Form submitted
  - Qualification score assigned
  - Lead appeared in marketplace
  - Attorney viewed lead
  - Lead claimed by [Attorney Name]
  - Payment received
  - Emails sent
  - Manual notes added by admin
  - Status changes

**Reporting Dashboard (CRM Section)**
- Total leads this week / month / all time
- Conversion rate: submitted → qualified → claimed
- Revenue: total, by month, by state
- Top performing states (most leads, highest claim rate)
- Attorney leaderboard (most leads purchased, highest case values)
- Average time from submission to claim

---

## 11. NOTIFICATIONS

### Email Notifications (via Resend)
| Trigger | Recipient | Content |
|---|---|---|
| Lead submitted | Consumer | "Thank you for submitting your case to Repo911. We're reviewing your information." Include qualification result in friendly language. |
| Lead qualified (Hot) | All active attorneys (matching state preferences) | "New Hot Lead available in [State] — [Violation Type]. Claim it before another attorney does." |
| Lead qualified (Warm) | All active attorneys (matching state preferences) | Similar, lower urgency tone |
| Lead claimed | Consumer | "Great news — an attorney has reviewed your case and will be reaching out to you soon." |
| Lead claimed | Claiming attorney | Receipt + full lead details |
| Attorney registered | Admin | "New attorney registration: [Name], [State]. Review and approve." |
| Fee payment due | Attorney | "A fee report is due for lead #[ID]. Please update the case status and submit payment." |

### In-App Notifications
- Bell icon in attorney portal header with unread count
- Dropdown shows recent notifications
- Click navigates to relevant page
- All stored in `notifications` table

---

## 12. PAGES & ROUTING STRUCTURE

### Consumer-Facing (Public)
```
/                         → Landing page (hero, how it works, trust signals, CTA to form)
/claim                    → Intake screening form
/claim/confirmation       → Post-submission confirmation (shows qualification tier in friendly language)
/faq                      → Frequently asked questions
/how-it-works             → Step-by-step explanation for consumers
/privacy                  → Privacy Policy
/terms                    → Terms of Service
/disclaimer               → Legal disclaimer ("not legal advice")
```

### Attorney Portal (Authenticated)
```
/attorney/register        → Registration + fee agreement signing
/attorney/login           → Login page
/attorney/dashboard       → Overview (available leads count, my claimed leads, recent activity)
/attorney/marketplace     → Browse & search available qualified leads
/attorney/leads/[id]      → Lead detail view (anonymized or full depending on claim status)
/attorney/my-leads        → All claimed leads with full info
/attorney/my-leads/[id]   → Claimed lead detail + case management
/attorney/billing         → Payment history, invoices, fee reporting
/attorney/profile         → Edit profile, notification preferences, licensed states
```

### Admin Portal (Authenticated)
```
/admin/login              → Admin login
/admin/dashboard          → KPI dashboard (leads, revenue, conversion rates)
/admin/leads              → All leads list (filterable, sortable)
/admin/leads/[id]         → Full lead detail + score breakdown + status management
/admin/attorneys          → All attorneys list
/admin/attorneys/[id]     → Attorney detail + their claimed leads + payment history
/admin/crm                → CRM contact list
/admin/crm/[id]           → CRM contact detail + activity timeline
/admin/crm/pipeline       → Kanban pipeline view
/admin/transactions       → All transactions
/admin/fee-tracking       → Fee-share tracking & reporting
/admin/settings           → Platform settings (lead pricing, notification templates)
```

---

## 13. LANDING PAGE SPECIFICATION

### Hero Section
- **Headline:** "Was Your Car Wrongfully Repossessed? You May Be Owed $10,000–$100,000+"
- **Subheadline:** "Even if you missed payments, the repo company may have broken the law. Find out in 5 minutes — it's 100% free."
- **CTA Button:** "Check My Case Now →" (links to /claim)
- **Trust Signals:** "Free Case Review • No Obligation • Nationwide Coverage"
- **Background:** Calming gradient or subtle image. No aggressive legal imagery.

### How It Works Section (3 Steps)
1. **Tell Us What Happened** — "Fill out our simple questionnaire about your repossession experience. It takes about 5 minutes."
2. **We Review Your Case** — "Our system analyzes your situation against federal and state repossession laws to determine if your rights were violated."
3. **Get Connected to an Attorney** — "If you have a case, we connect you with a licensed attorney in your state who can fight for your compensation. No fees unless you win."

### Common Violations Section
- "The repo man broke into my garage" → Illegal entry
- "I told them to stop but they took it anyway" → Breach of peace
- "They kept all my belongings" → Property violation
- "I was on active military duty" → SCRA violation
- "They called me at 3am threatening me" → FDCPA violation
Each with a brief 1–2 sentence explanation and a "Check if this happened to you →" link to the form.

### Social Proof / Trust Section
- "Helping victims nationwide fight back against wrongful repossession"
- Logos or mentions of relevant laws: FDCPA, UCC Article 9, SCRA
- Counter/stat: "Join thousands of Americans who have fought back"

### FAQ Preview
- Top 3-4 questions with brief answers, link to full FAQ page

### Footer
- Repo911 logo
- Navigation links
- "This website is not a law firm and does not provide legal advice" disclaimer
- Privacy Policy / Terms of Service links
- Contact email
- © 2026 Repo911. All rights reserved.

---

## 14. LEGAL PAGES

### Privacy Policy
Must cover:
- What information is collected (form data, uploaded files, IP, cookies)
- How information is used (case qualification, attorney matching, marketing)
- Who information is shared with (licensed attorneys who claim the lead — with consent)
- Data retention policy
- Consumer rights (access, deletion, correction)
- Cookie policy
- Third-party services (Stripe, Supabase, Vercel, Resend)
- California Consumer Privacy Act (CCPA) compliance notice
- Contact information for privacy inquiries
- How information is secured (encryption, access controls)

### Terms of Service
Must cover:
- Repo911 is a lead generation service, not a law firm
- No attorney-client relationship is created by using the site
- Accuracy of submitted information is the consumer's responsibility
- How leads are matched to attorneys
- Fee structure for attorneys
- Limitation of liability
- Dispute resolution / arbitration clause
- Termination of accounts
- Modifications to terms

### Disclaimer Page
- "Repo911 is not a law firm and does not provide legal advice"
- "The information on this website is for general informational purposes only"
- "No attorney-client relationship is formed by submitting an inquiry"
- "Results vary based on individual circumstances and applicable law"
- "Past results do not guarantee future outcomes"
- "By submitting your information, you consent to being contacted by a licensed attorney"

---

## 15. RESPONSIVE DESIGN REQUIREMENTS

### Mobile-First Approach
- All pages must be fully functional on screens 320px and up
- Intake form: single column on mobile, comfortable spacing, large touch targets
- Attorney marketplace: card layout on mobile, table on desktop
- Admin dashboard: collapsible sidebar navigation on mobile

### Key Breakpoints
- Mobile: 320px – 767px
- Tablet: 768px – 1023px
- Desktop: 1024px+

### Performance
- Lighthouse score target: 90+ on all metrics
- Images: use Next.js Image component with lazy loading
- Form: client-side validation before submission (reduce server round trips)
- Loading states: skeleton screens for data-heavy pages

---

## 16. ENVIRONMENT VARIABLES NEEDED

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_LEAD_PRICE_HOT=15000       # in cents ($150)
STRIPE_LEAD_PRICE_WARM=10000      # in cents ($100)
STRIPE_LEAD_PRICE_COLD=5000       # in cents ($50)

# Resend (email)
RESEND_API_KEY=
EMAIL_FROM=noreply@repo911.com

# App
NEXT_PUBLIC_APP_URL=https://repo911.com
NEXT_PUBLIC_APP_NAME=Repo911
```

---

## 17. PROJECT STRUCTURE

```
repo911/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   ├── claim/
│   │   ├── page.tsx                  # Intake form
│   │   └── confirmation/page.tsx     # Post-submission
│   ├── faq/page.tsx
│   ├── how-it-works/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── disclaimer/page.tsx
│   ├── attorney/
│   │   ├── register/page.tsx
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── marketplace/page.tsx
│   │   ├── leads/[id]/page.tsx
│   │   ├── my-leads/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── billing/page.tsx
│   │   └── profile/page.tsx
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── leads/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── attorneys/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── crm/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── pipeline/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── fee-tracking/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── leads/
│       │   ├── route.ts              # POST: submit lead, GET: list leads
│       │   ├── [id]/route.ts         # GET/PATCH lead
│       │   └── qualify/route.ts      # POST: run qualification engine
│       ├── attorneys/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── claims/
│       │   └── route.ts              # POST: claim a lead
│       ├── stripe/
│       │   ├── checkout/route.ts     # POST: create checkout session
│       │   └── webhook/route.ts      # POST: Stripe webhook handler
│       ├── crm/
│       │   ├── contacts/route.ts
│       │   └── activities/route.ts
│       ├── notifications/route.ts
│       └── admin/
│           ├── dashboard/route.ts
│           └── settings/route.ts
├── components/
│   ├── ui/                           # Shared UI components (buttons, cards, inputs, modals)
│   ├── consumer/                     # Consumer-facing components
│   │   ├── IntakeForm.tsx
│   │   ├── FormSection.tsx
│   │   └── ProgressIndicator.tsx
│   ├── attorney/                     # Attorney portal components
│   │   ├── LeadCard.tsx
│   │   ├── LeadDetail.tsx
│   │   ├── MarketplaceFilters.tsx
│   │   └── FeeAgreement.tsx
│   ├── admin/                        # Admin portal components
│   │   ├── DashboardStats.tsx
│   │   ├── LeadsTable.tsx
│   │   ├── CRMTimeline.tsx
│   │   └── PipelineBoard.tsx
│   └── layout/
│       ├── ConsumerHeader.tsx
│       ├── ConsumerFooter.tsx
│       ├── AttorneyNav.tsx
│       └── AdminSidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── admin.ts                  # Service role client
│   ├── stripe.ts                     # Stripe configuration
│   ├── resend.ts                     # Email client
│   ├── qualification-engine.ts       # Lead scoring logic
│   └── utils.ts                      # Helpers (formatting, validation)
├── types/
│   └── index.ts                      # TypeScript interfaces for all data models
├── middleware.ts                      # Auth middleware (protect attorney/admin routes)
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── .env.local
```

---

## 18. IMPLEMENTATION ORDER (Suggested Build Phases)

### Phase 1: Foundation
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up Supabase project (create all tables, enable RLS)
3. Set up Supabase Auth (email/password for attorneys + admins)
4. Build shared UI component library (buttons, inputs, cards, modals, tables)
5. Build layout components (consumer header/footer, attorney nav, admin sidebar)
6. Set up middleware for route protection

### Phase 2: Consumer Flow
7. Build landing page
8. Build intake form (all 11 sections with validation)
9. Build qualification engine (`lib/qualification-engine.ts`)
10. Build lead submission API route (validate → score → store → respond)
11. Build confirmation page
12. Build legal pages (privacy, terms, disclaimer)
13. Build FAQ and How It Works pages

### Phase 3: Attorney Portal
14. Build attorney registration + fee agreement signing flow
15. Build attorney login
16. Build marketplace page (list qualified leads, filters, search)
17. Build lead detail view (anonymized)
18. Set up Stripe integration (checkout sessions, webhooks)
19. Build lead claim flow (payment → unlock → notification)
20. Build "My Leads" page with full detail views
21. Build billing/payment history page
22. Build attorney profile/settings page

### Phase 4: Admin Portal
23. Build admin login
24. Build admin dashboard with KPIs
25. Build leads management page (list, detail, status updates)
26. Build attorney management page
27. Build CRM (contacts, activity timeline, pipeline kanban)
28. Build transactions page
29. Build fee tracking page
30. Build admin settings page

### Phase 5: Notifications & Polish
31. Set up Resend email integration
32. Build all email templates
33. Build in-app notification system
34. Add loading states, error handling, edge cases
35. Mobile responsiveness pass
36. Performance optimization
37. SEO (meta tags, OG images, structured data for landing page)

---

## 19. KEY LEGAL REFERENCES TO ENCODE IN THE PLATFORM

These laws should be referenced in the qualification engine logic and in consumer-facing educational content:

- **UCC Article 9 (Uniform Commercial Code)** — Governs secured transactions including vehicle repossession. Requires creditors to not "breach the peace" during self-help repossession. Applies in all 50 states (each state's version may vary slightly).
- **Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692** — Federal law. Applies to third-party debt collectors and repo agents. Prohibits harassment, false statements, unfair practices. Statutory damages up to $1,000 per violation + actual damages + attorney's fees.
- **Servicemembers Civil Relief Act (SCRA), 50 U.S.C. §§ 3901–4043** — Federal law protecting active-duty military. Creditors cannot repossess without a court order if the loan was originated before active duty. Violations carry significant damages.
- **State-Specific Repossession Laws** — Each state follows its own version of UCC Article 9. Key differences include notice requirements, redemption periods, deficiency balance rules, and licensing requirements for repo agents. The platform should note the consumer's state and flag any state-specific factors.

---

## 20. ADDITIONAL NOTES FOR CLAUDE CODE

- Use `pnpm` as the package manager
- Use Supabase JS client v2 (`@supabase/supabase-js`)
- Use `@stripe/stripe-js` for frontend and `stripe` for backend
- Use `resend` npm package for emails
- Use `react-hook-form` + `zod` for form validation on the intake form
- Use `@tanstack/react-table` for data tables in admin/attorney portals
- Use `@hello-pangea/dnd` for the CRM Kanban drag-and-drop
- Use `lucide-react` for icons throughout
- Use `date-fns` for date formatting
- Use `recharts` for admin dashboard charts
- All API routes should validate input with Zod schemas
- All database queries should use Supabase RLS — never bypass with service role unless absolutely necessary
- Handle all Stripe webhook events idempotently (check if action already performed before executing)
- Store all uploaded files in Supabase Storage bucket called `lead-evidence` with path: `/{lead_id}/{filename}`
- Use Next.js server components where possible, client components only when interactivity is needed
- Implement proper error boundaries and 404/500 pages

---

**END OF PRD — Ready for Claude Code implementation.**
