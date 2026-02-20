import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  createMockRequest,
  parseResponse,
  createMockQueryBuilder,
  validLeadSubmission,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks — factories use only vi.fn() (no external variable references)
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

// Do NOT mock qualifyLead — let real engine run
vi.mock('@/lib/emails', () => ({
  sendLeadSubmissionConfirmation: vi.fn().mockResolvedValue({ id: 'email-1' }),
  sendEmailVerification: vi.fn().mockResolvedValue({ id: 'email-2' }),
}));

vi.mock('@/lib/sms', () => ({
  sendSubmissionConfirmationSms: vi.fn().mockResolvedValue(undefined),
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { sendLeadSubmissionConfirmation, sendEmailVerification } from '@/lib/emails';

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.EMAIL_FROM = 'test@repo911.com';
});

// ===================================================================
// POST /api/leads
// ===================================================================

describe('POST /api/leads', () => {
  let POST: typeof import('@/app/api/leads/route').POST;
  let leadsBuilder: ReturnType<typeof createMockQueryBuilder>;
  let crmContactsBuilder: ReturnType<typeof createMockQueryBuilder>;
  let crmActivitiesBuilder: ReturnType<typeof createMockQueryBuilder>;
  let emailVerificationsBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockAdminClient: { from: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();

    const mod = await import('@/app/api/leads/route');
    POST = mod.POST;

    // Build fresh mock builders per test
    leadsBuilder = createMockQueryBuilder({
      data: { id: 'new-lead-uuid', qualification_tier: 'hot', qualification_score: 75 },
      error: null,
    });
    crmContactsBuilder = createMockQueryBuilder({
      data: { id: 'crm-contact-1' },
      error: null,
    });
    crmActivitiesBuilder = createMockQueryBuilder({ data: null, error: null });
    emailVerificationsBuilder = createMockQueryBuilder({ data: null, error: null });

    mockAdminClient = {
      from: vi.fn((table: string) => {
        switch (table) {
          case 'leads': return leadsBuilder;
          case 'crm_contacts': return crmContactsBuilder;
          case 'crm_activities': return crmActivitiesBuilder;
          case 'lead_email_verifications': return emailVerificationsBuilder;
          default: return createMockQueryBuilder();
        }
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as never);
    vi.mocked(rateLimit).mockReturnValue({ success: true, remaining: 4, resetAt: Date.now() + 900000 });
  });

  it('returns 200 with id, tier, and score for valid submission', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.id).toBe('new-lead-uuid');
    expect(body.tier).toBe('hot');
    expect(body.score).toBe(75);
  });

  it('inserts qualified_hot status for hot lead', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
    });
    await POST(req);

    expect(leadsBuilder.insert).toHaveBeenCalled();
    const insertArg = vi.mocked(leadsBuilder.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.status).toBe('qualified_hot');
  });

  it('returns disqualified status for minimal violations', async () => {
    const disqualifiedBody = validLeadSubmission({
      verbally_objected: 'no',
      continued_after_objection: undefined,
      physical_force_or_threats: false,
      had_belongings: false,
      has_photos_videos: false,
      received_written_notice: 'yes',
      received_notice_of_sale: 'yes',
    });

    leadsBuilder.single = vi.fn().mockResolvedValue({
      data: { id: 'new-lead-uuid', qualification_tier: 'disqualified', qualification_score: 0 },
      error: null,
    });

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: disqualifiedBody,
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
    const insertArg = vi.mocked(leadsBuilder.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.status).toBe('disqualified');
  });

  it('returns 400 for missing required fields', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: { first_name: 'Jane' },
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for invalid email', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission({ email: 'not-an-email' }),
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for invalid state (empty)', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission({ state: '' }),
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockReturnValue({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 30000,
    });

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(429);
    expect(body.error).toContain('Too many submissions');
  });

  it('returns 500 on database insert failure', async () => {
    leadsBuilder.single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'insert failed' },
    });

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
    });
    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(500);
    expect(body.error).toContain('Failed to submit');
  });

  it('creates CRM contact with correct tags for hot lead', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
    });
    await POST(req);

    expect(mockAdminClient.from).toHaveBeenCalledWith('crm_contacts');
    const crmInsertCalls = vi.mocked(crmContactsBuilder.insert as ReturnType<typeof vi.fn>).mock.calls;
    expect(crmInsertCalls.length).toBeGreaterThan(0);
    const crmInsert = crmInsertCalls[0][0];
    expect(crmInsert.tags).toContain('hot_lead');
    expect(crmInsert.contact_type).toBe('consumer');
  });

  it('creates verification token', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
    });
    await POST(req);

    expect(mockAdminClient.from).toHaveBeenCalledWith('lead_email_verifications');
    const insertCalls = vi.mocked(emailVerificationsBuilder.insert as ReturnType<typeof vi.fn>).mock.calls;
    expect(insertCalls.length).toBeGreaterThan(0);
    const tokenInsert = insertCalls[0][0];
    expect(tokenInsert.lead_id).toBe('new-lead-uuid');
    expect(tokenInsert.token).toBeDefined();
    expect(tokenInsert.expires_at).toBeDefined();
  });

  it('sends confirmation email', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
    });
    await POST(req);

    expect(sendLeadSubmissionConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        firstName: 'Jane',
      })
    );
  });

  it('sends verification email', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
    });
    await POST(req);

    expect(sendEmailVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        firstName: 'Jane',
      })
    );
  });

  it('email failure does not block 200 response', async () => {
    vi.mocked(sendLeadSubmissionConfirmation).mockRejectedValue(new Error('email down'));

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it('captures IP from x-forwarded-for header', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/leads',
      body: validLeadSubmission(),
      headers: { 'x-forwarded-for': '203.0.113.42, 10.0.0.1' },
    });
    await POST(req);

    const insertArg = vi.mocked(leadsBuilder.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.ip_address).toBe('203.0.113.42');
  });
});
