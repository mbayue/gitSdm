import { describe, expect, it, beforeEach } from 'bun:test';
import {
  aiCacheKey,
  analyzeCacheKey,
  cache,
  clearAllCaches,
  hashContext,
  hashApiKey,
  invalidateSearchCache,
} from './lru';

describe('cache/lru', () => {
  beforeEach(() => {
    clearAllCaches();
  });

  it('stores, reads, checks, deletes values across buckets', () => {
    cache.set('analyze:a', { value: 1 });
    cache.set('ai:a', { value: 2 });
    cache.set('search:a', { value: 3 });
    cache.set('index:a', { value: 4 });

    expect(cache.get<{ value: number }>('analyze:a')?.value).toBe(1);
    expect(cache.get<{ value: number }>('ai:a')?.value).toBe(2);
    expect(cache.get<{ value: number }>('search:a')?.value).toBe(3);
    expect(cache.get<{ value: number }>('index:a')?.value).toBe(4);

    expect(cache.has('ai:a')).toBe(true);
    cache.delete('ai:a');
    expect(cache.has('ai:a')).toBe(false);
  });

  it('supports ttl expiry', async () => {
    cache.set('search:ttl', { ok: true }, 1);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(cache.get('search:ttl')).toBeUndefined();
  });

  it('clears all buckets', () => {
    cache.set('analyze:a', { ok: true });
    cache.set('ai:a', { ok: true });
    cache.set('search:a', { ok: true });
    cache.set('index:a', { ok: true });

    clearAllCaches();

    expect(cache.has('analyze:a')).toBe(false);
    expect(cache.has('ai:a')).toBe(false);
    expect(cache.has('search:a')).toBe(false);
    expect(cache.has('index:a')).toBe(false);
  });

  it('invalidates search cache for one repo only', () => {
    cache.set('search:bayue/repo@sha:a', { hit: 1 });
    cache.set('search:bayue/repo@sha:b', { hit: 2 });
    cache.set('search:other/repo@sha:a', { hit: 3 });

    invalidateSearchCache('bayue', 'repo');

    expect(cache.has('search:bayue/repo@sha:a')).toBe(false);
    expect(cache.has('search:bayue/repo@sha:b')).toBe(false);
    expect(cache.has('search:other/repo@sha:a')).toBe(true);
  });

  it('builds cache keys deterministically', () => {
    expect(analyzeCacheKey('o', 'r', 's')).toBe('analyze:o/r@s');
    expect(analyzeCacheKey('o', 'r', 's', 'main')).toBe('analyze:o/r@s:main');
    expect(aiCacheKey('summary', 'o', 'r', 's', 'ctx')).toBe('ai:summary:o/r@s:ctx');
  });
});

describe('hashContext', () => {
  it('produces the correct SHA-256 hex string for a known input', () => {
    // "hello world" -> SHA256 -> b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
    expect(hashContext('hello world')).toBe(
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    );
  });

  it('produces different hashes for different strings', () => {
    const hash1 = hashContext('abc');
    const hash2 = hashContext('abcd');
    expect(hash1).not.toBe(hash2);
    expect(hash1).toBe(hashContext('abc')); // Deterministic
  });

  it('produces the correct hash for an empty string', () => {
    // "" -> SHA256 -> e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(hashContext('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

describe('hashApiKey', () => {
  it('produces a distinct hash for api keys', () => {
    const key1 = 'sk-12345';
    const key2 = 'sk-67890';

    const hash1 = hashApiKey(key1);
    const hash2 = hashApiKey(key2);

    expect(hash1).not.toBe(hash2);
    expect(hash1).toBe(hashApiKey(key1)); // Deterministic
  });
});