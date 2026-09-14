import { expect, test } from 'bun:test';
import { cacheHashSecret } from './hash-secret';
import { analyzeCacheKey } from './lru';

test('local fallback is random process-stable material and empty configuration uses it', () => {
  const secret = cacheHashSecret({});
  expect(secret).toMatch(/^[a-f0-9]{64}$/);
  expect(cacheHashSecret({ TOKEN_CACHE_HASH_SECRET: '  ' })).toBe(secret);
});

test('shared mode requires a configured secret, including implicit Redis mode', () => {
  for (const env of [
    { RATE_LIMIT_MODE: 'shared' },
    { UPSTASH_REDIS_REST_URL: 'https://example.com' },
    { UPSTASH_REDIS_REST_TOKEN: 'test' },
  ]) {
    expect(() => cacheHashSecret(env)).toThrow('TOKEN_CACHE_HASH_SECRET is required');
    expect(cacheHashSecret({ ...env, TOKEN_CACHE_HASH_SECRET: 'configured-test-secret' })).toBe(
      'configured-test-secret',
    );
  }
});

test('analysis keys isolate credentials without exposing tokens', () => {
  const first = analyzeCacheKey('owner', 'repo', 'sha', 'main', 'credential-a');
  expect(first).not.toContain('credential-a');
  expect(first).not.toBe(analyzeCacheKey('owner', 'repo', 'sha', 'main', 'credential-b'));
  expect(first).toBe(analyzeCacheKey('owner', 'repo', 'sha', 'main', 'credential-a'));
});
