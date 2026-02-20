import { vi } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// createMockRequest
// ---------------------------------------------------------------------------

interface MockRequestOptions {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
  rawBody?: string; // for webhook routes that call request.text()
}

export function createMockRequest(options: MockRequestOptions = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    searchParams = {},
    rawBody,
  } = options;

  const reqUrl = new URL(url);
  for (const [key, value] of Object.entries(searchParams)) {
    reqUrl.searchParams.set(key, value);
  }

  const defaultHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'x-forwarded-for': '127.0.0.1',
    ...headers,
  };

  const init: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  if (rawBody !== undefined) {
    init.body = rawBody;
  }

  return new NextRequest(reqUrl.toString(), init);
}

// ---------------------------------------------------------------------------
// parseResponse
// ---------------------------------------------------------------------------

export async function parseResponse(response: Response) {
  const status = response.status;
  const body = await response.json();
  const headers = Object.fromEntries(response.headers.entries());
  return { status, body, headers };
}

// ---------------------------------------------------------------------------
// createMockQueryBuilder — chainable Supabase query mock
// ---------------------------------------------------------------------------

type QueryResult = { data: unknown; error: unknown; count?: number | null };

export function createMockQueryBuilder(
  result: QueryResult = { data: null, error: null }
) {
  const builder: Record<string, unknown> = {};

  const chainMethods = [
    'select', 'eq', 'insert', 'update', 'delete', 'order', 'range',
    'in', 'is', 'or', 'neq', 'gte', 'limit', 'upsert', 'match',
  ];

  for (const m of chainMethods) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }

  // Terminal methods resolve with the result
  builder.single = vi.fn().mockResolvedValue(result);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);

  // Make the builder itself thenable so `await supabase.from('x').insert({})`
  // resolves without calling .single()
  builder.then = (resolve: (v: QueryResult) => void) => Promise.resolve(result).then(resolve);

  return builder;
}

// ---------------------------------------------------------------------------
// createMockSupabaseClient
// ---------------------------------------------------------------------------

type TableOverrides = Record<string, ReturnType<typeof createMockQueryBuilder>>;

export function createMockSupabaseClient(
  tableOverrides: TableOverrides = {},
  rpcResult: QueryResult = { data: null, error: null },
) {
  const defaultBuilder = createMockQueryBuilder();

  return {
    from: vi.fn((table: string) => tableOverrides[table] || defaultBuilder),
    rpc: vi.fn().mockResolvedValue(rpcResult),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  };
}

// ---------------------------------------------------------------------------
// createMockStripe
// ---------------------------------------------------------------------------

export function createMockStripe() {
  return {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test', id: 'cs_test_123' }),
      },
    },
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({ type: 'test', data: { object: {} } }),
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        status: 'active',
        cancel_at_period_end: false,
        items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30 }] },
      }),
    },
    refunds: {
      create: vi.fn().mockResolvedValue({ id: 're_test_123' }),
    },
    paymentIntents: {
      retrieve: vi.fn().mockResolvedValue({ latest_charge: 'ch_test_123' }),
    },
    charges: {
      retrieve: vi.fn().mockResolvedValue({ receipt_url: 'https://receipt.stripe.com/test' }),
    },
  };
}

// ---------------------------------------------------------------------------
// validLeadSubmission — complete valid intake form body
// ---------------------------------------------------------------------------

export function validLeadSubmission(overrides: Record<string, unknown> = {}) {
  return {
    // Contact
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: '(555) 555-1234',
    preferred_contact: 'email',
    best_time_to_contact: 'morning',
    street_address: '123 Main St',
    city: 'Dallas',
    state: 'TX',
    zip_code: '75001',
    // Vehicle
    vehicle_year: 2020,
    vehicle_make: 'Honda',
    vehicle_model: 'Civic',
    vehicle_color: 'Blue',
    lease_or_finance: 'financed',
    // Lender
    lender_name: 'Chase Auto',
    behind_on_payments: 'yes',
    payments_behind: 3,
    received_written_notice: 'no',
    // Repo Details
    repo_date: '2025-01-15',
    repo_time_of_day: 'evening',
    repo_location: ['home_driveway'],
    repo_state: 'TX',
    // Breach of Peace — hot lead triggers
    verbally_objected: 'yes',
    continued_after_objection: 'yes',
    physical_force_or_threats: true,
    excessive_noise: false,
    entered_locked_area: false,
    property_damage: false,
    police_present: false,
    repo_at_workplace: false,
    public_embarrassment: false,
    narrative: 'They came at night and I told them to stop.',
    // Belongings
    had_belongings: true,
    belongings_returned: 'no',
    belongings_list: 'laptop, phone',
    belongings_value: 1500,
    charged_fee_for_belongings: false,
    // Post-Repo
    received_notice_of_sale: 'no',
    deficiency_balance_contact: 'no',
    // Military
    military_service: false,
    // FDCPA
    debt_collector_contact: false,
    // Evidence
    has_photos_videos: true,
    has_documents: false,
    has_witnesses: false,
    // Consent
    electronic_signature: 'Jane Doe',
    consent_accurate_info: true,
    consent_not_legal_advice: true,
    consent_contact: true,
    consent_privacy_policy: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// mockAttorney
// ---------------------------------------------------------------------------

export function mockAttorney(overrides: Record<string, unknown> = {}) {
  return {
    id: 'attorney-uuid-1',
    fee_agreement_signed: true,
    status: 'active',
    referral_credits: 0,
    subscription_plan: null,
    subscription_status: null,
    stripe_customer_id: 'cus_test_123',
    first_name: 'Bob',
    last_name: 'Smith',
    email: 'bob@lawfirm.com',
    phone: '(555) 555-5678',
    sms_notifications: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// mockLead
// ---------------------------------------------------------------------------

export function mockLead(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-uuid-1',
    qualification_tier: 'hot',
    qualification_score: 75,
    claimed_by: null,
    status: 'qualified_hot',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: '(555) 555-1234',
    repo_state: 'TX',
    preferred_contact: 'email',
    sms_notifications: true,
    ...overrides,
  };
}
