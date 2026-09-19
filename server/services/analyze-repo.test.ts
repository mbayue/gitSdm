import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { analyzeRepository } from './analyze-repo';
import { enrichRepository } from './repo-enrichment';
import { clearAllCaches } from '../cache/lru';
import type { RequestContext } from '../utils/context';

const mockRepoMeta = {
  full_name: 'test-owner/test-repo',
  html_url: 'https://github.com/test-owner/test-repo',
  description: 'test-desc',
  stargazers_count: 10,
  forks_count: 5,
  language: 'TypeScript',
  default_branch: 'main',
  topics: [],
  license: { spdx_id: 'MIT' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

const workspaceFileContents = {
  'package.json': JSON.stringify({
    name: '@repo/root',
    workspaces: ['packages/*'],
  }),
  'packages/a/package.json': JSON.stringify({
    name: '@repo/a',
    dependencies: { '@repo/b': 'workspace:*' },
  }),
  'packages/b/package.json': JSON.stringify({ name: '@repo/b' }),
  'src/main.ts': 'export const value = 1',
};

const plainFileContents = {
  'package.json': JSON.stringify({
    name: 'plain-app',
    description: 'no workspaces here',
    dependencies: { react: '^19' },
  }),
  'src/main.ts': 'export const value = 1',
};

const excludedWorkspaceFileContents = {
  'package.json': JSON.stringify({
    name: '@repo/root',
    packageManager: 'yarn@4.0.0',
    workspaces: ['packages/*', '!packages/excluded'],
  }),
  'packages/a/package.json': JSON.stringify({ name: '@repo/a' }),
  'packages/excluded/package.json': JSON.stringify({ name: '@repo/excluded' }),
  'src/main.ts': 'export const value = 1',
};

// Mutable stub behavior, reset in beforeEach. The stub octokit below serves
// every GitHub endpoint the analysis pipeline touches, so no mock.module()
// on shared internal modules is needed (see AGENTS.md testing gotchas).
const stubState: { files: Record<string, string>; denyAccess: boolean; calls: Record<string, number> } = {
  files: workspaceFileContents,
  denyAccess: false,
  calls: {},
};

function record(name: string): void {
  stubState.calls[name] = (stubState.calls[name] ?? 0) + 1;
}

const stubOctokit = {
  repos: {
    get: async () => {
      record('repos.get');
      return { data: mockRepoMeta };
    },
    getCommit: async () => {
      record('repos.getCommit');
      if (stubState.denyAccess) throw new Error('Repository access denied');
      return { data: { sha: 'test-sha' } };
    },
    listContributors: async () => {
      record('repos.listContributors');
      return { data: [] };
    },
    listCommits: async () => {
      record('repos.listCommits');
      return { data: [], headers: {} };
    },
    getContent: async ({ path }: { path: string }) => {
      record('repos.getContent');
      const content = stubState.files[path];
      if (content === undefined) throw { status: 404 };
      return { data: { type: 'file', content: Buffer.from(content).toString('base64') } };
    },
  },
  git: {
    getTree: async () => {
      record('git.getTree');
      return {
        data: {
          tree: Object.keys(stubState.files).map((path) => ({ path, type: 'blob', sha: `sha-${path}` })),
        },
      };
    },
  },
};
const mockCtx = { octokit: stubOctokit } as unknown as RequestContext;

const originalFetch = globalThis.fetch;
const fetchMock = mock(async (input: RequestInfo | URL) => {
  const packageName = decodeURIComponent(new URL(String(input)).pathname.slice(1));

  if (packageName === '@repo/b') {
    return new Response(
      JSON.stringify({
        'dist-tags': { latest: 'workspace:*' },
        license: 'MIT',
      }),
      { status: 200 },
    );
  }

  if (packageName === 'react') {
    return new Response(
      JSON.stringify({
        'dist-tags': { latest: '19.1.0' },
        license: 'MIT',
      }),
      { status: 200 },
    );
  }

  throw new TypeError(`unexpected fetch for ${packageName}`);
});

describe('services/analyze-repo', () => {
  beforeEach(() => {
    stubState.files = workspaceFileContents;
    stubState.denyAccess = false;
    stubState.calls = {};
    clearAllCaches();
    fetchMock.mockClear();
    globalThis.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws error for invalid repo url', () => {
    expect(analyzeRepository('invalid-url')).rejects.toThrow('Invalid GitHub repository URL');
  });

  it('isolates analysis and SHA aliases by credentials and rechecks access on cache hits', async () => {
    const input = { owner: 'test-owner', repo: 'test-repo', branch: 'main' };
    const first = { ...mockCtx, gitHubToken: 'first-credential' };
    const second = { ...mockCtx, gitHubToken: 'second-credential' };
    const original = await analyzeRepository(input, first);
    expect(await analyzeRepository({ ...input, branch: 'test-sha' }, first)).toBe(original);
    const getCommitCalls = stubState.calls['repos.getCommit'] ?? 0;
    const recomputed = await analyzeRepository({ ...input, branch: 'test-sha' }, second);
    expect(recomputed).not.toBe(original);
    expect(stubState.calls['repos.getCommit']).toBeGreaterThan(getCommitCalls);
    stubState.denyAccess = true;
    await expect(analyzeRepository(input, first)).rejects.toThrow('Repository access denied');
  });

  it('runs the full repository analysis pipeline and caches the result', async () => {
    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo', mockCtx);
    expect(analysis.meta.fullName).toBe('test-owner/test-repo');
    expect(analysis.importantFiles).toEqual([
      'package.json',
      'src/main.ts',
      'packages/a/package.json',
      'packages/b/package.json',
    ]);
    expect(analysis.treeTruncated).toBe(false);
    expect(analysis.workspacePackages?.map((pkg) => pkg.rootPath)).toEqual(['', 'packages/a', 'packages/b']);
    expect(analysis.dependencies).toEqual([
      {
        name: '@repo/b',
        version: 'workspace:*',
        type: 'prod',
        ecosystem: 'npm',
      },
    ]);
    expect(analysis.scopedDependencies).toEqual([
      expect.objectContaining({
        manifestPath: 'packages/a/package.json',
        name: '@repo/b',
      }),
    ]);
    expect(analysis.graph.nodes.some((node) => node.id === 'package:packages/a')).toBe(true);
    expect(analysis.graph.nodes.some((node) => node.id === 'package:packages/b')).toBe(true);
    expect(
      analysis.graph.edges.some(
        (edge) => edge.source === 'package:packages/a' && edge.target === 'file:packages/a/package.json',
      ),
    ).toBe(true);
    expect(analysis.dependencyHealth).toBeUndefined();
    expect(await enrichRepository({ owner: 'test-owner', repo: 'test-repo' }, 'health', mockCtx)).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          total: 1,
          current: 1,
          unsupported: 0,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(0);

    // Call again with the same credentials, should return cached.
    // A context is required: the info fetch precedes the cache lookup.
    const cachedAnalysis = await analyzeRepository('https://github.com/test-owner/test-repo', mockCtx);
    expect(cachedAnalysis).toBe(analysis);
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('keeps no-workspace repository analysis backward-compatible', async () => {
    stubState.files = plainFileContents;

    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo', mockCtx);

    expect(analysis.dependencies).toEqual([{ name: 'react', version: '^19', type: 'prod', ecosystem: 'npm' }]);
    expect(fetchMock).toHaveBeenCalledTimes(0);
    await enrichRepository({ owner: 'test-owner', repo: 'test-repo' }, 'health', mockCtx);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/react');
    expect(analysis.workspacePackages).toEqual([]);
    expect(
      analysis.graph.edges.some((edge) => edge.source.startsWith('package:') && edge.target.startsWith('package:')),
    ).toBe(false);
  });

  it('skips registry metadata for non-npm dependencies', async () => {
    stubState.files = {
      'go.mod': 'module example.com/app\n\nrequire github.com/gin-gonic/gin v1.9.1',
      'src/main.go': 'package main',
    };

    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo', mockCtx);

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(analysis.dependencyHealth).toBeUndefined();
    expect(await enrichRepository({ owner: 'test-owner', repo: 'test-repo' }, 'health', mockCtx)).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          total: 1,
          unsupported: 1,
          current: 0,
          outdated: 0,
          unknown: 0,
          errors: 0,
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            ecosystem: 'go',
            name: 'github.com/gin-gonic/gin',
            state: 'unsupported',
          }),
        ]),
      }),
    );
  });

  it('honors negated workspace globs and explicit yarn packageManager', async () => {
    stubState.files = excludedWorkspaceFileContents;

    const analysis = await analyzeRepository('https://github.com/test-owner/test-repo', mockCtx);

    expect(analysis.workspacePackages).toEqual([
      expect.objectContaining({ rootPath: '', manager: 'yarn' }),
      expect.objectContaining({ rootPath: 'packages/a', manager: 'yarn' }),
    ]);
  });

  it('serves health from a dependency-focused path without contributor, timeline, or commit endpoints', async () => {
    const report = await enrichRepository({ owner: 'test-owner', repo: 'test-repo' }, 'health', mockCtx);
    expect(report.summary).toEqual(expect.objectContaining({ total: 1, current: 1 }));
    expect(stubState.calls['git.getTree'] ?? 0).toBeGreaterThan(0);
    expect(stubState.calls['repos.listContributors'] ?? 0).toBe(0);
    expect(stubState.calls['repos.listCommits'] ?? 0).toBe(0);
  });

  it('fetches registry metadata for every npm dependency instead of truncating at 100', async () => {
    const many = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`pkg-${i}`, '^1.0.0']));
    stubState.files = {
      'package.json': JSON.stringify({ name: 'big-app', dependencies: many }),
    };
    const seen = new Set<string>();
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      seen.add(decodeURIComponent(new URL(String(input)).pathname.slice(1)));
      return new Response(JSON.stringify({ 'dist-tags': { latest: '1.0.0' }, license: 'MIT' }), {
        status: 200,
      });
    }) as typeof fetch;
    const report = await enrichRepository({ owner: 'test-owner', repo: 'test-repo' }, 'health', mockCtx);
    expect(report.summary.total).toBe(120);
    expect(seen.size).toBe(120);
  });
});
