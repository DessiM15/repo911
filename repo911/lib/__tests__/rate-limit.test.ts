import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use fake timers BEFORE importing the module so the setInterval cleanup
// timer is captured by the fake timer system.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
});

async function importRateLimit() {
  const mod = await import('../rate-limit');
  return mod.rateLimit;
}

describe('rateLimit', () => {
  it('allows the first request and returns remaining = limit - 1', async () => {
    const rateLimit = await importRateLimit();
    const result = rateLimit('user-1', { limit: 5, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('allows requests up to the limit', async () => {
    const rateLimit = await importRateLimit();
    const opts = { limit: 3, windowSeconds: 60 };

    const r1 = rateLimit('user-2', opts);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit('user-2', opts);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimit('user-2', opts);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('rejects requests beyond the limit', async () => {
    const rateLimit = await importRateLimit();
    const opts = { limit: 2, windowSeconds: 60 };

    rateLimit('user-3', opts);
    rateLimit('user-3', opts);

    const r3 = rateLimit('user-3', opts);
    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it('resets after the window expires', async () => {
    const rateLimit = await importRateLimit();
    const opts = { limit: 1, windowSeconds: 10 };

    const r1 = rateLimit('user-4', opts);
    expect(r1.success).toBe(true);

    const r2 = rateLimit('user-4', opts);
    expect(r2.success).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(11_000);

    const r3 = rateLimit('user-4', opts);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('tracks keys independently', async () => {
    const rateLimit = await importRateLimit();
    const opts = { limit: 1, windowSeconds: 60 };

    const rA = rateLimit('key-a', opts);
    expect(rA.success).toBe(true);

    const rB = rateLimit('key-b', opts);
    expect(rB.success).toBe(true);

    // key-a is now exhausted
    const rA2 = rateLimit('key-a', opts);
    expect(rA2.success).toBe(false);

    // key-b is also exhausted
    const rB2 = rateLimit('key-b', opts);
    expect(rB2.success).toBe(false);
  });

  it('cleanup interval purges expired entries', async () => {
    const rateLimit = await importRateLimit();
    const opts = { limit: 5, windowSeconds: 10 };

    rateLimit('cleanup-test', opts);

    // Advance past the window so entry is expired
    vi.advanceTimersByTime(15_000);

    // Trigger the 60s cleanup interval
    vi.advanceTimersByTime(60_000);

    // After cleanup, a new request should start a fresh window
    const result = rateLimit('cleanup-test', opts);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
