// ponytail: in-memory promise/result cache covers tab switching; upgrade to persistent DB cache if offline AI replay is needed.
import type { AIHealthResponse, AIRefactorResponse, AIRoastResponse, AIReadmeEnhanceResponse } from '@/types';

export const explanationCache = new Map<string, string>();
export const healthCache = new Map<string, AIHealthResponse>();
export const refactorCache = new Map<string, AIRefactorResponse>();
export const roastCache = new Map<string, AIRoastResponse>();
export const readmeEnhanceCache = new Map<string, AIReadmeEnhanceResponse>();

export function getToolKey(kind: string, owner: string, repo: string, revision: number, branch?: string | null) {
  return `${kind}:${owner}/${repo}/${revision}/${branch || 'default'}`;
}

export function createCachedTask<T>(cache: Map<string, T>) {
  const pending = new Map<string, Promise<T>>();
  return (key: string, run: () => Promise<T>): Promise<T> => {
    const cached = cache.get(key);
    if (cached !== undefined) return Promise.resolve(cached);
    const existing = pending.get(key);
    if (existing) return existing;
    const request = Promise.resolve().then(run).then((data) => {
      cache.set(key, data);
      return data;
    }).finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}

export const runExplanation = createCachedTask(explanationCache);
export const runHealth = createCachedTask(healthCache);
export const runRefactor = createCachedTask(refactorCache);
export const runRoast = createCachedTask(roastCache);
export const runReadmeEnhance = createCachedTask(readmeEnhanceCache);
