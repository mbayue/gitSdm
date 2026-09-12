import type { IndexedChunk } from './types';
import { chunkBytes } from './vector-store';
import { SEARCH_LIMITS } from './limits';
import { AppError } from '../utils/errors';

export interface Checkpoint {
  chunks: IndexedChunk[];
  completed: Set<string>;
  totalFiles: number;
  bytes: number;
  expires: number;
}

/** Separate, bounded staging area; published indexes are never overwritten by partial data. */
export function createCheckpoints(limits = SEARCH_LIMITS, now = Date.now) {
  const entries = new Map<string, Checkpoint>();
  const prune = () => {
    for (const [key, value] of entries) if (value.expires <= now()) entries.delete(key);
  };
  return {
    get(key: string) {
      prune();
      return entries.get(key);
    },
    remove(key: string) {
      entries.delete(key);
    },
    save(key: string, chunks: IndexedChunk[], completed: Set<string>, totalFiles: number) {
      prune();
      const bytes = chunks.reduce((sum, chunk) => sum + chunkBytes(chunk), 0);
      const others = [...entries].filter(([id]) => id !== key);
      if (
        bytes > limits.indexBytes ||
        chunks.length > limits.chunks ||
        others.reduce((sum, [, value]) => sum + value.bytes, 0) + bytes > limits.totalBytes ||
        (!entries.has(key) && entries.size >= limits.indices)
      )
        throw new AppError(413, 'Saved indexing progress is at capacity.', 'INDEX_TOO_LARGE');
      entries.set(key, {
        chunks: [...chunks],
        completed: new Set(completed),
        totalFiles,
        bytes,
        expires: now() + Math.max(limits.ttlMs, 25 * 60 * 60 * 1000),
      });
    },
  };
}
