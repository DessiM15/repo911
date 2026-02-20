import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  createMockRequest,
  parseResponse,
  createMockQueryBuilder,
  createMockSupabaseClient,
} from './helpers';

// ---------------------------------------------------------------------------
// Mocks — factories use only vi.fn() (no external variable references)
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth/verify-attorney', () => ({
  verifyAttorney: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/sanitize', () => ({
  sanitizeSearchParam: vi.fn((v: string) => v),
}));

import { createClient } from '@/lib/supabase/server';
import { verifyAttorney } from '@/lib/auth/verify-attorney';
import { rateLimit } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
});

// ===================================================================
// Admin GET /api/admin/leads
// ===================================================================

describe('GET /api/admin/leads', () => {
  let GET: typeof import('@/app/api/admin/leads/route').GET;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const mod = await import('@/app/api/admin/leads/route');
    GET = mod.GET;

    mockSupabase = createMockSupabaseClient();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    // Default: authenticated admin user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-1' } },
      error: null,
    });
  });

  it('returns 401 when no authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const req = createMockRequest({ url: 'http://localhost:3000/api/admin/leads' });
    const res = await GET(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not an admin', async () => {
    const adminsBuilder = createMockQueryBuilder({ data: null, error: null });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admins') return adminsBuilder;
      return createMockQueryBuilder();
    });

    const req = createMockRequest({ url: 'http://localhost:3000/api/admin/leads' });
    const res = await GET(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('returns 200 with leads for valid admin', async () => {
    const leadsData = [
      { id: '1', first_name: 'Jane', status: 'qualified_hot' },
    ];
    const adminsBuilder = createMockQueryBuilder({ data: { id: 'admin-1' }, error: null });
    const leadsBuilder = createMockQueryBuilder({ data: leadsData, error: null, count: 1 });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admins') return adminsBuilder;
      if (table === 'leads') return leadsBuilder;
      return createMockQueryBuilder();
    });

    const req = createMockRequest({ url: 'http://localhost:3000/api/admin/leads' });
    const res = await GET(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.leads).toEqual(leadsData);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(25);
  });
});

// ===================================================================
// Attorney GET /api/attorney/marketplace
// ===================================================================

describe('GET /api/attorney/marketplace', () => {
  let GET: typeof import('@/app/api/attorney/marketplace/route').GET;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const mod = await import('@/app/api/attorney/marketplace/route');
    GET = mod.GET;

    mockSupabase = createMockSupabaseClient();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    // Default: rate limit passes
    vi.mocked(rateLimit).mockReturnValue({ success: true, remaining: 59, resetAt: Date.now() + 60000 });
  });

  it('returns 401 when verifyAttorney says unauthorized', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: null,
      error: { message: 'Unauthorized', status: 401 },
    } as never);

    const req = createMockRequest({ url: 'http://localhost:3000/api/attorney/marketplace' });
    const res = await GET(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when attorney not found', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: null,
      error: { message: 'Attorney not found', status: 403 },
    } as never);

    const req = createMockRequest({ url: 'http://localhost:3000/api/attorney/marketplace' });
    const res = await GET(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(403);
    expect(body.error).toBe('Attorney not found');
  });

  it('returns 403 when fee agreement not signed', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: null,
      error: { message: 'Fee agreement not signed', status: 403 },
    } as never);

    const req = createMockRequest({ url: 'http://localhost:3000/api/attorney/marketplace' });
    const res = await GET(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(403);
    expect(body.error).toBe('Fee agreement not signed');
  });

  it('returns 403 when account is suspended', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: null,
      error: { message: 'Account is not active', status: 403 },
    } as never);

    const req = createMockRequest({ url: 'http://localhost:3000/api/attorney/marketplace' });
    const res = await GET(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(403);
    expect(body.error).toBe('Account is not active');
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: { id: 'att-1' },
      error: null,
    } as never);
    vi.mocked(rateLimit).mockReturnValue({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 30000,
    });

    const req = createMockRequest({ url: 'http://localhost:3000/api/attorney/marketplace' });
    const res = await GET(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(429);
    expect(body.error).toContain('Too many requests');
  });

  it('returns 200 with leads for valid attorney', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: { id: 'att-1' },
      error: null,
    } as never);

    const leadsData = [
      {
        id: 'lead-1',
        qualification_tier: 'hot',
        qualification_score: 75,
        qualification_breakdown: { breach_of_peace: 40, belongings: 20, military: 0, fdcpa: 0, notice: 10, evidence: 10, penalties: 0 },
        repo_state: 'TX',
        repo_date: '2025-01-15',
        lender_name: 'Chase',
        vehicle_year: 2020,
        vehicle_make: 'Honda',
        vehicle_model: 'Civic',
        has_photos_videos: true,
        has_documents: false,
        has_witnesses: false,
        story_recorded_at: null,
        story_transcript: null,
        narrative: 'They came at night and took the car.',
        fdcpa_violations: null,
        created_at: '2025-01-16T00:00:00Z',
      },
    ];
    const leadsBuilder = createMockQueryBuilder({ data: leadsData, error: null, count: 1 });
    mockSupabase.from.mockReturnValue(leadsBuilder as never);

    const req = createMockRequest({ url: 'http://localhost:3000/api/attorney/marketplace' });
    const res = await GET(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.leads).toHaveLength(1);
    expect(body.leads[0].qualification_tier).toBe('hot');
    expect(body.leads[0].violation_types).toContain('Breach of Peace');
    expect(body.total).toBe(1);
  });

  it('passes correct select to verifyAttorney', async () => {
    vi.mocked(verifyAttorney).mockResolvedValue({
      attorney: { id: 'att-1' },
      error: null,
    } as never);

    const leadsBuilder = createMockQueryBuilder({ data: [], error: null, count: 0 });
    mockSupabase.from.mockReturnValue(leadsBuilder as never);

    const req = createMockRequest({ url: 'http://localhost:3000/api/attorney/marketplace' });
    await GET(req);

    expect(verifyAttorney).toHaveBeenCalledWith(expect.anything(), 'id');
  });
});
