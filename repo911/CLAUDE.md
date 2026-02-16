# CLAUDE.md — Repo911

## Project Overview

Repo911 is a full-stack lead marketplace connecting consumers who experienced wrongful vehicle repossession with licensed attorneys. Consumers submit an intake form, cases are auto-scored on legal factors, and qualified leads are sold to attorneys via Stripe.

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript 5
- **UI**: React 19, Tailwind CSS v4, Lucide icons
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (email/password)
- **Payments**: Stripe (checkout sessions, webhooks)
- **Email**: Resend
- **Monitoring**: Self-hosted error tracking (Supabase + custom tracker)
- **Forms**: React Hook Form + Zod
- **Package Manager**: pnpm

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Run production server
pnpm lint         # ESLint
```

## Project Structure

```
app/
  (consumer)/     # Public routes: landing, claim form, confirmation, track, FAQ, etc.
  admin/          # Admin dashboard, leads, attorneys, CRM, settings
  attorney/       # Attorney portal: marketplace, my-leads, profile, billing
  api/            # API routes (leads, attorney, admin, webhooks)
  auth/           # Auth callback + password reset
components/
  ui/             # Reusable primitives (Button, Input, Card, Radio, Select, etc.)
  consumer/       # IntakeForm, FormSection, ProgressIndicator
  attorney/       # LeadCard, LeadFilters, NotificationBell
  admin/          # StatusBadge, LeadDetailPanel, TierBadge
  layout/         # ConsumerHeader, ConsumerFooter, AttorneyHeader, etc.
lib/
  supabase/       # Client configs: client.ts (browser), server.ts (cookies), admin.ts (service role)
  validations/    # Zod schemas (intake-form.ts)
  qualification-engine.ts   # Lead scoring algorithm
  rate-limit.ts             # In-memory sliding window rate limiter
  stripe.ts                 # Stripe client + pricing helpers
  emails.ts                 # Resend email templates
  utils.ts                  # Formatting, constants (US_STATES, COMMON_LENDERS)
types/
  index.ts        # All TypeScript interfaces (Lead, Attorney, Admin, Transaction, etc.)
supabase/
  migrations/     # SQL migrations (run manually in Supabase dashboard)
```

## Architecture

### Route Groups & Auth

| Group | Auth | Middleware Check |
|-------|------|-----------------|
| `(consumer)` | None (public) | — |
| `admin` | Supabase Auth | Must have admin record |
| `attorney` | Supabase Auth | Must have attorney record + fee agreement signed + active status |

Middleware is in `/middleware.ts`. It protects attorney and admin routes, redirects authenticated users away from login pages, and handles suspended accounts.

### Three Supabase Clients

- **`lib/supabase/client.ts`** — Browser client (anon key, for client components)
- **`lib/supabase/server.ts`** — Server client (reads cookies, for server components/API routes)
- **`lib/supabase/admin.ts`** — Admin client (service role key, bypasses RLS)

### Database Tables

- **leads** — Case submissions with contact info, vehicle details, repo circumstances, qualification score/tier, claim status
- **attorneys** — Professional profiles, bar info, Stripe customer ID, preferences, status
- **admins** — Platform administrators (admin/super_admin roles)
- **transactions** — Stripe payment records linking attorneys to leads
- **fee_tracking** — Case tracking (case status, attorney fees)
- **crm_contacts** — Follow-up pipeline for leads and attorneys
- **crm_activities** — Interaction log (notes, calls, emails, status changes)
- **notifications** — In-app alerts for attorneys and admins
- **settings** — Key-value platform configuration (lead prices, notification email, etc.)

All tables use RLS policies. Migrations are in `supabase/migrations/` and must be run manually in the Supabase SQL editor.

## Key Business Logic

### Lead Qualification (`lib/qualification-engine.ts`)

Point-based scoring system (0–100+):
- **Breach of Peace**: verbal objection ignored (+40), physical force (+35), entered locked area (+30), police assisted (+30), property damage (+25)
- **Military/SCRA**: active duty at repo (+40)
- **Belongings**: charged fee to retrieve (+25), not returned (+20)
- **FDCPA**: each violation (+10), 3+ bonus (+15)
- **Evidence**: photos/videos (+10), witnesses (+10)
- **Penalty**: repo >2 years ago (-50)

**Tiers**: hot (>=60, $1,000), warm (>=30, $600), cold (>=10, $300), disqualified (<10)

### Lead Claim Flow

**Per-lead (default):**
1. Attorney browses marketplace (anonymized leads)
2. Clicks claim → Stripe checkout session created
3. Stripe webhook `checkout.session.completed` → atomic update (only if unclaimed)
4. Attorney receives full contact details, consumer gets notification

**Monthly Unlimited subscription ($2,000/mo):**
1. Attorney subscribes via Billing page → Stripe subscription checkout
2. Webhook activates subscription fields on attorney record
3. Subscribed attorney clicks claim → instant claim (no checkout), $0 transaction with `payment_type: 'subscription'`
4. Marketplace/lead detail shows "Included" badge instead of price
5. Subscription managed via Billing page (cancel at period end)
6. Webhook events: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Case tracking record created (open status)

### Consumer Intake Form

11-section multi-step wizard with per-step Zod validation:
0. Contact Info → 1. Vehicle → 2. Lender → 3. Repo Details → 4. Breach of Peace → 5. Belongings → 6. Post-Repo → 7. Military → 8. Debt Collection → 9. Evidence → 10. Consent

Boolean Yes/No radio fields use `z.preprocess` to store strings (`'true'`/`'false'`) in the form and convert to booleans during validation. This prevents React Hook Form from coercing `undefined` to `false`.

## Styling Conventions

- **Tailwind CSS v4** with `cn()` utility (clsx + tailwind-merge)
- **Color palette**:
  - Consumer primary: `#3474BA` (blue, WCAG AA compliant)
  - Consumer accent: `#F5A623` (orange)
  - Attorney/Admin dark: `#1B2A4A` (navy)
  - Attorney accent: `#2ECC71` (green)
