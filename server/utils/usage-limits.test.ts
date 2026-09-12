import { test, expect } from 'bun:test';
import { reserveUsage, configuredLimit } from './usage-limits';

test('local reservations enforce budget and reset at window boundary', async () => {
  let now = 0;
  const deps = { fetch, now: () => now };
  await reserveUsage('unit-local', 2, 3, 1000, deps);
  await expect(reserveUsage('unit-local', 2, 3, 1000, deps)).rejects.toMatchObject({ status: 429 });
  await reserveUsage('unit-local', 1, 3, 1000, deps);
  now = 1000;
  await reserveUsage('unit-local', 3, 3, 1000, deps);
});

test('invalid configured limits fail closed', () => {
  process.env.UNIT_LIMIT = '-1';
  try {
    expect(() => configuredLimit('UNIT_LIMIT', 100)).toThrow();
  } finally {
    delete process.env.UNIT_LIMIT;
  }
});

test('shared counter enforces rejection and fails closed on backend error', async () => {
  const previous = [
    process.env.RATE_LIMIT_MODE,
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
  ];
  process.env.RATE_LIMIT_MODE = 'shared';
  process.env.UPSTASH_REDIS_REST_URL = 'https://limiter.invalid';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'unit-only';
  try {
    const fakeFetch = Object.assign(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const command = JSON.parse(String(init?.body));
        expect(command[0]).toBe('EVAL');
        expect(command[3]).toContain('unit-shared');
        return Response.json({ result: 0 });
      },
      { preconnect: fetch.preconnect },
    );
    await expect(reserveUsage('unit-shared', 1, 2, 1000, { fetch: fakeFetch, now: () => 0 })).rejects.toMatchObject({
      status: 429,
    });
    const failingFetch = Object.assign(async () => new Response('offline', { status: 503 }), {
      preconnect: fetch.preconnect,
    });
    await expect(reserveUsage('unit-shared', 1, 2, 1000, { fetch: failingFetch, now: () => 0 })).rejects.toMatchObject({
      status: 503,
    });
  } finally {
    ['RATE_LIMIT_MODE', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'].forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
  }
});
