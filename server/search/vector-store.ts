import type { IndexedChunk, SearchResult, VectorStore } from './types';

interface RepoIndex {
  chunks: IndexedChunk[];
  commitSha: string;
  createdAt: number;
}

export function createVectorStore(): VectorStore {
  const indices = new Map<string, RepoIndex>();

  return {
    addChunks(chunks: IndexedChunk[]): void {
      if (chunks.length === 0) return;
      const repoKey = chunks[0].metadata.repoKey;
      const existing = indices.get(repoKey);

      if (existing) {
        existing.chunks.push(...chunks);
      } else {
        indices.set(repoKey, {
          chunks: [...chunks],
          commitSha: chunks[0].metadata.commitSha,
          createdAt: Date.now(),
        });
      }
    },

    removeByRepo(repoKey: string): void {
      indices.delete(repoKey);
    },

    removeByFile(repoKey: string, filePath: string): void {
      const index = indices.get(repoKey);
      if (!index) return;
      index.chunks = index.chunks.filter((c) => c.metadata.filePath !== filePath);
      if (index.chunks.length === 0) {
        indices.delete(repoKey);
      }
    },

    search(
      queryVector: Float32Array,
      repoKey: string,
      topK: number,
      minScore: number,
    ): SearchResult[] {
      const index = indices.get(repoKey);
      if (!index || index.chunks.length === 0) return [];

      const scored: SearchResult[] = [];

      for (const chunk of index.chunks) {
        const score = cosineSimilarity(queryVector, chunk.vector);
        if (score >= minScore) {
          scored.push({ chunk: chunk.metadata, score });
        }
      }

      // Sort descending by score
      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, topK);
    },

    getChunkCount(repoKey: string): number {
      return indices.get(repoKey)?.chunks.length ?? 0;
    },

    hasIndex(repoKey: string): boolean {
      return indices.has(repoKey);
    },
  };
}

/** Compute cosine similarity between two unit vectors. */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  // Vectors are pre-normalized, so dot product = cosine similarity
  // Clamp to [0, 1] range (negative similarity → 0)
  return Math.max(0, Math.min(1, dot));
}

// ── Singleton ──────────────────────────────────────────────────────────

let globalStore: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!globalStore) {
    globalStore = createVectorStore();
  }
  return globalStore;
}
