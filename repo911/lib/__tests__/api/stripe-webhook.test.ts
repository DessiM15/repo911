import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  createMockRequest,
  parseResponse,
  createMockQueryBuilder,
} from './helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(type: string, data: Record<string, unknown>) {
  return { type, data: { object: data } };
}

// ---------------------------------------------------------------------------
// Mocks — factories use only vi.fn() (no external variable references)
// ---------------------------------------------------------------------------

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
    refunds: { create: vi.fn() },
    paymentIntents: { retrieve: vi.fn() },
    charges: { retrieve: vi.fn() },
  },
  LEAD_PRICES: { hot: 100000, warm: 60000, cold: 30000 },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/emails', () => ({
  sendLeadClaimedToConsumer: vi.fn().mockResolvedValue({ id: 'e1' }),
  sendLeadClaimedToAttorney: vi.fn().mockResolvedValue({ id: 'e2' }),
}));

vi.mock('@/lib/error-tracking/server-tracker', () => ({
  captureServerException: vi.fn(),
  captureServerMessage: vi.fn(),
}));

import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLeadClaimedToConsumer, sendLeadClaimedToAttorney } from '@/lib/emails';

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.EMAIL_FROM = 'test@repo911.com';
});

// ===================================================================
// POST /api/webhooks/stripe
// ===================================================================

