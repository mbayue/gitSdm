import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { analyzeRepository } from './analyze-repo';
import { clearAllCaches } from '../cache/lru';
import type { GraphBuildInput } from '../graph/graph-builder';

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

const workspaceFileContents = {
  'package.json': JSON.stringify({ name: '@repo/root', workspaces: ['packages/*'] }),
  'packages/a/package.json': JSON.stringify({ name: '@repo/a', dependencies: { '@repo/b': 'workspace:*' } }),
  'packages/b/package.json': JSON.stringify({ name: '@repo/b' }),
  'src/main.ts': 'console.log(1)',
};

const plainFileContents = {
  'package.json': JSON.stringify({ name: 'plain-app', description: 'no workspaces here', dependencies: { react: '^19' } }),
  'src/main.ts': 'console.log(1)',
};

const excludedWorkspaceFileContents = {
  'package.json': JSON.stringify({ name: '@repo/root', packageManager: 'yarn@4.0.0', workspaces: ['packages/*', '!packages/excluded'] }),
  'packages/a/package.json': JSON.stringify({ name: '@repo/a' }),
  'packages/excluded/package.json': JSON.stringify({ name: '@repo/excluded' }),
  'src/main.ts': 'console.log(1)',
};

let activeFileContents: Record<string, string> = workspaceFileContents;
const buildGraphMock = mock((input: GraphBuildInput) => ({
  nodes: input.workspacePackages?.map((pkg) => ({
    id: `package:${pkg.rootPath}`,
    type: 'package' as const,
    position: { x: 0, y: 0 },
    data: { label: pkg.name ?? pkg.rootPath },
  })) ?? [],
  edges: input.scopedDependencies
    ?.filter((dep) => dep.name === '@repo/b')
    .map((dep) => ({
      id: `e:${dep.manifestPath}->${dep.name}`,
      source: 'package:packages/a',
      target: 'package:packages/b',
      type: 'depends_on' as const,
    })) ?? [],
  layout: 'dagre' as const,
}));

mock.module('../github/fetch-tree', () => ({
  fetchRepoInfo: async () => mockRepoInfo,
  fetchFlatTree: async () => ({
    items: [
      { path: 'package.json', type: 'file' },
      { path: 'packages/a/package.json', type: 'file' },
      { path: 'packages/b/package.json', type: 'file' },
      { path: 'src/main.ts', type: 'file' },
    ],
    truncated: false,
  }),
  fetchContributors: async () => [],
  fetchTimeline: async () => [],
  fetchTotalCommits: async () => 42,
  buildTreeFromPaths: (items: readonly { readonly path: string; readonly type: string }[]) => items,
  findManifestPaths: () => ['package.json', 'packages/a/package.json', 'packages/b/package.json'],
  fetchFileContents: async () => activeFileContents,
}));

mock.module('../github/parse-url', () => ({
  parseGitHubUrl: (input: string) => {
    if (input.includes('invalid')) return null;
    return { owner: 'test-owner', repo: 'test-repo' };
  },
}));

mock.module('../parser/file-classifier', () => ({
  annotateTree: (tree: readonly { readonly path: string; readonly type: string }[]) => tree,
  findImportantFiles: () => ['src/main.ts'],
}));

mock.module('../graph/graph-builder', () => ({
  buildGraph: buildGraphMock,
}));

describe('services/analyze-repo', () => {
  beforeEach(() => {
    clearAllCaches();
    activeFileContents = workspaceFileContents;
    buildGraphMock.mockClear();
  });

  it('throws error for invalid repo url', () => {
    expect(analyzeRepository('invalid-url')).rejects.toThrow('Invalid GitHub repository URL');
  });

  it('runs the full repository analysis pipeline and caches the result', async () => {
    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo');
    expect(analysis.meta.fullName).toBe('test-owner/test-repo');
    expect(analysis.importantFiles).toEqual(['src/main.ts']);
    expect(analysis.treeTruncated).toBe(false);
    expect(analysis.workspacePackages?.map((pkg) => pkg.rootPath)).toEqual(['', 'packages/a', 'packages/b']);
    expect(analysis.dependencies).toEqual([
      { name: '@repo/b', version: 'workspace:*', type: 'prod', ecosystem: 'npm' },
    ]);
    expect(analysis.graph.nodes.some((node) => node.id === 'package:packages/a')).toBe(true);
    expect(analysis.graph.edges.some((edge) => edge.source === 'package:packages/a' && edge.target === 'package:packages/b')).toBe(true);
    expect(buildGraphMock).toHaveBeenCalledWith(expect.objectContaining({
      workspacePackages: expect.arrayContaining([
        expect.objectContaining({ rootPath: 'packages/a', name: '@repo/a' }),
        expect.objectContaining({ rootPath: 'packages/b', name: '@repo/b' }),
      ]),
      scopedDependencies: expect.arrayContaining([
        expect.objectContaining({ manifestPath: 'packages/a/package.json', name: '@repo/b' }),
      ]),
    }));

    // Call again, should return cached
    const cachedAnalysis = await analyzeRepository('https://github.com/test-owner/test-repo');
    expect(cachedAnalysis).toBe(analysis);
  });

  it('keeps no-workspace repository analysis backward-compatible', async () => {
    activeFileContents = plainFileContents;

    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo');

    expect(analysis.dependencies).toEqual([
      { name: 'react', version: '^19', type: 'prod', ecosystem: 'npm' },
    ]);
    expect(analysis.workspacePackages).toEqual([]);
    expect(analysis.graph.edges.some((edge) => edge.source.startsWith('package:') && edge.target.startsWith('package:'))).toBe(false);
  });

  it('honors negated workspace globs and explicit yarn packageManager', async () => {
    activeFileContents = excludedWorkspaceFileContents;

    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo');

    expect(analysis.workspacePackages).toEqual([
      expect.objectContaining({ rootPath: '', manager: 'yarn' }),
      expect.objectContaining({ rootPath: 'packages/a', manager: 'yarn' }),
    ]);
  });
});
