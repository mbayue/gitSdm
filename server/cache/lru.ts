import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T extends CacheValue>(key: string, value: T, ttlMs?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
}

type CacheValue = NonNullable<unknown>;

const analyzeCache = new LRUCache<string, CacheValue>({
  max: 200,
  ttl: 1000 * 60 * 60,
});

const aiCache = new LRUCache<string, CacheValue>({
  max: 200,
  ttl: 1000 * 60 * 30,
});

const searchCache = new LRUCache<string, CacheValue>({
  max: 500,
  ttl: 1000 * 60 * 60,
});

const indexCache = new LRUCache<string, CacheValue>({
  max: 50,
  ttl: 1000 * 60 * 60 * 2,
});

function getBucket(key: string): LRUCache<string, CacheValue> {
  if (key.startsWith('ai:')) return aiCache;
  if (key.startsWith('search:')) return searchCache;
  if (key.startsWith('index:')) return indexCache;
  return analyzeCache;
}

export const cache: CacheStore = {
  get<T>(key: string): T | undefined {
    return getBucket(key).get(key) as T | undefined;
  },
  set<T extends CacheValue>(key: string, value: T, ttlMs?: number): void {
    getBucket(key).set(key, value, ttlMs ? { ttl: ttlMs } : undefined);
  },
  has(key: string): boolean {
    return getBucket(key).has(key);
  },
  delete(key: string): void {
    getBucket(key).delete(key);
  },
};

export function clearAllCaches(): void {
  analyzeCache.clear();
  aiCache.clear();
  searchCache.clear();
  indexCache.clear();
}

export function getCacheSizes(): { analyze: number; ai: number; search: number; index: number } {
  return {
    analyze: analyzeCache.size,
    ai: aiCache.size,
    search: searchCache.size,
    index: indexCache.size,
  };
}

export function invalidateSearchCache(owner: string, repo: string): void {
  const prefix = `search:${owner}/${repo}@`;
  for (const key of searchCache.keys()) {
    if (key.startsWith(prefix)) {
      searchCache.delete(key);
    }
  }
}

export function analyzeCacheKey(owner: string, repo: string, sha: string, branch?: string): string {
  return branch
    ? `analyze:${owner}/${repo}@${sha}:${branch}`
    : `analyze:${owner}/${repo}@${sha}`;
}

export function aiCacheKey(
  kind: string,
  owner: string,
  repo: string,
  sha: string,
  contextHash: string,
  discriminator?: string,
): string {
  return discriminator
    ? `ai:${kind}:${owner}/${repo}@${sha}:${contextHash}:${discriminator}`
    : `ai:${kind}:${owner}/${repo}@${sha}:${contextHash}`;
}

export function hashContext(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

const API_KEY_CACHE_HASH_SECRET = process.env.API_KEY_CACHE_HASH_SECRET ?? 'api-key-cache-v1';

// This is cache-key derivation, not password storage.
// HMAC avoids exposing raw API keys without blocking request handling.
export function hashApiKey(key: string): string {
  return crypto
    .createHmac('sha256', API_KEY_CACHE_HASH_SECRET)
    .update(key)
    .digest('hex');
}
