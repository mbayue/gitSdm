import { test, expect, mock, spyOn } from 'bun:test';
import { Octokit } from '@octokit/rest';
import { createIndexingPipeline } from './indexing-pipeline';
import { createVectorStore } from './vector-store';
import { createChunker } from './chunker';
import { searchIndexKey } from './index-identity';
import { SEARCH_LIMITS } from './limits';
import type { EmbeddingProvider } from './types';
const ctx = { octokit: new Octokit(), gitHubToken: 'test-token' };
const options = { owner: 'owner', repo: 'repo', commitSha: 'first' };
function setup(overrides: Partial<typeof SEARCH_LIMITS> = {}) {
  const limits = { ...SEARCH_LIMITS, ...overrides };
  const store = createVectorStore(limits);
  const embedBatch = mock(async (texts: string[]) =>
    texts.map(() => ({ vector: new Float32Array([1, 0]), tokenCount: 1 })),
  );
  const provider: EmbeddingProvider = {
    dimensions: 2,
    maxTokens: 512,
    providerName: 'test',
    embedBatch,
    embed: async () => ({ vector: new Float32Array([1, 0]), tokenCount: 1 }),
  };
  const fetchFlatTree = mock(async () => ({
    items: [{ path: 'a.ts', type: 'blob' as const, sha: 'blob', size: 20 }],
    truncated: false,
    totalFiles: 1,
  }));
  const fetchFileContents = mock(async () => ({ 'a.ts': 'export const value = 1;' }));
  const pipeline = createIndexingPipeline(
    {
      fetchFlatTree,
      fetchFileContents,
      createChunker,
      getVectorStore: () => store,
      createEmbeddingProvider: async () => provider,
    },
    limits,
  );
  return { store, pipeline, embedBatch, fetchFlatTree, fetchFileContents };
}
test('same snapshot is reused; changed SHA and credential build separate indices', async () => {
  const s = setup();
  await s.pipeline.startIndexing(options, ctx);
  await s.pipeline.startIndexing(options, ctx);
  expect(s.embedBatch).toHaveBeenCalledTimes(1);
  await s.pipeline.startIndexing({ ...options, commitSha: 'second' }, ctx);
  await s.pipeline.startIndexing(options, { ...ctx, gitHubToken: 'other' });
  expect(s.embedBatch).toHaveBeenCalledTimes(3);
  expect(s.store.hasIndex(searchIndexKey('owner', 'repo', 'first', ctx))).toBe(true);
  expect(s.store.hasIndex(searchIndexKey('owner', 'repo', 'second', ctx))).toBe(true);
});
test('failed replacement throws and preserves the published old snapshot', async () => {
  const s = setup();
  await s.pipeline.startIndexing(options, ctx);
  s.embedBatch.mockImplementation(async () => {
    throw new Error('secret provider detail');
  });
  const log = spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(s.pipeline.startIndexing({ ...options, commitSha: 'new' }, ctx)).rejects.toMatchObject({
      status: 502,
    });
    expect(s.store.hasIndex(searchIndexKey('owner', 'repo', 'first', ctx))).toBe(true);
    const key = searchIndexKey('owner', 'repo', 'new', ctx);
    expect(s.store.hasIndex(key)).toBe(false);
    expect(s.pipeline.getStatus(key)).toMatchObject({
      state: 'failed',
      error: 'Repository indexing failed. Please retry.',
    });
  } finally {
    log.mockRestore();
  }
});
test('global job cap rejects other repositories and duplicate jobs without queuing', async () => {
  const s = setup({ concurrentJobs: 1 });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  s.fetchFileContents.mockImplementation(async () => {
    await gate;
    return { 'a.ts': 'const a = 1;' };
  });
  const first = s.pipeline.startIndexing(options, ctx);
  try {
    await expect(s.pipeline.startIndexing(options, ctx)).rejects.toMatchObject({ status: 409 });
    await expect(s.pipeline.startIndexing({ ...options, repo: 'other' }, ctx)).rejects.toMatchObject({ status: 429 });
  } finally {
    release();
    await first;
  }
});
test('file and chunk limits reject before embedding', async () => {
  for (const limits of [{ fileBytes: 10 }, { chunks: 0 }, { indexBytes: 1 }]) {
    const s = setup(limits);
    const log = spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(s.pipeline.startIndexing(options, ctx)).rejects.toMatchObject({ status: 413 });
      expect(s.embedBatch).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  }
});
test('empty repository is an actual completed index', async () => {
  const s = setup();
  s.fetchFlatTree.mockResolvedValue({ items: [], truncated: false, totalFiles: 0 });
  await s.pipeline.startIndexing(options, ctx);
  expect(s.pipeline.getStatus(searchIndexKey('owner', 'repo', 'first', ctx))).toMatchObject({
    state: 'complete',
    chunkCount: 0,
  });
});
test('status becomes idle when its index is evicted', async () => {
  const s = setup({ indices: 1 });
  await s.pipeline.startIndexing(options, ctx);
  await s.pipeline.startIndexing({ ...options, commitSha: 'new' }, ctx);
  expect(s.pipeline.getStatus(searchIndexKey('owner', 'repo', 'first', ctx))).toEqual({ state: 'idle' });
});
test('cancellation keeps the concurrency slot until the pending operation settles', async () => {
  const s = setup({ concurrentJobs: 1 });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  s.fetchFileContents.mockImplementation(async () => {
    await gate;
    return { 'a.ts': 'const a = 1;' };
  });
  const log = spyOn(console, 'error').mockImplementation(() => {});
  const work = s.pipeline.startIndexing(options, ctx);
  const rejection = work.catch((error) => error);
  s.pipeline.cancelIndexing(searchIndexKey('owner', 'repo', 'first', ctx));
  try {
    await expect(s.pipeline.startIndexing({ ...options, repo: 'other' }, ctx)).rejects.toMatchObject({ status: 429 });
  } finally {
    release();
    expect(await rejection).toMatchObject({ code: 'INDEXING_CANCELLED' });
    log.mockRestore();
  }
});
