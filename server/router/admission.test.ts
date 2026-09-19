import { readFile } from 'node:fs/promises';
import { promises as dnsPromises } from 'node:dns';
import { test, expect, spyOn } from 'bun:test';
import { handleApiRequest, isRegisteredApiPath, registeredApiPaths } from '../api-router';
import { usageLimitTestHooks } from '../utils/usage-limits';

// The limiter resolves and re-validates its host before connecting; tests stub DNS so the
// fake 'limiter.invalid' endpoint resolves to a safe public address.
const stubLimiterDns = () =>
  spyOn(dnsPromises, 'lookup').mockImplementation(
    (async () => [{ address: '93.184.216.34', family: 4 }]) as unknown as typeof dnsPromises.lookup,
  );

// Dispatch literals extracted from the router sources, so this test fails if a route is
// added to a router without registering it — or if a registered path loses its dispatch.
const dispatchedPaths = [
  ...new Set(
    (
      await Promise.all(
        ['../api-router.ts', './ai-routes.ts', './repo-routes.ts', './search-routes.ts'].map((file) =>
          readFile(new URL(file, import.meta.url), 'utf8'),
        ),
      )
    )
      .join('\n')
      .match(/pathname === '([^']+)'/g)
      ?.map((match) => match.slice("pathname === '".length, -1)) ?? [],
  ),
].sort();

test('isRegisteredApiPath covers exactly the paths the routers dispatch on', () => {
  expect(dispatchedPaths.length).toBeGreaterThan(0);
  expect([...registeredApiPaths].sort()).toEqual(dispatchedPaths);
  for (const path of ['/api/search/xyz', '/api/ai/unknown', '/api/repo/analyze/extra', '/api/'])
    expect(isRegisteredApiPath(path)).toBe(false);
  // Non-/api paths are handled elsewhere (SPA/static middleware), never by the API router.
  expect(isRegisteredApiPath('/mock/gitsdm')).toBe(false);
  expect(isRegisteredApiPath('/')).toBe(false);
});

test('trending is rejected before GitHub work when the per-IP budget is exhausted', async () => {
  const previous = process.env.API_REQUESTS_PER_IP_PER_MINUTE;
  process.env.API_REQUESTS_PER_IP_PER_MINUTE = '0';
  const log = spyOn(console, 'error').mockImplementation(() => {});
  try {
    const response = await handleApiRequest(new Request('http://localhost/api/trending'), '192.0.2.230');
    expect(response?.status).toBe(429);
    const retryAfter = Number(response?.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
    expect(await response?.json()).toMatchObject({ code: 'USAGE_LIMIT_EXCEEDED' });
  } finally {
    log.mockRestore();
    if (previous === undefined) delete process.env.API_REQUESTS_PER_IP_PER_MINUTE;
    else process.env.API_REQUESTS_PER_IP_PER_MINUTE = previous;
  }
});

test('shared limiter work is bounded before Redis calls and releases slots after rejection', async () => {
  const names = ['RATE_LIMIT_MODE', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
  const previous = names.map((name) => process.env[name]);
  process.env.RATE_LIMIT_MODE = 'shared';
  process.env.UPSTASH_REDIS_REST_URL = 'https://limiter.invalid';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'unit-test';
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  usageLimitTestHooks.postJson = async () => {
    calls++;
    await gate;
    return { result: 0 };
  };
  const log = spyOn(console, 'error').mockImplementation(() => {});
  const lookupStub = stubLimiterDns();
  const work: Array<Promise<Response | null>> = [];
  try {
    for (let i = 0; i < 25; i++) work.push(handleApiRequest(new Request('http://localhost/api/search'), '192.0.2.231'));
    // The limiter resolves and re-validates DNS before connecting, so the admitted
    // requests reach the gated pinned POST a tick later — flush before asserting.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(calls).toBe(8);
    release();
    expect((await Promise.all(work)).every((response) => response?.status === 429)).toBe(true);
    await handleApiRequest(new Request('http://localhost/api/search'), '192.0.2.231');
    expect(calls).toBe(9);
  } finally {
    release();
    await Promise.allSettled(work);
    usageLimitTestHooks.postJson = undefined;
    lookupStub.mockRestore();
    log.mockRestore();
    names.forEach((name, i) => {
      if (previous[i] === undefined) delete process.env[name];
      else process.env[name] = previous[i];
    });
  }
});

test('exact search endpoint is subject to usage admission before work starts', async () => {
  const previous = process.env.API_REQUESTS_PER_MINUTE;
  process.env.API_REQUESTS_PER_MINUTE = '0';
  const log = spyOn(console, 'error').mockImplementation(() => {});
  try {
    const response = await handleApiRequest(
      new Request('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({ owner: 'mock', repo: 'todo-app', query: 'hello' }),
      }),
    );
    expect(response?.status).toBe(429);
    expect(await response?.json()).toMatchObject({ code: 'USAGE_LIMIT_EXCEEDED' });
  } finally {
    log.mockRestore();
    if (previous === undefined) delete process.env.API_REQUESTS_PER_MINUTE;
    else process.env.API_REQUESTS_PER_MINUTE = previous;
  }
});

test('unregistered /api paths return 404 before spending admission or usage budget', async () => {
  const names = ['RATE_LIMIT_MODE', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
  const previous = names.map((name) => process.env[name]);
  process.env.RATE_LIMIT_MODE = 'shared';
  process.env.UPSTASH_REDIS_REST_URL = 'https://limiter.invalid';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'unit-test';
  let pinnedCalls = 0;
  usageLimitTestHooks.postJson = async () => {
    pinnedCalls++;
    return { result: 1 };
  };
  const fetchStub = spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ result: 1 }));
  const lookupStub = stubLimiterDns();
  const log = spyOn(console, 'error').mockImplementation(() => {});
  try {
    const unknown = await handleApiRequest(new Request('http://localhost/api/search/xyz'), '192.0.2.232');
    expect(unknown?.status).toBe(404);
    expect(await unknown?.json()).toMatchObject({ code: 'NOT_FOUND' });
    expect(pinnedCalls).toBe(0);
    expect(fetchStub).not.toHaveBeenCalled();
    // Control: a registered path still reaches the shared limiter.
    const known = await handleApiRequest(
      new Request('http://localhost/api/search', { method: 'POST', body: '{}' }),
      '192.0.2.232',
    );
    expect(known?.status).toBe(400);
    expect(pinnedCalls).toBeGreaterThan(0);
  } finally {
    usageLimitTestHooks.postJson = undefined;
    fetchStub.mockRestore();
    lookupStub.mockRestore();
    log.mockRestore();
    names.forEach((name, i) => {
      if (previous[i] === undefined) delete process.env[name];
      else process.env[name] = previous[i];
    });
  }
});
