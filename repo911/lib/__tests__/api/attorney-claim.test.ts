import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  createMockRequest,
  parseResponse,
  createMockQueryBuilder,
  createMockSupabaseClient,
  mockAttorney,
  mockLead,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks — factories use only vi.fn() (no external variable references)
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
    refunds: { create: vi.fn() },
    paymentIntents: { retrieve: vi.fn() },
    charges: { retrieve: vi.fn() },
  },
  isStripeConfigured: vi.fn(),
  LEAD_PRICES: { hot: 100000, warm: 60000, cold: 30000 },
}));

vi.mock('@/lib/subscription', () => ({
  isSubscriptionActive: vi.fn(),
}));

vi.mock('@/lib/auth/verify-attorney', () => ({
  verifyAttorney: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/emails', () => ({
  sendLeadClaimedToConsumer: vi.fn().mockResolvedValue({ id: 'e1' }),
  sendLeadClaimedToAttorney: vi.fn().mockResolvedValue({ id: 'e2' }),
}));

vi.mock('@/lib/sms', () => ({
  sendLeadClaimedSms: vi.fn().mockResolvedValue(undefined),
  sendCaseClaimedSms: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/error-tracking/server-tracker', () => ({
  captureServerException: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { verifyAttorney } from '@/lib/auth/verify-attorney';
import { isSubscriptionActive } from '@/lib/subscription';
import { rateLimit } from '@/lib/rate-limit';
import { sendLeadClaimedToConsumer, sendLeadClaimedToAttorney } from '@/lib/emails';
import { sendLeadClaimedSms, sendCaseClaimedSms } from '@/lib/sms';

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.EMAIL_FROM = 'test@repo911.com';
});

// ===================================================================
// POST /api/attorney/claim
// ===================================================================

describe('POST /api/attorney/claim', () => {
  let POST: typeof import('@/app/api/attorney/claim/route').POST;
  let mockServerClient: ReturnType<typeof createMockSupabaseClient>;
  let mockAdminClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const mod = await import('@/app/api/attorney/claim/route');
    POST = mod.POST;

    // Create fresh mock clients
    mockServerClient = createMockSupabaseClient();
    mockAdminClient = createMockSupabaseClient();

    vi.mocked(createClient).mockResolvedValue(mockServerClient as never);
    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as never);

    // Defaults
    vi.mocked(isStripeConfigured).mockReturnValue(true);
    vi.mocked(isSubscriptionActive).mockReturnValue(false);
    vi.mocked(rateLimit).mockReturnValue({ success: true, remaining: 19, resetAt: Date.now() + 3600000 });

    // Default verifyAttorney: returns valid attorney
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: mockAttorney(),
      error: null,
    } as never);

    // Default leads query: returns an available lead
    const leadsQueryBuilder = createMockQueryBuilder({
      data: mockLead(),
      error: null,
    });
    mockServerClient.from.mockReturnValue(leadsQueryBuilder as never);

    // Admin RPC: success by default
    mockAdminClient.rpc.mockResolvedValue({ data: null, error: null });

    // Admin from for CRM queries
    const crmBuilder = createMockQueryBuilder({ data: { id: 'crm-1' }, error: null });
    mockAdminClient.from.mockReturnValue(crmBuilder as never);

    // Reset Stripe mock defaults
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://checkout.stripe.com/test', id: 'cs_test_123' } as never);
  });

  // ---------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------

  it('returns 400 when lead_id is missing', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: {},
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 503 when Stripe is not configured', async () => {
    vi.mocked(isStripeConfigured).mockReturnValue(false);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(503);
    expect(body.error).toContain('not yet available');
  });

  // ---------------------------------------------------------------
  // Auth errors
  // ---------------------------------------------------------------

  it('returns 401 when not authenticated', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: null,
      error: { message: 'Unauthorized', status: 401 },
    } as never);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it('returns 403 when attorney not found', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: null,
      error: { message: 'Attorney not found', status: 403 },
    } as never);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it('returns 403 when fee agreement not signed', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: null,
      error: { message: 'Fee agreement not signed', status: 403 },
    } as never);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it('returns 403 when account suspended', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: null,
      error: { message: 'Account is not active', status: 403 },
    } as never);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  // ---------------------------------------------------------------
  // Rate limiting
  // ---------------------------------------------------------------

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockReturnValue({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 30000,
    });

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(429);
  });

  // ---------------------------------------------------------------
  // Lead availability
  // ---------------------------------------------------------------

  it('returns 404 when lead not found', async () => {
    const emptyBuilder = createMockQueryBuilder({ data: null, error: null });
    mockServerClient.from.mockReturnValue(emptyBuilder as never);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'nonexistent-id' },
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('returns 409 when lead is already claimed', async () => {
    const claimedBuilder = createMockQueryBuilder({
      data: mockLead({ claimed_by: 'other-attorney-id' }),
      error: null,
    });
    mockServerClient.from.mockReturnValue(claimedBuilder as never);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(409);
    expect(body.error).toContain('already been claimed');
  });

  // ---------------------------------------------------------------
  // Referral credit path
  // ---------------------------------------------------------------

  it('claims via referral credit and returns redirect_url', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: mockAttorney({ referral_credits: 1 }),
      error: null,
    } as never);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.redirect_url).toContain('/attorney/my-leads?claimed=lead-uuid-1');
    expect(mockAdminClient.rpc).toHaveBeenCalledWith(
      'claim_lead',
      expect.objectContaining({
        p_use_referral_credit: true,
        p_claim_price: 0,
      })
    );
  });

  it('returns 409 when referral credit RPC fails', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: mockAttorney({ referral_credits: 1 }),
      error: null,
    } as never);
    mockAdminClient.rpc.mockResolvedValue({ data: null, error: { message: 'already claimed' } });

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(409);
  });

  // ---------------------------------------------------------------
  // Subscription path
  // ---------------------------------------------------------------

  it('claims via subscription with p_payment_type subscription and sends notifications', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: mockAttorney({
        referral_credits: 0,
        subscription_plan: 'monthly_unlimited',
        subscription_status: 'active',
      }),
      error: null,
    } as never);
    vi.mocked(isSubscriptionActive).mockReturnValue(true);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.redirect_url).toContain('/attorney/my-leads?claimed=lead-uuid-1');
    expect(mockAdminClient.rpc).toHaveBeenCalledWith(
      'claim_lead',
      expect.objectContaining({
        p_payment_type: 'subscription',
        p_claim_price: 0,
      })
    );

    // All 4 notification functions should fire
    expect(sendLeadClaimedToConsumer).toHaveBeenCalled();
    expect(sendLeadClaimedToAttorney).toHaveBeenCalled();
    expect(sendLeadClaimedSms).toHaveBeenCalled();
    expect(sendCaseClaimedSms).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  // Per-lead Stripe checkout path
  // ---------------------------------------------------------------

  it('creates Stripe checkout session for per-lead purchase', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.checkout_url).toBe('https://checkout.stripe.com/test');
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        metadata: expect.objectContaining({
          lead_id: 'lead-uuid-1',
          attorney_id: 'attorney-uuid-1',
          tier: 'hot',
        }),
      })
    );
  });

  it('uses correct unit_amount for warm tier', async () => {
    const warmLeadBuilder = createMockQueryBuilder({
      data: mockLead({ qualification_tier: 'warm' }),
      error: null,
    });
    mockServerClient.from.mockReturnValue(warmLeadBuilder as never);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    await POST(req);

    const createCall = vi.mocked(stripe.checkout.sessions.create).mock.calls[0][0] as Record<string, unknown>;
    expect((createCall.line_items as Array<{ price_data: { unit_amount: number } }>)[0].price_data.unit_amount).toBe(60000);
  });

  // ---------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------

  it('returns 500 on unexpected error', async () => {
    vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(new Error('Stripe down'));

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/attorney/claim',
      body: { lead_id: 'lead-uuid-1' },
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(500);
    expect(body.error).toContain('checkout session');
  });
});
