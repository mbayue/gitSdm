import { test, expect } from 'bun:test';
import { createCheckpoints } from './checkpoints';
import { createIndexAvailability } from './index-availability';
import { createVectorStore } from './vector-store';
import { createSearchEngine } from './search-engine';
import { searchIndexKey } from './index-identity';
import { SEARCH_LIMITS } from './limits';
import type { IndexedChunk, EmbeddingProvider } from './types';

test('partial search is not cached and switches to the completed snapshot', async () => {
  const store = createVectorStore();
  const checkpoints = createCheckpoints();
  const { available, publish } = createIndexAvailability({ getVectorStore: () => store }, checkpoints);
  const options = { owner: 'partial', repo: 'search', commitSha: 'one', query: 'find example' };
  const key = searchIndexKey(options.owner, options.repo, options.commitSha);
  const chunk: IndexedChunk = {
    id: key + ':a',
    vector: new Float32Array([1, 0]),
    metadata: {
      repoKey: key,
      commitSha: 'one',
      filePath: 'a.ts',
      startLine: 1,
      endLine: 1,
      chunkIndex: 0,
      language: 'typescript',
      content: 'example',
    },
  };
  checkpoints.save(key, [chunk], new Set(['a.ts']), 2);
  const provider: EmbeddingProvider = {
    providerName: 'test',
    dimensions: 2,
    maxTokens: 100,
    embed: async () => ({ vector: new Float32Array([1, 0]), tokenCount: 1 }),
    embedBatch: async () => [],
  };
  const engine = createSearchEngine(
    { getVectorStore: () => store, createEmbeddingProvider: async () => provider },
    available,
  );
  expect((await engine.search(options)).coverage?.kind).toBe('partial');
  expect((await engine.search(options)).cached).toBe(false);
  store.replaceIndex(key, [chunk]);
  checkpoints.remove(key);
  publish(key, { kind: 'complete', commitSha: 'one', indexedFiles: 2, totalFiles: 2 });
  expect((await engine.search(options)).coverage?.kind).toBe('complete');
  const previous = await engine.search({ ...options, commitSha: 'two' });
  expect(previous.coverage?.kind).toBe('previous');
  expect(previous.results[0].chunk.commitSha).toBe('one');
  expect(available(searchIndexKey('partial', 'search', 'two', { gitHubToken: 'different' }))).toBeUndefined();
});

test('checkpoint capacity rejects excess entries and expiry releases them', () => {
  let now = 0;
  const checkpoints = createCheckpoints({ ...SEARCH_LIMITS, indices: 1 }, () => now);
  checkpoints.save('one', [], new Set(), 1);
  expect(() => checkpoints.save('two', [], new Set(), 1)).toThrow('capacity');
  now = 26 * 60 * 60 * 1000;
  expect(checkpoints.get('one')).toBeUndefined();
  checkpoints.save('two', [], new Set(), 1);
  expect(checkpoints.get('two')).toBeDefined();
});
