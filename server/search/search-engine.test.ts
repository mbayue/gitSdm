import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { cache, clearAllCaches, hashContext } from '../cache/lru';
import { createSearchEngine, getSearchEngine } from './search-engine';
import { getVectorStore } from './vector-store';
import type { IndexedChunk, SearchEngine, SearchResponse } from './types';

const repoKey = 'owner/repo';

function chunk(id: string, vector: Float32Array): IndexedChunk {
  return {
    id,
    vector,
    metadata: {
      filePath: `${id}.ts`,
      startLine: 1,
      endLine: 2,
      chunkIndex: 0,
      language: 'typescript',
      content: `content ${id}`,
      repoKey,
      commitSha: 'sha',
    },
  };
}

describe('createSearchEngine — input validation', () => {
  const engine: SearchEngine = createSearchEngine();

  it('rejects query shorter than 3 chars', async () => {
    await expect(
      engine.search({ query: 'ab', owner: 'o', repo: 'r', commitSha: 'sha' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects query longer than 500 chars', async () => {
    const longQuery = 'x'.repeat(501);
    await expect(
      engine.search({ query: longQuery, owner: 'o', repo: 'r', commitSha: 'sha' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects when no index exists for repo', async () => {
    await expect(
      engine.search({
        query: 'find the authentication logic',
        owner: 'nobody',
        repo: 'ghost',
        commitSha: 'sha',
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('createSearchEngine — success/cache paths', () => {
  beforeEach(() => {
    clearAllCaches();
    getVectorStore().removeByRepo(repoKey);
    process.env.AI_PROVIDER = 'mock';
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  it('searches indexed chunks and caches response', async () => {
    getVectorStore().addChunks([
      chunk('a', new Float32Array([1, 0, 0])),
      chunk('b', new Float32Array([0, 1, 0])),
    ]);

    const engine = createSearchEngine();
    const first = await engine.search({
      query: 'component architecture',
      owner: 'owner',
      repo: 'repo',
      commitSha: 'sha',
      topK: 2,
      minScore: 0,
    });

    expect(first.cached).toBe(false);
    expect(first.query).toBe('component architecture');
    expect(first.results.length).toBeGreaterThan(0);

    const second = await engine.search({
      query: 'component architecture',
      owner: 'owner',
      repo: 'repo',
      commitSha: 'sha',
      topK: 2,
      minScore: 0,
    });

    expect(second.cached).toBe(true);
    expect(second.results).toEqual(first.results);
  });

  it('returns singleton engine', () => {
    expect(getSearchEngine()).toBe(getSearchEngine());
  });

  it('returns cached response before embedding', async () => {
    getVectorStore().addChunks([chunk('a', new Float32Array([1, 0, 0]))]);

    const cached: SearchResponse = {
      results: [],
      query: 'cached query',
      cached: false,
    };
    cache.set(`search:owner/repo@sha:${hashContext('cached query')}`, cached);

    const result = await createSearchEngine().search({
      query: 'cached query',
      owner: 'owner',
      repo: 'repo',
      commitSha: 'sha',
    });

    expect(result.cached).toBe(true);
    expect(result.results).toEqual([]);
  });

  it('throws 503 when embedding provider fails', async () => {
    getVectorStore().addChunks([chunk('a', new Float32Array([1, 0, 0]))]);

    // Mock createEmbeddingProvider to return a provider that throws on embed
    mock.module('./embedding-provider', () => ({
      createEmbeddingProvider: async () => ({
        embed: async () => { throw new Error('embedding service down'); },
        embedBatch: async () => [],
        tokenCount: (text: string) => text.split(/\s+/).length,
      }),
    }));

    // Re-import to pick up the mock
    const { createSearchEngine: createEngine } = await import('./search-engine');
    const engine = createEngine();

    await expect(
      engine.search({
        query: 'some failing query',
        owner: 'owner',
        repo: 'repo',
        commitSha: 'sha2',
      }),
    ).rejects.toMatchObject({ status: 503 });

    mock.restore();
  });
});