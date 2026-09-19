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

test('negative and non-integer amounts fail closed instead of replenishing quota', async () => {
  const deps = { fetch, now: () => 0 };
  await reserveUsage('unit-nonpositive', 2, 3, 1000, deps);
  for (const amount of [-1, 1.5, Number.NaN]) {
    await expect(reserveUsage('unit-nonpositive', amount, 3, 1000, deps)).rejects.toMatchObject({
      code: 'INVALID_USAGE_AMOUNT',
    });
    await expect(
      reserveUsage('unit-nonpositive-shared', amount, 3, 1000, {
        ...deps,
        lookup: async () => ['93.184.216.34'],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_USAGE_AMOUNT' });
  }
  await expect(reserveUsage('unit-nonpositive', 2, 3, 1000, deps)).rejects.toMatchObject({ status: 429 });
});

test('zero-byte batches reserve nothing and fail closed on negative quota instead', async () => {
  const deps = { fetch, now: () => 0 };
  await reserveUsage('unit-zero', 0, 3, 1000, deps);
  await reserveUsage('unit-zero', 3, 3, 1000, deps);
  await expect(reserveUsage('unit-zero', 1, 3, 1000, deps)).rejects.toMatchObject({ status: 429 });
});

test('invalid configured limits fail closed', () => {
  process.env.UNIT_LIMIT = '-1';
  try {
    expect(() => configuredLimit('UNIT_LIMIT', 100)).toThrow();
  } finally {
    delete process.env.UNIT_LIMIT;
  }
});

test('IPv6-literal limiter URLs resolve without brackets and enforce the budget', async () => {
  const previous = [
    process.env.RATE_LIMIT_MODE,
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
  ];
  process.env.RATE_LIMIT_MODE = 'shared';
  process.env.UPSTASH_REDIS_REST_URL = 'https://[2606:4700::1]';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'unit-only';
  try {
    let seenUrl: string | undefined;
    let seenAddresses: string[] | undefined;
    const postJson = async (args: { url: string; payload: string; addresses: string[] }) => {
      seenUrl = args.url;
      seenAddresses = args.addresses;
      expect(JSON.parse(args.payload)[0]).toBe('EVAL');
      return { result: 0 };
    };
    // Uses the real dns.lookup default: IP literals resolve locally, no network needed.
    await expect(
      reserveUsage('unit-shared-v6', 1, 1, 1000, { fetch, now: () => 0, postJson }),
    ).rejects.toMatchObject({ status: 429 });
    expect(seenUrl).toBe('https://[2606:4700::1]');
    expect(seenAddresses).toContain('2606:4700::1');
  } finally {
    ['RATE_LIMIT_MODE', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'].forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
  }
});

test('shared limiter fails closed when DNS resolution hangs', async () => {
  const previous = [
    process.env.RATE_LIMIT_MODE,
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
  ];
  process.env.RATE_LIMIT_MODE = 'shared';
  process.env.UPSTASH_REDIS_REST_URL = 'https://limiter.invalid';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'unit-only';
  try {
    let postCalled = false;
    const postJson = async () => {
      postCalled = true;
      return { result: 1 };
    };
    await expect(
      reserveUsage('unit-shared', 1, 2, 1000, {
        fetch,
        now: () => 0,
        postJson,
        lookup: () => new Promise<string[]>(() => {}),
        lookupTimeoutMs: 10,
      }),
    ).rejects.toMatchObject({ status: 503, code: 'LIMITER_UNAVAILABLE' });
    expect(postCalled).toBe(false);
  } finally {
    ['RATE_LIMIT_MODE', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'].forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
  }
});

test('shared limiter fails closed without contacting the backend when a resolved address is unsafe', async () => {
  const previous = [
    process.env.RATE_LIMIT_MODE,
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
  ];
  process.env.RATE_LIMIT_MODE = 'shared';
  process.env.UPSTASH_REDIS_REST_URL = 'https://limiter.invalid';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'unit-only';
  try {
    let postCalled = false;
    const postJson = async () => {
      postCalled = true;
      return { result: 1 };
    };
    await expect(
      reserveUsage('unit-shared', 1, 2, 1000, {
        fetch,
        now: () => 0,
        postJson,
        lookup: async () => ['10.0.0.5', '93.184.216.34'],
      }),
    ).rejects.toMatchObject({ status: 503, code: 'LIMITER_UNAVAILABLE' });
    expect(postCalled).toBe(false);
  } finally {
    ['RATE_LIMIT_MODE', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'].forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
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
    const postJson = async (args: { url: string; token: string; payload: string; addresses: string[] }) => {
      const command = JSON.parse(args.payload);
      expect(command[0]).toBe('EVAL');
      expect(command[3]).toContain('unit-shared');
      expect(args.url).toBe('https://limiter.invalid');
      expect(args.token).toBe('unit-only');
      expect(args.addresses).toEqual(['93.184.216.34']);
      return { result: 0 };
    };
    await expect(
      reserveUsage('unit-shared', 1, 2, 1000, {
        fetch,
        now: () => 0,
        postJson,
        lookup: async () => ['93.184.216.34'],
      }),
    ).rejects.toMatchObject({
      status: 429,
    });
    const failingPost = async () => {
      throw new Error('offline');
    };
    await expect(
      reserveUsage('unit-shared', 1, 2, 1000, {
        fetch,
        now: () => 0,
        postJson: failingPost,
        lookup: async () => ['93.184.216.34'],
      }),
    ).rejects.toMatchObject({
      status: 503,
    });
  } finally {
    ['RATE_LIMIT_MODE', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'].forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
  }
});
