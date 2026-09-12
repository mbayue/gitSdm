import { test, expect, spyOn } from 'bun:test';
import { handleApiRequest } from '../api-router';

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
  const fetchStub = spyOn(globalThis, 'fetch').mockImplementation(async () => {
    calls++;
    await gate;
    return Response.json({ result: 0 });
  });
  const log = spyOn(console, 'error').mockImplementation(() => {});
  const work: Array<Promise<Response | null>> = [];
  try {
    for (let i = 0; i < 25; i++) work.push(handleApiRequest(new Request('http://localhost/api/search'), '192.0.2.231'));
    expect(calls).toBe(8);
    release();
    expect((await Promise.all(work)).every((response) => response?.status === 429)).toBe(true);
    await handleApiRequest(new Request('http://localhost/api/search'), '192.0.2.231');
    expect(calls).toBe(9);
  } finally {
    release();
    await Promise.allSettled(work);
    fetchStub.mockRestore();
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
