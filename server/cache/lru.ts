import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import { cacheHashSecret } from './hash-secret';

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

const churnCache = new LRUCache<string, CacheValue>({
  max: 200,
  ttl: 1000 * 60 * 60,
});

function getBucket(key: string): LRUCache<string, CacheValue> {
  if (key.startsWith('ai:')) return aiCache;
  if (key.startsWith('search:')) return searchCache;
  if (key.startsWith('index:')) return indexCache;
  if (key.startsWith('churn:')) return churnCache;
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
  churnCache.clear();
}

export function getCacheSizes(): { analyze: number; ai: number; search: number; index: number; churn: number } {
  return {
    analyze: analyzeCache.size,
    ai: aiCache.size,
    search: searchCache.size,
    index: indexCache.size,
    churn: churnCache.size,
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

export function analyzeCacheKey(owner: string, repo: string, sha: string, branch?: string, token?: string): string {
  const scope = hashToken(token || process.env.GITHUB_TOKEN?.trim() || 'anonymous');
  return `analyze:${owner}/${repo}@${sha}:${scope}:${JSON.stringify(branch ?? null)}`;
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

export function churnCacheKey(owner: string, repo: string, branch?: string, days = 90): string {
  return branch ? `churn:${owner}/${repo}@${branch}:${days}d` : `churn:${owner}/${repo}@default:${days}d`;
}

export function hashContext(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// This is cache-key derivation, not password storage.
// HMAC keeps raw tokens out of cache identities.
export function hashToken(token: string): string {
  return crypto.createHmac('sha256', cacheHashSecret()).update(token).digest('hex');
}
