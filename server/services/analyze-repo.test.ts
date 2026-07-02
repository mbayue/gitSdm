import { afterEach, describe, expect, it, mock, beforeEach } from 'bun:test';
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
  'src/main.ts': 'export const value = 1',
};

const plainFileContents = {
  'package.json': JSON.stringify({ name: 'plain-app', description: 'no workspaces here', dependencies: { react: '^19' } }),
  'src/main.ts': 'export const value = 1',
};

const excludedWorkspaceFileContents = {
  'package.json': JSON.stringify({ name: '@repo/root', packageManager: 'yarn@4.0.0', workspaces: ['packages/*', '!packages/excluded'] }),
  'packages/a/package.json': JSON.stringify({ name: '@repo/a' }),
  'packages/excluded/package.json': JSON.stringify({ name: '@repo/excluded' }),
  'src/main.ts': 'export const value = 1',
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

const originalFetch = globalThis.fetch;
const fetchMock = mock(async (input: RequestInfo | URL) => {
  const packageName = decodeURIComponent(new URL(String(input)).pathname.slice(1));

  if (packageName === '@repo/b') {
    return new Response(JSON.stringify({
      'dist-tags': { latest: 'workspace:*' },
      license: 'MIT',
    }), { status: 200 });
  }

  if (packageName === 'react') {
    return new Response(JSON.stringify({
      'dist-tags': { latest: '19.1.0' },
      license: 'MIT',
    }), { status: 200 });
  }

  throw new TypeError(`unexpected fetch for ${packageName}`);
});

describe('services/analyze-repo', () => {
  beforeEach(() => {
    mock.module('../github/fetch-tree', () => ({
      fetchRepoInfo: async () => mockRepoInfo,
      fetchFlatTree: async () => ({
        items: Object.keys(activeFileContents).map((path) => ({ path, type: 'file' })),
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

    clearAllCaches();
    activeFileContents = workspaceFileContents;
    buildGraphMock.mockClear();
    fetchMock.mockClear();
    globalThis.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restore();
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
    expect(analysis.dependencyHealth).toEqual(expect.objectContaining({
      summary: expect.objectContaining({ total: 1, current: 1, unsupported: 0 }),
    }));
    expect(buildGraphMock).toHaveBeenCalledWith(expect.objectContaining({
      workspacePackages: expect.arrayContaining([
        expect.objectContaining({ rootPath: 'packages/a', name: '@repo/a' }),
        expect.objectContaining({ rootPath: 'packages/b', name: '@repo/b' }),
      ]),
      scopedDependencies: expect.arrayContaining([
        expect.objectContaining({ manifestPath: 'packages/a/package.json', name: '@repo/b' }),
      ]),
    }));
    expect(fetchMock).toHaveBeenCalledTimes(0);

    // Call again, should return cached
    const cachedAnalysis = await analyzeRepository('https://github.com/test-owner/test-repo');
    expect(cachedAnalysis).toBe(analysis);
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('keeps no-workspace repository analysis backward-compatible', async () => {
    activeFileContents = plainFileContents;

    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo');

    expect(analysis.dependencies).toEqual([
      { name: 'react', version: '^19', type: 'prod', ecosystem: 'npm' },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/react');
    expect(analysis.workspacePackages).toEqual([]);
    expect(analysis.graph.edges.some((edge) => edge.source.startsWith('package:') && edge.target.startsWith('package:'))).toBe(false);
  });

  it('skips registry metadata for non-npm dependencies', async () => {
    activeFileContents = {
      'go.mod': 'module example.com/app\n\nrequire github.com/gin-gonic/gin v1.9.1',
      'src/main.go': 'package main',
    };

    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo');

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(analysis.dependencyHealth).toEqual(expect.objectContaining({
      summary: expect.objectContaining({ total: 1, unsupported: 1, current: 0, outdated: 0, unknown: 0, errors: 0 }),
      items: expect.arrayContaining([
        expect.objectContaining({ ecosystem: 'go', name: 'github.com/gin-gonic/gin', state: 'unsupported' }),
      ]),
    }));
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
