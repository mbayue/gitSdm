import { describe, it, expect, beforeEach } from 'bun:test';
import { createVectorStore } from './vector-store';
import type { IndexedChunk } from './types';

function makeVector(size: number, val: number): Float32Array {
  const v = new Float32Array(size).fill(0);
  v[0] = val;
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return v.map((x) => x / mag);
}

function makeChunk(
  id: string,
  repoKey: string,
  filePath: string,
  vector: Float32Array,
): IndexedChunk {
  return {
    id,
    vector,
    metadata: {
      filePath,
      startLine: 1,
      endLine: 10,
      chunkIndex: 0,
      language: 'typescript',
      content: `// ${id}`,
      repoKey,
      commitSha: 'abc123',
    },
  };
}

describe('createVectorStore', () => {
  let store: ReturnType<typeof createVectorStore>;

  beforeEach(() => {
    store = createVectorStore();
  });

  describe('addChunks', () => {
    it('adds chunks and hasIndex returns true', () => {
      const vec = makeVector(4, 1);
      store.addChunks([makeChunk('c1', 'owner/repo', 'a.ts', vec)]);
      expect(store.hasIndex('owner/repo')).toBe(true);
    });

    it('ignores empty chunk array', () => {
      store.addChunks([]);
      expect(store.hasIndex('owner/repo')).toBe(false);
    });

    it('accumulates chunks across multiple addChunks calls', () => {
      const vec = makeVector(4, 1);
      store.addChunks([makeChunk('c1', 'owner/repo', 'a.ts', vec)]);
      store.addChunks([makeChunk('c2', 'owner/repo', 'b.ts', vec)]);
      expect(store.getChunkCount('owner/repo')).toBe(2);
    });

    it('isolates chunks by repoKey', () => {
      const vec = makeVector(4, 1);
      store.addChunks([makeChunk('c1', 'org/repoA', 'a.ts', vec)]);
      store.addChunks([makeChunk('c2', 'org/repoB', 'b.ts', vec)]);
      expect(store.getChunkCount('org/repoA')).toBe(1);
      expect(store.getChunkCount('org/repoB')).toBe(1);
    });
  });

  describe('removeByRepo', () => {
    it('deletes the entire repo index', () => {
      const vec = makeVector(4, 1);
      store.addChunks([makeChunk('c1', 'owner/repo', 'a.ts', vec)]);
      store.removeByRepo('owner/repo');
      expect(store.hasIndex('owner/repo')).toBe(false);
      expect(store.getChunkCount('owner/repo')).toBe(0);
    });

    it('is a no-op for unknown repo', () => {
      expect(() => store.removeByRepo('nobody/ghost')).not.toThrow();
    });
  });

  describe('removeByFile', () => {
    it('removes only chunks for the specified file', () => {
      const vec = makeVector(4, 1);
      store.addChunks([
        makeChunk('c1', 'owner/repo', 'a.ts', vec),
        makeChunk('c2', 'owner/repo', 'b.ts', vec),
      ]);
      store.removeByFile('owner/repo', 'a.ts');
      expect(store.getChunkCount('owner/repo')).toBe(1);
    });

    it('removes entire repo index when last file removed', () => {
      const vec = makeVector(4, 1);
      store.addChunks([makeChunk('c1', 'owner/repo', 'a.ts', vec)]);
      store.removeByFile('owner/repo', 'a.ts');
      expect(store.hasIndex('owner/repo')).toBe(false);
    });

    it('is a no-op for unknown repo', () => {
      expect(() => store.removeByFile('nobody/ghost', 'x.ts')).not.toThrow();
    });
  });

  describe('search', () => {
    it('returns empty array when no index exists', () => {
      const vec = makeVector(4, 1);
      const results = store.search(vec, 'missing/repo', 10, 0);
      expect(results).toEqual([]);
    });

    it('returns results sorted descending by score', () => {
      const dim = 4;
      const query = new Float32Array(dim);
      query[0] = 1;

      const identical = new Float32Array(dim);
      identical[0] = 1;

      const orthogonal = new Float32Array(dim);
      orthogonal[1] = 1;

      store.addChunks([
        makeChunk('close', 'owner/repo', 'a.ts', identical),
        makeChunk('far', 'owner/repo', 'b.ts', orthogonal),
      ]);

      const results = store.search(query, 'owner/repo', 10, 0);
      expect(results[0].score).toBeGreaterThan(results[1]?.score ?? -1);
    });

    it('filters by minScore', () => {
      const dim = 4;
      const query = new Float32Array(dim);
      query[0] = 1;

      const orthogonal = new Float32Array(dim);
      orthogonal[1] = 1;

      store.addChunks([makeChunk('far', 'owner/repo', 'b.ts', orthogonal)]);
      const results = store.search(query, 'owner/repo', 10, 0.5);
      expect(results).toHaveLength(0);
    });

    it('respects topK limit', () => {
      const dim = 4;
      const vec = new Float32Array(dim);
      vec[0] = 1;
      const chunks = Array.from({ length: 10 }, (_, i) =>
        makeChunk(`c${i}`, 'owner/repo', `${i}.ts`, vec),
      );
      store.addChunks(chunks);
      const results = store.search(vec, 'owner/repo', 3, 0);
      expect(results).toHaveLength(3);
    });

    it('score is clamped between 0 and 1', () => {
      const dim = 4;
      const vec = new Float32Array(dim);
      vec[0] = 1;
      store.addChunks([makeChunk('c1', 'owner/repo', 'a.ts', vec)]);
      const results = store.search(vec, 'owner/repo', 10, 0);
      expect(results[0].score).toBeGreaterThanOrEqual(0);
      expect(results[0].score).toBeLessThanOrEqual(1);
    });

    it('returns 0 similarity for mismatched vector dimensions', () => {
      const query = new Float32Array(4);
      query[0] = 1;
      const wrongDim = new Float32Array(8);
      wrongDim[0] = 1;
      store.addChunks([makeChunk('c1', 'owner/repo', 'a.ts', wrongDim)]);
      const results = store.search(query, 'owner/repo', 10, 0);
      for (const r of results) {
        expect(r.score).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getChunkCount', () => {
    it('returns 0 for unknown repo', () => {
      expect(store.getChunkCount('nobody/ghost')).toBe(0);
    });

    it('returns correct count after adds', () => {
      const vec = makeVector(4, 1);
      store.addChunks([
        makeChunk('c1', 'owner/repo', 'a.ts', vec),
        makeChunk('c2', 'owner/repo', 'b.ts', vec),
        makeChunk('c3', 'owner/repo', 'c.ts', vec),
      ]);
      expect(store.getChunkCount('owner/repo')).toBe(3);
    });
  });
});
