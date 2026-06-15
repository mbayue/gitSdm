import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { analyzeRepository } from './analyze-repo';
import { clearAllCaches } from '../cache/lru';

const mockRepoInfo = {
  fullName: 'test-owner/test-repo',
  description: 'test-desc',
  stars: 10,
  forks: 5,
  language: 'TypeScript',
  defaultBranch: 'main',
  sha: 'test-sha',
  url: 'https://github.com/test-owner/test-repo',
  topics: [],
  license: 'MIT',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

mock.module('../github/fetch-tree', () => ({
  fetchRepoInfo: async () => mockRepoInfo,
  fetchFlatTree: async () => ({
    items: [{ path: 'package.json', type: 'file' }, { path: 'src/main.ts', type: 'file' }],
    truncated: false,
  }),
  fetchContributors: async () => [],
  fetchTimeline: async () => [],
  buildTreeFromPaths: (items: any) => items,
  findManifestPaths: () => ['package.json'],
  fetchFileContents: async () => ({ 'package.json': '{}', 'src/main.ts': 'console.log(1)' }),
}));

mock.module('../github/parse-url', () => ({
  parseGitHubUrl: (input: string) => {
    if (input.includes('invalid')) return null;
    return { owner: 'test-owner', repo: 'test-repo' };
  },
}));

mock.module('../parser/file-classifier', () => ({
  annotateTree: (tree: any) => tree,
  findImportantFiles: () => ['src/main.ts'],
}));

mock.module('../parser/dependency-analyzer', () => ({
  analyzeDependencies: () => ({}),
}));

mock.module('../graph/graph-builder', () => ({
  buildGraph: () => ({ nodes: [], edges: [] } as any),
}));

describe('services/analyze-repo', () => {
  beforeEach(() => {
    clearAllCaches();
  });

  it('throws error for invalid repo url', () => {
    expect(analyzeRepository('invalid-url')).rejects.toThrow('Invalid GitHub repository URL');
  });

  it('runs the full repository analysis pipeline and caches the result', async () => {
    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo');
    expect(analysis.meta.fullName).toBe('test-owner/test-repo');
    expect(analysis.importantFiles).toEqual(['src/main.ts']);
    expect(analysis.treeTruncated).toBe(false);

    // Call again, should return cached
    const cachedAnalysis = await analyzeRepository('https://github.com/test-owner/test-repo');
    expect(cachedAnalysis).toBe(analysis);
  });
});
