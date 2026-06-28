import { beforeEach, describe, expect, it, mock } from 'bun:test';

const vectorStore = {
  chunks: [] as any[],
  hasIndexValue: false,
  addChunks: mock((chunks: any[]) => vectorStore.chunks.push(...chunks)),
  removeByRepo: mock(() => {
    vectorStore.chunks = [];
  }),
  removeByFile: mock((repoKey: string, filePath: string) => {
    vectorStore.chunks = vectorStore.chunks.filter((chunk) => chunk.metadata.repoKey !== repoKey || chunk.metadata.filePath !== filePath);
  }),
  getChunkCount: mock((repoKey: string) => vectorStore.chunks.filter((chunk) => chunk.metadata.repoKey === repoKey).length),
  hasIndex: mock(() => vectorStore.hasIndexValue || vectorStore.chunks.length > 0),
};

let repoInfoSha = 'sha-current';
let flatTrees: Record<string, any[]> = {};
let fileContents: Record<string, string> = {};
let fetchFileContentsError = false;
let embedBatchError = false;
let chunkFileResult: any[] | null = null;

const fetchRepoInfo = mock(async () => ({ sha: repoInfoSha }));
const fetchFlatTree = mock(async (_owner: string, _repo: string, sha: string) => ({ items: flatTrees[sha] ?? [] }));
const fetchFileContents = mock(async (_owner: string, _repo: string, paths: string[]) => {
  if (fetchFileContentsError) throw new Error('fetch failed');
  return Object.fromEntries(paths.map((path) => [path, fileContents[path]]));
});
const embedBatch = mock(async (texts: string[]) => {
  if (embedBatchError) throw new Error('embed failed');
  return texts.map(() => ({ vector: new Float32Array([1, 0]), tokenCount: 1 }));
});
const chunkFile = mock((content: string, filePath: string, language: string) => chunkFileResult ?? [{
  content,
  filePath,
  language,
  startLine: 1,
  endLine: 1,
  chunkIndex: 0,
}]);
const invalidateSearchCache = mock(() => undefined);
const logError = mock(() => undefined);

mock.module('./vector-store', () => ({ getVectorStore: () => vectorStore }));
mock.module('../github/fetch-tree', () => ({ fetchRepoInfo, fetchFlatTree, fetchFileContents }));
mock.module('./embedding-provider', () => ({ createEmbeddingProvider: async () => ({ embedBatch }) }));
mock.module('./chunker', () => ({ createChunker: () => ({ chunkFile }) }));
mock.module('../cache/lru', () => ({ invalidateSearchCache }));
mock.module('../utils/logger', () => ({ logError }));

const { createIndexingPipeline, getIndexingPipeline } = await import('./indexing-pipeline');
const { AppError } = await import('../utils/errors');

const options = { owner: 'o', repo: 'r', commitSha: 'sha-current' };
const key = 'o/r';

beforeEach(() => {
  mock.restore();
  for (const fn of [
    vectorStore.addChunks,
    vectorStore.removeByRepo,
    vectorStore.removeByFile,
    vectorStore.getChunkCount,
    vectorStore.hasIndex,
    fetchRepoInfo,
    fetchFlatTree,
    fetchFileContents,
    embedBatch,
    chunkFile,
    invalidateSearchCache,
    logError,
  ]) {
    fn.mockClear();
  }
  vectorStore.chunks = [];
  vectorStore.hasIndexValue = false;
  repoInfoSha = 'sha-current';
  flatTrees = {
    'sha-current': [
      { path: 'src/a.ts', type: 'blob', sha: 'a1' },
      { path: 'README.md', type: 'blob', sha: 'readme' },
      { path: 'image.png', type: 'blob', sha: 'png' },
    ],
    'sha-prev': [
      { path: 'src/a.ts', type: 'blob', sha: 'old-a' },
      { path: 'src/deleted.ts', type: 'blob', sha: 'deleted' },
    ],
  };
  fileContents = {
    'src/a.ts': 'export const a = 1;',
    'README.md': '# readme',
  };
  fetchFileContentsError = false;
  embedBatchError = false;
  chunkFileResult = null;
});

