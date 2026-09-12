import { expect, test } from 'bun:test';
import { embeddingRetryAfter, isEmbeddingRateLimit, withEmbeddingRetry } from './embedding-retry';
import { toErrorPayload } from '../utils/errors';

test('recognizes SDK rate-limit wording and structured status', () => {
  expect(isEmbeddingRateLimit(new Error('Retryable HTTP Error: Too Many Requests'))).toBe(true);
  expect(isEmbeddingRateLimit({ status: 429 })).toBe(true);
  expect(isEmbeddingRateLimit(new Error('RESOURCE_EXHAUSTED'))).toBe(true);
  expect(isEmbeddingRateLimit(new Error('invalid credentials'))).toBe(false);
});

test('rate limits return a safe 429 without spending more requests during cooldown', async () => {
  let attempts = 0;
  const delays: number[] = [];
  try {
    await withEmbeddingRetry(async () => {
      attempts++;
      throw new Error('Retryable HTTP Error: Too Many Requests');
    }, async (ms) => { delays.push(ms); });
    throw new Error('Expected rejection');
  } catch (error) {
    expect(toErrorPayload(error)).toMatchObject({ status: 429, code: 'EMBEDDING_RATE_LIMITED', retryable: true });
  }
  expect(attempts).toBe(1);
  expect(delays).toEqual([]);
});

test('transient timeout recovers without unnecessary retries', async () => {
  let attempts = 0;
  const result = await withEmbeddingRetry(async () => {
    if (++attempts === 1) throw new Error('timeout');
    return 'ok';
  }, async () => {});
  expect(result).toBe('ok');
  expect(attempts).toBe(2);
});

test('provider retry-after headers survive rate-limit conversion', async () => {
  const error = Object.assign(new Error('Too Many Requests'), { headers: new Headers({ 'Retry-After': '120' }) });
  expect(embeddingRetryAfter(error)).toBe(120);
  await expect(withEmbeddingRetry(async () => { throw error; })).rejects.toMatchObject({
    status: 429, context: { retryAfterSeconds: 120 },
  });
  expect(embeddingRetryAfter({ headers: { 'retry-after': 'invalid' } })).toBe(60);
});
