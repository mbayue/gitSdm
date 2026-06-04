import { LRUCache } from 'lru-cache';

export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
}

const analyzeCache = new LRUCache<string, unknown>({
  max: 200,
  ttl: 1000 * 60 * 60,
});

const aiCache = new LRUCache<string, unknown>({
  max: 200,
  ttl: 1000 * 60 * 30,
});

export const cache: CacheStore = {
  get<T>(key: string): T | undefined {
    const bucket = key.startsWith('ai:') ? aiCache : analyzeCache;
    return bucket.get(key) as T | undefined;
  },
  set<T>(key: string, value: T, ttlMs?: number): void {
    const bucket = key.startsWith('ai:') ? aiCache : analyzeCache;
    bucket.set(key, value, ttlMs ? { ttl: ttlMs } : undefined);
  },
  has(key: string): boolean {
    const bucket = key.startsWith('ai:') ? aiCache : analyzeCache;
    return bucket.has(key);
  },
  delete(key: string): void {
    const bucket = key.startsWith('ai:') ? aiCache : analyzeCache;
    bucket.delete(key);
  },
};

export function clearAllCaches(): void {
  analyzeCache.clear();
  aiCache.clear();
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
): string {
  return `ai:${kind}:${owner}/${repo}@${sha}:${contextHash}`;
}

export function hashContext(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
