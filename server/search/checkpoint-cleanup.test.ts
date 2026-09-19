import { test, expect, spyOn } from 'bun:test';
import { Octokit } from '@octokit/rest';
import { createIndexingPipeline } from './indexing-pipeline';
import { createVectorStore } from './vector-store';
import { SEARCH_LIMITS } from './limits';
import { searchIndexKey } from './index-identity';

test('terminal failures release capacity for unrelated repositories without deleting complete indexes', async () => {
  const limits = { ...SEARCH_LIMITS, chunks: 1, indices: 1 };
  const store = createVectorStore(limits);
  const ctx = { octokit: new Octokit(), gitHubToken: 'test' };
  const pipeline = createIndexingPipeline(
    {
      getVectorStore: () => store,
      fetchFlatTree: async () => ({
        items: [{ path: 'a.ts', type: 'blob', sha: 'x', size: 10 }],
        truncated: false,
        totalFiles: 1,
      }),
      fetchFileContents: async (_owner, repo) => ({ 'a.ts': repo }),
      createChunker: () => ({
        chunkFile: (content) =>
          Array.from({ length: content === 'oversize' ? 2 : 1 }, (_, chunkIndex) => ({
            content: 'x',
            filePath: 'a.ts',
            chunkIndex,
            startLine: 1,
            endLine: 1,
            language: 'ts',
          })),
      }),
      createEmbeddingProvider: async () => ({
        dimensions: 1,
        maxTokens: 10,
        providerName: 'test',
        embed: async () => ({ vector: new Float32Array([1]), tokenCount: 1 }),
        embedBatch: async (texts) => texts.map(() => ({ vector: new Float32Array([1]), tokenCount: 1 })),
      }),
    },
    limits,
  );
  const options = { owner: 'test', repo: 'valid', commitSha: 'one' };
  await pipeline.startIndexing(options, ctx);
  const log = spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(pipeline.startIndexing({ ...options, repo: 'oversize' }, ctx)).rejects.toMatchObject({ status: 413 });
    expect(store.hasIndex(searchIndexKey('test', 'valid', 'one', ctx))).toBe(true);
    await pipeline.startIndexing({ ...options, repo: 'another' }, ctx);
    expect(pipeline.getStatus(searchIndexKey('test', 'another', 'one', ctx)).state).toBe('complete');
  } finally {
    log.mockRestore();
  }
});
