import { test, expect, mock, spyOn } from 'bun:test';
import { Octokit } from '@octokit/rest';
import { createIndexingPipeline } from './indexing-pipeline';
import { createVectorStore } from './vector-store';
import { createChunker } from './chunker';
import { searchIndexKey } from './index-identity';
import { SEARCH_LIMITS } from './limits';
import type { EmbeddingProvider } from './types';
import { AppError } from '../utils/errors';
const ctx = { octokit: new Octokit(), gitHubToken: 'test-token' };
const options = { owner: 'owner', repo: 'repo', commitSha: 'first' };

test('combines small files into bounded batches and preserves their file paths', async () => {
  const s = setup();
  s.fetchFlatTree.mockResolvedValue({
    items: Array.from({ length: 65 }, (_, i) => ({
      path: `file${i}.ts`,
      type: 'blob' as const,
      sha: 'blob',
      size: 20,
    })),
    truncated: false,
    totalFiles: 65,
  });
  s.fetchFileContents.mockImplementation(async (_owner, _repo, paths: string[]) => ({
    'a.ts': '',
    ...Object.fromEntries(paths.map((path) => [path, 'export const value = 1;'])),
  }));
  await s.pipeline.startIndexing(options, ctx);
  expect(s.embedBatch.mock.calls.map(([texts]) => texts.length)).toEqual([32, 32, 1]);
  expect(s.fetchFileContents.mock.calls.every((call) => call[2].length <= 4)).toBe(true);
  expect(s.fetchFileContents).toHaveBeenCalledTimes(17);
  const key = searchIndexKey('owner', 'repo', 'first', ctx);
  expect(s.store.getChunkCount(key)).toBe(65);
  const results = s.store.search(new Float32Array([1, 0]), key, 100, 0);
  expect(new Set(results.map((result) => result.chunk.filePath)).size).toBe(65);
});
function setup(overrides: Partial<typeof SEARCH_LIMITS> = {}, now = Date.now) {
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
  const fetchFileContents = mock(async () => ({
    'a.ts': 'export const value = 1;',
  }));
  const pipeline = createIndexingPipeline(
    {
      fetchFlatTree,
      fetchFileContents,
      createChunker,
      getVectorStore: () => store,
      createEmbeddingProvider: async () => provider,
    },
    limits,
    now,
  );
  return { store, pipeline, embedBatch, fetchFlatTree, fetchFileContents };
}

test('rate limit preserves completed batches and resumes only missing embeddings after cooldown', async () => {
  let now = 1000;
  const s = setup({}, () => now);
  s.fetchFlatTree.mockResolvedValue({
    items: Array.from({ length: 40 }, (_, i) => ({
      path: `file${i}.ts`,
      type: 'blob' as const,
      sha: 'blob',
      size: 20,
    })),
    truncated: false,
    totalFiles: 40,
  });
  s.fetchFileContents.mockImplementation(async (_owner, _repo, paths: string[]) => ({
    'a.ts': '',
    ...Object.fromEntries(paths.map((path) => [path, 'export const value = 1;'])),
  }));
  let calls = 0;
  s.embedBatch.mockImplementation(async (texts) => {
    if (++calls === 2)
      throw new AppError(429, 'Provider cooldown', 'EMBEDDING_RATE_LIMITED', true, { retryAfterSeconds: 60 });
    return texts.map(() => ({ vector: new Float32Array([1, 0]), tokenCount: 1 }));
  });
  const key = searchIndexKey('owner', 'repo', 'first', ctx);
  await s.pipeline.startIndexing(options, ctx);
  expect(s.pipeline.getStatus(key)).toMatchObject({
    state: 'paused',
    filesProcessed: 32,
    totalFiles: 40,
    retryAt: 61000,
  });
  expect(s.store.hasIndex(key)).toBe(false);
  const partial = s.pipeline.available(key)!;
  expect(partial.coverage).toMatchObject({ kind: 'partial', indexedFiles: 32 });
  expect(partial.store.getChunkCount(key)).toBe(32);
  expect(s.pipeline.available(searchIndexKey('owner', 'repo', 'first', { gitHubToken: 'other' }))).toBeUndefined();
  expect(s.pipeline.available(searchIndexKey('owner', 'repo', 'first', ctx, ['src']))).toBeUndefined();
  await s.pipeline.startIndexing(options, ctx);
  expect(calls).toBe(2);
  now = 61000;
  await s.pipeline.startIndexing(options, ctx);
  expect(s.embedBatch.mock.calls.map(([texts]) => texts.length)).toEqual([32, 8, 8]);
  expect(s.store.getChunkCount(key)).toBe(40);
  expect(s.pipeline.getStatus(key).state).toBe('complete');
});

