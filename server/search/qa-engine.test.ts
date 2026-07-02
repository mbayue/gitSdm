import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { createQAEngine, getQAEngine } from './qa-engine';
import { clearAllCaches } from '../cache/lru';
import { getVectorStore } from './vector-store';
import type { IndexedChunk } from './types';

mock.module('./embedding-provider', () => ({
  createEmbeddingProvider: async () => ({
    dimensions: 3,
    maxTokens: Infinity,
    providerName: 'mock',
    embed: async () => ({ vector: new Float32Array([1, 0, 0]), tokenCount: 1 }),
    embedBatch: async () => [],
  }),
}));

const repoKey = 'owner/repo';

function indexedChunk(id: string, scoreVector: Float32Array): IndexedChunk {
  return {
    id,
    vector: scoreVector,
    metadata: {
      filePath: `${id}.ts`,
      startLine: 1,
      endLine: 3,
      chunkIndex: 0,
      language: 'typescript',
      content: `export const ${id} = true;`,
      repoKey,
      commitSha: 'sha',
    },
  };
}

describe('createQAEngine', () => {
  beforeEach(() => {
    clearAllCaches();
    getVectorStore().removeByRepo(repoKey);
    process.env.AI_PROVIDER = 'mock';
  });

  afterAll(() => {
    mock.restore();
  });

  const qa = createQAEngine();

  it('returns not-available answer when no index exists', async () => {
    const response = await qa.ask({
      question: 'Where is the auth middleware?',
      owner: 'nobody',
      repo: 'ghost',
      commitSha: 'abc',
    });

    expect(response.answer).toContain('could not find');
    expect(response.citations).toEqual([]);
    expect(typeof response.cached).toBe('boolean');
  });

  it('returns empty citations when scores are below threshold', async () => {
    getVectorStore().addChunks([indexedChunk('low', new Float32Array([0, 0, 1]))]);

    const response = await qa.ask({
      question: 'How does routing work?',
      owner: 'owner',
      repo: 'repo',
      commitSha: 'sha',
    });

    expect(response.answer).toContain('could not find');
    expect(response.citations).toEqual([]);
  });

  it('answers with citations when relevant chunks exist', async () => {
    getVectorStore().addChunks([indexedChunk('architecture', new Float32Array([1, 0, 0]))]);

    const response = await qa.ask({
      question: 'architecture overview please',
      owner: 'owner',
      repo: 'repo',
      commitSha: 'sha',
    });

    expect(response.answer).toContain('overview');
    expect(response.citations).toEqual([{ filePath: 'architecture.ts', startLine: 1, endLine: 3 }]);
    expect(response.cached).toBe(false);
  });

  it('returns singleton qa engine', () => {
    expect(getQAEngine()).toBe(getQAEngine());
  });
});