describe('indexing pipeline', () => {
  it('returns idle status and can cancel to idle', () => {
    const pipeline = createIndexingPipeline();

    expect(pipeline.getStatus(key)).toEqual({ state: 'idle' });
    pipeline.cancelIndexing(key);
    expect(pipeline.getStatus(key)).toEqual({ state: 'idle' });
  });

  it('indexes supported files and stores chunks', async () => {
    const pipeline = createIndexingPipeline();

    await pipeline.startIndexing(options, {} as any);

    expect(fetchRepoInfo).toHaveBeenCalledWith('o', 'r', undefined, {});
    expect(fetchFlatTree).toHaveBeenCalledWith('o', 'r', 'sha-current', {});
    expect(vectorStore.removeByRepo).toHaveBeenCalledWith(key);
    expect(fetchFileContents).toHaveBeenCalledWith('o', 'r', expect.arrayContaining(['src/a.ts', 'README.md']), 'sha-current', {});
    expect(vectorStore.addChunks).toHaveBeenCalledTimes(1);
    expect(vectorStore.chunks.map((chunk) => chunk.metadata.filePath)).toEqual(['src/a.ts', 'README.md']);
    expect(invalidateSearchCache).toHaveBeenCalledWith('o', 'r');
    expect(pipeline.getStatus(key).state).toBe('complete');
  });

  it('uses repo info sha when commitSha is empty', async () => {
    const pipeline = createIndexingPipeline();
    repoInfoSha = 'resolved-sha';
    flatTrees['resolved-sha'] = flatTrees['sha-current'];

    await pipeline.startIndexing({ ...options, commitSha: '' }, {} as any);

    expect(fetchFlatTree).toHaveBeenCalledWith('o', 'r', 'resolved-sha', {});
  });

  it('skips indexing when repo already has chunks and no previousSha', async () => {
    const pipeline = createIndexingPipeline();
    vectorStore.hasIndexValue = true;
    vectorStore.chunks = [{ metadata: { repoKey: key } }];

    await pipeline.startIndexing(options, {} as any);

    expect(fetchRepoInfo).not.toHaveBeenCalled();
    expect(pipeline.getStatus(key)).toMatchObject({ state: 'complete', chunkCount: 1 });
  });

  it('still reindexes when index exists but chunk count is zero', async () => {
    const pipeline = createIndexingPipeline();
    vectorStore.hasIndexValue = true;

    await pipeline.startIndexing(options, {} as any);

    expect(fetchRepoInfo).toHaveBeenCalled();
  });

  it('does incremental indexing and removes deleted files', async () => {
    const pipeline = createIndexingPipeline();
    vectorStore.hasIndexValue = true;
    vectorStore.chunks = [{ metadata: { repoKey: key, filePath: 'src/deleted.ts' } }];

    await pipeline.startIndexing({ ...options, previousSha: 'sha-prev' }, {} as any);

    expect(fetchFlatTree).toHaveBeenCalledWith('o', 'r', 'sha-prev', {});
    expect(vectorStore.removeByFile).toHaveBeenCalledWith(key, 'src/deleted.ts');
    expect(fetchFileContents).toHaveBeenCalledWith('o', 'r', expect.arrayContaining(['src/a.ts', 'README.md']), 'sha-current', {});
  });

  it('handles no supported files', async () => {
    const pipeline = createIndexingPipeline();
    flatTrees['sha-current'] = [{ path: 'asset.png', type: 'blob', sha: 'png' }];

    await pipeline.startIndexing(options, {} as any);

    expect(fetchFileContents).not.toHaveBeenCalled();
    expect(vectorStore.addChunks).toHaveBeenCalledWith([]);
    expect(pipeline.getStatus(key)).toMatchObject({ state: 'complete', chunkCount: 0 });
  });

  it('fetches file contents in batches of at most five paths', async () => {
    const pipeline = createIndexingPipeline();
    flatTrees['sha-current'] = Array.from({ length: 12 }, (_, i) => ({ path: `src/file-${i}.ts`, type: 'blob', sha: `sha-${i}` }));
    fileContents = Object.fromEntries(flatTrees['sha-current'].map((item) => [item.path, `export const n = ${item.sha};`])) as Record<string, string>;

    await pipeline.startIndexing(options, {} as any);

    expect(fetchFileContents.mock.calls.map((call) => call[2].length)).toEqual([5, 5, 2]);
  });

  it('counts missing content as failed and aborts over threshold', async () => {
    const pipeline = createIndexingPipeline();
    fileContents = {};

    await pipeline.startIndexing(options, {} as any);

    expect(pipeline.getStatus(key)).toMatchObject({ state: 'failed', failedFiles: 2 });
    expect(vectorStore.addChunks).not.toHaveBeenCalled();
  });

  it('skips files with no chunks', async () => {
    const pipeline = createIndexingPipeline();
    chunkFileResult = [];

    await pipeline.startIndexing(options, {} as any);

    expect(embedBatch).not.toHaveBeenCalled();
    expect(pipeline.getStatus(key)).toMatchObject({ state: 'complete', chunkCount: 0 });
  });

  it('counts fetch content failures and aborts over threshold', async () => {
    const pipeline = createIndexingPipeline();
    fetchFileContentsError = true;

    await pipeline.startIndexing(options, {} as any);

    expect(pipeline.getStatus(key)).toMatchObject({ state: 'failed', failedFiles: 2 });
  });

  it('counts embedding failures and aborts over threshold', async () => {
    const pipeline = createIndexingPipeline();
    embedBatchError = true;

    await pipeline.startIndexing(options, {} as any);

    expect(logError).toHaveBeenCalledWith('indexing:embed', expect.any(Error), { file: expect.any(String) });
    expect(pipeline.getStatus(key)).toMatchObject({ state: 'failed', failedFiles: 2 });
  });

  it('records failed status when setup throws', async () => {
    const pipeline = createIndexingPipeline();
    fetchRepoInfo.mockImplementationOnce(async () => {
      throw new Error('boom');
    });

    await pipeline.startIndexing(options, {} as any);

    expect(pipeline.getStatus(key)).toMatchObject({ state: 'failed', error: 'boom', failedFiles: 0 });
    expect(logError).toHaveBeenCalledWith('/api/search/index', expect.any(Error), { repo: key });
  });

  it('rejects concurrent indexing and then clears active flag', async () => {
    const pipeline = createIndexingPipeline();
    let release!: () => void;
    fetchRepoInfo.mockImplementationOnce(async () => new Promise((resolve) => {
      release = () => resolve({ sha: 'sha-current' });
    }));

    const first = pipeline.startIndexing(options, {} as any);
    await expect(pipeline.startIndexing(options, {} as any)).rejects.toBeInstanceOf(AppError);
    release();
    await first;
    await pipeline.startIndexing(options, {} as any);

    expect(pipeline.getStatus(key).state).toBe('complete');
  });

  it('returns singleton pipeline', () => {
    expect(getIndexingPipeline()).toBe(getIndexingPipeline());
  });
});