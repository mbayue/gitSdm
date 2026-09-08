import { test, expect } from 'bun:test';
import { createSearchEngine } from './search-engine';
import { createVectorStore } from './vector-store';
import { searchIndexKey } from './index-identity';
import type { EmbeddingProvider, IndexedChunk } from './types';

test('eviction during embedding rejects without caching an empty result', async () => {
  const store = createVectorStore();
  const key = searchIndexKey('eviction', 'test', 'sha');
  const entry: IndexedChunk = {
    id: 'a',
    vector: new Float32Array([1]),
    metadata: {
      repoKey: key,
      commitSha: 'sha',
      filePath: 'a.ts',
      language: 'typescript',
      content: 'hello',
      startLine: 1,
      endLine: 1,
      chunkIndex: 0,
    },
  };
  store.replaceIndex(key, [entry]);
  let calls = 0;
  const provider: EmbeddingProvider = {
    dimensions: 1,
    maxTokens: 512,
    providerName: 'test',
    embedBatch: async () => [],
    embed: async () => {
      if (++calls === 1) store.removeByRepo(key);
      return { vector: new Float32Array([1]), tokenCount: 1 };
    },
  };
  const engine = createSearchEngine({ getVectorStore: () => store, createEmbeddingProvider: async () => provider });
  const options = { owner: 'eviction', repo: 'test', commitSha: 'sha', query: 'hello eviction' };
  await expect(engine.search(options)).rejects.toMatchObject({ code: 'INDEX_NOT_FOUND' });
  store.replaceIndex(key, [entry]);
  const result = await engine.search(options);
  expect(result.cached).toBe(false);
  expect(result.results).toHaveLength(1);
  expect(calls).toBe(2);
});
