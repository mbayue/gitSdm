import { LRUCache } from 'lru-cache';

export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T extends CacheValue>(key: string, value: T, ttlMs?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
}

type CacheValue = NonNullable<unknown>;

export const analyzeCache = new LRUCache<string, CacheValue>({
  max: 200,
  ttl: 1000 * 60 * 60,
});

export const aiCache = new LRUCache<string, CacheValue>({
  max: 200,
  ttl: 1000 * 60 * 30,
});

export const searchCache = new LRUCache<string, CacheValue>({
  max: 500, // up to 100 per repo, 5 repos typical
  ttl: 1000 * 60 * 60, // 60 minutes
});

export const indexCache = new LRUCache<string, CacheValue>({
  max: 50,
  ttl: 1000 * 60 * 60 * 2, // 2 hours
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

/** Remove all cached search results for a given repository. */
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
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