describe('POST /api/webhooks/stripe', () => {
  let POST: typeof import('@/app/api/webhooks/stripe/route').POST;
  let mockAdminClient: { from: ReturnType<typeof vi.fn>; rpc: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    const mod = await import('@/app/api/webhooks/stripe/route');
    POST = mod.POST;

    // Fresh admin client per test
    mockAdminClient = {
      from: vi.fn(() => createMockQueryBuilder({ data: null, error: null })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as never);

    // Reset Stripe mock defaults
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({ type: 'test', data: { object: {} } } as never);
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      status: 'active',
      cancel_at_period_end: false,
      items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30 }] },
    } as never);
    vi.mocked(stripe.refunds.create).mockResolvedValue({ id: 're_test_123' } as never);
    vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue({ latest_charge: 'ch_test_123' } as never);
    vi.mocked(stripe.charges.retrieve).mockResolvedValue({ receipt_url: 'https://receipt.stripe.com/test' } as never);
  });

  function webhookRequest(body: string, sig = 'valid-sig') {
    return createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/webhooks/stripe',
      rawBody: body,
      headers: {
        'stripe-signature': sig,
        'content-type': 'application/json',
      },
    });
  }

  // ---------------------------------------------------------------
  // Signature validation
  // ---------------------------------------------------------------

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/webhooks/stripe',
      rawBody: '{}',
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.error).toContain('No signature');
  });

  it('returns 400 when constructEvent throws (invalid signature)', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = webhookRequest('{}');
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.error).toContain('Invalid signature');
  });

  // ---------------------------------------------------------------
  // checkout.session.completed — subscription
  // ---------------------------------------------------------------

  it('activates subscription on attorney for subscription checkout', async () => {
    const event = makeEvent('checkout.session.completed', {
      mode: 'subscription',
      metadata: { attorney_id: 'att-1' },
      subscription: 'sub_test_123',
      customer: 'cus_test_456',
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    const attorneyBuilder = createMockQueryBuilder({ data: null, error: null });
    const notifBuilder = createMockQueryBuilder({ data: null, error: null });
    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'attorneys') return attorneyBuilder;
      if (table === 'notifications') return notifBuilder;
      return createMockQueryBuilder({ data: null, error: null });
    });

    const req = webhookRequest('{"id":"evt_1"}');
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(mockAdminClient.from).toHaveBeenCalledWith('attorneys');
    expect(attorneyBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_plan: 'monthly_unlimited',
      })
    );
  });

  it('returns 200 no-op when subscription checkout has no attorney_id', async () => {
    const event = makeEvent('checkout.session.completed', {
      mode: 'subscription',
      metadata: {},
      subscription: 'sub_test_123',
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    const req = webhookRequest('{"id":"evt_1"}');
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.received).toBe(true);
  });

  // ---------------------------------------------------------------
  // checkout.session.completed — per-lead
  // ---------------------------------------------------------------

  it('calls rpc claim_lead for per-lead checkout', async () => {
    const event = makeEvent('checkout.session.completed', {
      mode: 'payment',
      metadata: { lead_id: 'lead-1', attorney_id: 'att-1', tier: 'hot' },
      payment_intent: 'pi_test_123',
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    const leadBuilder = createMockQueryBuilder({
      data: { first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com', phone: '555', repo_state: 'TX', qualification_tier: 'hot' },
      error: null,
    });
    const attorneyBuilder = createMockQueryBuilder({
      data: { first_name: 'Bob', email: 'bob@test.com' },
      error: null,
    });
    const genericBuilder = createMockQueryBuilder({ data: null, error: null });

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'leads') return leadBuilder;
      if (table === 'attorneys') return attorneyBuilder;
      if (table === 'crm_contacts') return createMockQueryBuilder({ data: { id: 'crm-1' }, error: null });
      return genericBuilder;
    });

    const req = webhookRequest('{"id":"evt_1"}');
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(mockAdminClient.rpc).toHaveBeenCalledWith(
      'claim_lead',
      expect.objectContaining({
        p_lead_id: 'lead-1',
        p_attorney_id: 'att-1',
        p_claim_price: 100000,
        p_payment_type: 'per_lead',
      })
    );
  });

  it('auto-refunds and notifies on race condition (lead already claimed)', async () => {
    const event = makeEvent('checkout.session.completed', {
      mode: 'payment',
      metadata: { lead_id: 'lead-1', attorney_id: 'att-1', tier: 'warm' },
      payment_intent: 'pi_test_123',
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    // RPC fails (already claimed)
    mockAdminClient.rpc.mockResolvedValue({ data: null, error: { message: 'lead already claimed' } });

    const leadBuilder = createMockQueryBuilder({
      data: { first_name: 'Jane', last_name: 'Doe', email: 'j@t.com', phone: '555', repo_state: 'TX', qualification_tier: 'warm' },
      error: null,
    });
    const notifBuilder = createMockQueryBuilder({ data: null, error: null });
    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'leads') return leadBuilder;
      if (table === 'attorneys') return createMockQueryBuilder({ data: { first_name: 'Bob', email: 'b@t.com' }, error: null });
      if (table === 'notifications') return notifBuilder;
      return createMockQueryBuilder({ data: null, error: null });
    });

    const req = webhookRequest('{"id":"evt_1"}');
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(stripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_test_123' })
    );
    expect(notifBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Lead No Longer Available' })
    );
  });

  it('sends emails after successful per-lead claim', async () => {
    const event = makeEvent('checkout.session.completed', {
      mode: 'payment',
      metadata: { lead_id: 'lead-1', attorney_id: 'att-1', tier: 'hot' },
      payment_intent: 'pi_test_123',
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    const leadBuilder = createMockQueryBuilder({
      data: { first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com', phone: '555', repo_state: 'TX', qualification_tier: 'hot' },
      error: null,
    });
    const attorneyBuilder = createMockQueryBuilder({
      data: { first_name: 'Bob', email: 'bob@test.com' },
      error: null,
    });
    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'leads') return leadBuilder;
      if (table === 'attorneys') return attorneyBuilder;
      return createMockQueryBuilder({ data: null, error: null });
    });

    const req = webhookRequest('{"id":"evt_1"}');
    await POST(req);

    expect(sendLeadClaimedToConsumer).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@test.com', firstName: 'Jane' })
    );
    expect(sendLeadClaimedToAttorney).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'bob@test.com', attorneyName: 'Bob' })
    );
  });

  // ---------------------------------------------------------------
  // customer.subscription.updated
  // ---------------------------------------------------------------

  it('updates attorney subscription status on subscription.updated', async () => {
    const event = makeEvent('customer.subscription.updated', {
      id: 'sub_test_123',
      status: 'past_due',
      cancel_at_period_end: true,
      items: { data: [{ current_period_end: 1700000000 }] },
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    const attorneyBuilder = createMockQueryBuilder({ data: null, error: null });
    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'attorneys') return attorneyBuilder;
      return createMockQueryBuilder({ data: null, error: null });
    });

    const req = webhookRequest('{"id":"evt_1"}');
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(attorneyBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: 'past_due',
        subscription_cancel_at_period_end: true,
      })
    );
  });

  // ---------------------------------------------------------------
  // customer.subscription.deleted
  // ---------------------------------------------------------------

  it('clears subscription fields and notifies on subscription.deleted', async () => {
    const event = makeEvent('customer.subscription.deleted', {
      id: 'sub_test_123',
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    const attorneyBuilder = createMockQueryBuilder({ data: { id: 'att-1' }, error: null });
    const notifBuilder = createMockQueryBuilder({ data: null, error: null });
    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'attorneys') return attorneyBuilder;
      if (table === 'notifications') return notifBuilder;
      return createMockQueryBuilder({ data: null, error: null });
    });

    const req = webhookRequest('{"id":"evt_1"}');
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(attorneyBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_plan: null,
        subscription_status: null,
      })
    );
    expect(notifBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Subscription Ended',
      })
    );
  });

  // ---------------------------------------------------------------
  // invoice.payment_failed
  // ---------------------------------------------------------------

  it('notifies attorney on invoice.payment_failed', async () => {
    const event = makeEvent('invoice.payment_failed', {
      customer: 'cus_test_789',
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    const attorneyBuilder = createMockQueryBuilder({ data: { id: 'att-1' }, error: null });
    const notifBuilder = createMockQueryBuilder({ data: null, error: null });
    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'attorneys') return attorneyBuilder;
      if (table === 'notifications') return notifBuilder;
      return createMockQueryBuilder({ data: null, error: null });
    });

    const req = webhookRequest('{"id":"evt_1"}');
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(notifBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Payment Failed',
      })
    );
  });

  // ---------------------------------------------------------------
  // charge.refunded
  // ---------------------------------------------------------------

  it('marks transaction refunded and unclaims lead on charge.refunded', async () => {
    const event = makeEvent('charge.refunded', {
      payment_intent: 'pi_test_456',
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    const transactionBuilder = createMockQueryBuilder({
      data: { lead_id: 'lead-1', attorney_id: 'att-1' },
      error: null,
    });
    const leadBuilder = createMockQueryBuilder({
      data: { qualification_tier: 'hot' },
      error: null,
    });
    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === 'transactions') return transactionBuilder;
      if (table === 'leads') return leadBuilder;
      return createMockQueryBuilder({ data: null, error: null });
    });

    const req = webhookRequest('{"id":"evt_1"}');
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    expect(transactionBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'refunded' })
    );
    expect(leadBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        claimed_by: null,
        claimed_at: null,
        status: 'qualified_hot',
      })
    );
  });

  it('charge.refunded with no paymentIntentId is a no-op 200', async () => {
    const event = makeEvent('charge.refunded', {
      payment_intent: null,
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never);

    const req = webhookRequest('{"id":"evt_1"}');
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.received).toBe(true);
  });
});
