import { describe, expect, it, beforeEach } from 'bun:test';
import {
  aiCacheKey,
  analyzeCacheKey,
  cache,
  clearAllCaches,
  getCacheSizes,
  hashContext,
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

  it('verifies clearAllCaches sets cache sizes to 0', () => {
    cache.set('analyze:test1', { ok: true });
    cache.set('ai:test2', { ok: true });
    cache.set('search:test3', { ok: true });
    cache.set('index:test4', { ok: true });

    let sizes = getCacheSizes();
    expect(sizes.analyze).toBe(1);
    expect(sizes.ai).toBe(1);
    expect(sizes.search).toBe(1);
    expect(sizes.index).toBe(1);

    clearAllCaches();

    sizes = getCacheSizes();
    expect(sizes.analyze).toBe(0);
    expect(sizes.ai).toBe(0);
    expect(sizes.search).toBe(0);
    expect(sizes.index).toBe(0);
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

  it('builds cache keys and hashes deterministically', () => {
    expect(analyzeCacheKey('o', 'r', 's')).toBe('analyze:o/r@s');
    expect(analyzeCacheKey('o', 'r', 's', 'main')).toBe('analyze:o/r@s:main');
    expect(aiCacheKey('summary', 'o', 'r', 's', 'ctx')).toBe('ai:summary:o/r@s:ctx');
    expect(hashContext('abc')).toBe(hashContext('abc'));
    expect(hashContext('abc')).not.toBe(hashContext('abcd'));
  });
});