- **Tier colors**: hot=green, warm=blue, cold=gray, disqualified=red
- Components use `className` prop pattern with `cn()` for merging

## Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (required for payments)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_LEAD_PRICE_HOT=100000   # cents ($1,000)
STRIPE_LEAD_PRICE_WARM=60000   # cents ($600)
STRIPE_LEAD_PRICE_COLD=30000   # cents ($300)
STRIPE_SUBSCRIPTION_PRICE_ID=  # Stripe Price ID for monthly unlimited plan

# Resend (required for emails)
RESEND_API_KEY=
EMAIL_FROM=
ADMIN_NOTIFICATION_EMAIL=      # optional

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Repo911

```

`next.config.ts` inlines only `NEXT_PUBLIC_` env vars at build time. Server-only secrets are accessed via `process.env` at runtime, with whitespace trimming at their usage sites.

## Important Patterns

- **Rate limiting**: In-memory sliding window (`lib/rate-limit.ts`). Public endpoints keyed by IP, authenticated endpoints keyed by user/attorney ID. Limits:
  - Lead submission: 5/IP/15min. Case tracking: 10/IP/15min. Evidence upload: 10/IP/15min.
  - Attorney register: 5/IP/hour. Claim: 20/attorney/hour. Subscription create: 10/attorney/hour. Subscription cancel: 5/attorney/hour. Marketplace: 60/user/min.
  - Error tracking: 30/IP/min.
- **API auth checks**: Admin routes use `createServerClient` + check `admins` table. Attorney routes check `attorneys` table + status.
- **Emails**: Fire-and-forget via Resend. Failures are logged but don't block responses.
- **File uploads**: Supabase Storage `lead-evidence` bucket. Max 5 files, 10MB each, images + PDFs. Verified by email + case ID combo.
- **Stripe webhooks**: Atomic lead claiming with `claimed_by IS NULL` check. Handles refunds by reverting claim.
- **`useSearchParams()`**: Must be wrapped in `<Suspense>` for Next.js 16 static generation.

## Lighthouse Scores (Production Build)

| Page | Performance | Accessibility | Best Practices | SEO |
|------|:-----------:|:-------------:|:--------------:|:---:|
| `/` | 69 | 100 | 100 | 100 |
| `/claim` | 76 | 100 | 100 | 100 |
| `/how-it-works` | 81 | 100 | 100 | 100 |
| `/faq` | 79 | 100 | 100 | 100 |
| `/track` | 83 | 100 | 100 | 100 |
| `/privacy` | 85 | 100 | 100 | 100 |
| `/terms` | 86 | 100 | 100 | 100 |
| `/disclaimer` | 83 | 100 | 100 | 100 |

Performance scores measured on localhost production build (`pnpm build && pnpm start`) with Lighthouse mobile throttling. Expect higher scores on Vercel with CDN edge caching.

## Deployment

- Hosted on **Vercel** (auto-deploys from `main` branch)
- Database on **Supabase** (hosted PostgreSQL)
- Payments via **Stripe** (test mode for dev, live for prod)
- Emails via **Resend**
- Monitoring via **Sentry** (optional)
