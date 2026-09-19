import type { IndexedChunk, SearchResult, VectorStore } from './types';
import { SEARCH_LIMITS } from './limits';
import { AppError } from '../utils/errors';

export function chunkBytes(chunk: IndexedChunk): number {
  return chunk.vector.byteLength + 2 * (chunk.id.length + JSON.stringify(chunk.metadata).length) + 256;
}

export function createVectorStore(limits = SEARCH_LIMITS, now = Date.now): VectorStore {
  const indices = new Map<string, { chunks: IndexedChunk[]; bytes: number; expires: number }>();
  const prune = () => {
    for (const [key, index] of indices) if (index.expires <= now()) indices.delete(key);
  };
  const get = (key: string) => {
    prune();
    const index = indices.get(key);
    if (index) {
      indices.delete(key);
      indices.set(key, index);
    }
    return index;
  };
  const replaceIndex = (key: string, chunks: IndexedChunk[]) => {
    const bytes = chunks.reduce((sum, chunk) => sum + chunkBytes(chunk), 0);
    if (chunks.length > limits.chunks || bytes > limits.indexBytes || bytes > limits.totalBytes)
      throw new AppError(413, 'Search index exceeds the repository size limit.', 'INDEX_TOO_LARGE');
    if (chunks.some((chunk) => chunk.metadata.repoKey !== key))
      throw new AppError(400, 'Index identity mismatch.', 'INVALID_INDEX');
    prune();
    // Validate before touching the published index.
    indices.delete(key);
    let total = [...indices.values()].reduce((sum, index) => sum + index.bytes, 0);
    while (indices.size && (total + bytes > limits.totalBytes || indices.size >= limits.indices)) {
      const oldest = indices.keys().next().value!;
      total -= indices.get(oldest)!.bytes;
      indices.delete(oldest);
    }
    indices.set(key, { chunks: [...chunks], bytes, expires: now() + limits.ttlMs });
  };
  return {
    replaceIndex,
    addChunks(chunks) {
      if (!chunks.length) return;
      const key = chunks[0].metadata.repoKey;
      replaceIndex(key, [...(get(key)?.chunks ?? []), ...chunks]);
    },
    removeByRepo(key) {
      indices.delete(key);
    },
    removeByFile(key, path) {
      const index = get(key);
      if (!index) return;
      const chunks = index.chunks.filter((chunk) => chunk.metadata.filePath !== path);
      if (!chunks.length) indices.delete(key);
      else replaceIndex(key, chunks);
    },
    search(vector, key, topK, minScore): SearchResult[] {
      const index = get(key);
      if (!index) return [];
      const scored: SearchResult[] = [];
      for (const chunk of index.chunks) {
        const score = cosineSimilarity(vector, chunk.vector);
        if (score >= minScore) scored.push({ chunk: chunk.metadata, score });
      }
      return scored.sort((a, b) => b.score - a.score).slice(0, topK);
    },
    getChunkCount(key) {
      return get(key)?.chunks.length ?? 0;
    },
    hasIndex(key) {
      return !!get(key);
    },
  };
}
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return Math.max(0, Math.min(1, dot));
}
let globalStore: VectorStore | null = null;
export function getVectorStore(): VectorStore {
  return (globalStore ??= createVectorStore());
}