test('cancelling a paused build discards its partial results', async () => {
  const s = setup();
  s.embedBatch.mockImplementation(async () => {
    throw new AppError(429, 'Limit', 'USAGE_LIMIT_EXCEEDED', true, { retryAfterSeconds: 86400 });
  });
  await s.pipeline.startIndexing(options, ctx);
  const key = searchIndexKey('owner', 'repo', 'first', ctx);
  expect(s.pipeline.getStatus(key).state).toBe('paused');
  s.pipeline.cancelIndexing(key);
  expect(s.pipeline.getStatus(key).state).toBe('idle');
  expect(s.pipeline.available(key)).toBeUndefined();
});
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
test('failed replacement pauses and preserves the published old snapshot', async () => {
  const s = setup();
  await s.pipeline.startIndexing(options, ctx);
  s.embedBatch.mockImplementation(async () => {
    throw new Error('secret provider detail');
  });
  const log = spyOn(console, 'error').mockImplementation(() => {});
  try {
    await s.pipeline.startIndexing({ ...options, commitSha: 'new' }, ctx);
    expect(s.store.hasIndex(searchIndexKey('owner', 'repo', 'first', ctx))).toBe(true);
    const key = searchIndexKey('owner', 'repo', 'new', ctx);
    expect(s.store.hasIndex(key)).toBe(false);
    expect(s.pipeline.getStatus(key)).toMatchObject({
      state: 'paused',
      coverage: { kind: 'previous', commitSha: 'first' },
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
    await expect(s.pipeline.startIndexing(options, ctx)).rejects.toMatchObject({
      status: 409,
    });
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
test('indexes only included paths after excluded paths are removed', async () => {
  const s = setup();
  s.fetchFlatTree.mockResolvedValue({
    items: [
      {
        path: 'packages/app/src/main.ts',
        type: 'blob' as const,
        sha: 'main',
        size: 20,
      },
      {
        path: 'packages/app/test/main.test.ts',
        type: 'blob' as const,
        sha: 'test',
        size: 20,
      },
      { path: 'docs/guide.md', type: 'blob' as const, sha: 'docs', size: 20 },
    ],
    truncated: false,
    totalFiles: 3,
  });
  s.fetchFileContents.mockImplementation(async (_owner, _repo, paths: string[]) => ({
    [paths[0]]: 'export const value = 1;',
  }));

  const scope = {
    includePaths: ['packages/app'],
    excludePaths: ['packages/app/test'],
  };
  await s.pipeline.startIndexing({ ...options, ...scope }, ctx);

  expect(s.fetchFileContents).toHaveBeenCalledTimes(1);
  expect(s.fetchFileContents.mock.calls[0][2]).toEqual(['packages/app/src/main.ts']);
  expect(s.store.hasIndex(searchIndexKey('owner', 'repo', 'first', ctx, scope.includePaths, scope.excludePaths))).toBe(
    true,
  );
});
test('empty repository is an actual completed index', async () => {
  const s = setup();
  s.fetchFlatTree.mockResolvedValue({
    items: [],
    truncated: false,
    totalFiles: 0,
  });
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
  expect(s.pipeline.getStatus(searchIndexKey('owner', 'repo', 'first', ctx))).toMatchObject({
    state: 'idle',
    coverage: { kind: 'previous' },
  });
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
    expect(await rejection).toBeUndefined();
    expect(s.pipeline.getStatus(searchIndexKey('owner', 'repo', 'first', ctx)).state).toBe('idle');
    log.mockRestore();
  }
});
