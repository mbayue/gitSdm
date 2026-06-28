import { describe, expect, it, mock, beforeEach } from 'bun:test';
import {
  fetchRepoBranches,
  fetchRepoInfo,
  fetchFlatTree,
  buildTreeFromPaths,
  findManifestPaths,
  fetchFileContents,
  fetchContributors,
  fetchTimeline,
} from './fetch-tree';

const mockListBranches = mock(async () => ({ data: [{ name: 'main', protected: true }] }));
const mockGetRepo = mock(async () => ({
  data: {
    full_name: 'owner/repo',
    html_url: 'https://github.com/owner/repo',
    description: 'desc',
    stargazers_count: 10,
    forks_count: 5,
    language: 'TypeScript',
    default_branch: 'main',
    topics: ['topic'],
    license: { spdx_id: 'MIT' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
}));
const mockGetBranch = mock(async () => ({ data: { commit: { sha: 'sha123' } } }));
const mockGetTree = mock(async () => ({
  data: {
    tree: [
      { path: 'package.json', type: 'blob', sha: 'sha-p', size: 100 },
      { path: 'src/main.ts', type: 'blob', sha: 'sha-m', size: 200 },
      { path: 'ignored/file.ts', type: 'blob', sha: 'sha-i', size: 50 },
    ],
    truncated: false,
  },
}));
const mockGetContent = mock(async ({ path }: any) => ({
  data: {
    type: 'file',
    content: Buffer.from(`content of ${path}`).toString('base64'),
  },
}));
const mockListContributors = mock(async () => ({
  data: [{ login: 'user-a', avatar_url: 'url-a', contributions: 5 }],
}));
const mockListCommits = mock(async () => ({
  data: [
    {
      sha: 'commitsha',
      commit: {
        author: { date: '2026-06-15T00:00:00Z', name: 'Author Name' },
        message: 'commit message\nwith lines',
      },
      author: { login: 'user-a', avatar_url: 'url-a' },
    },
    {
      sha: 'commitsha2',
      commit: {
        author: { date: '2026-06-01T00:00:00Z', name: 'Author 2' },
        message: 'second week',
      },
      author: { login: 'user-b', avatar_url: 'url-b' },
    },
  ],
}));

mock.module('./client', () => ({
  getOctokit: () => ({
    repos: {
      listBranches: mockListBranches,
      get: mockGetRepo,
      getBranch: mockGetBranch,
      getContent: mockGetContent,
      listContributors: mockListContributors,
      listCommits: mockListCommits,
    },
    git: {
      getTree: mockGetTree,
    },
  }),
  handleOctokitError: (err: any) => {
    throw err;
  },
}));

mock.module('./mock-data', () => ({
  isMockRepo: (owner: string) => owner === 'mock-owner',
  fetchMockRepoBranches: async () => [{ name: 'mock-main', protected: true }],
  fetchMockRepoInfo: async () => ({ sha: 'mock-sha' } as any),
  fetchMockFlatTree: async () => ({ items: [], truncated: false, totalFiles: 0 }),
  fetchMockFileContents: async () => ({}),
  fetchMockContributors: async () => [],
  fetchMockTimeline: async () => [],
}));

describe('github/fetch-tree', () => {
  beforeEach(() => {
    mockListBranches.mockClear();
    mockGetRepo.mockClear();
    mockGetBranch.mockClear();
    mockGetTree.mockClear();
    mockGetContent.mockClear();
    mockListContributors.mockClear();
    mockListCommits.mockClear();
  });

  it('fetchRepoBranches: handles mock and real repo successfully, handles catch', async () => {
    const mockRes = await fetchRepoBranches('mock-owner', 'repo');
    expect(mockRes).toEqual([{ name: 'mock-main', protected: true }]);

    const realRes = await fetchRepoBranches('real-owner', 'repo');
    expect(realRes).toEqual([{ name: 'main', protected: true }]);

    mockListBranches.mockImplementationOnce(async () => {
      throw new Error('Github failure');
    });
    await expect(fetchRepoBranches('real-owner', 'repo')).rejects.toThrow('Github failure');
  });

  it('fetchRepoInfo: handles mock and real repo successfully', async () => {
    const mockRes = await fetchRepoInfo('mock-owner', 'repo');
    expect(mockRes.sha).toBe('mock-sha');

    const realRes = await fetchRepoInfo('real-owner', 'repo', 'main');
    expect(realRes.sha).toBe('sha123');
    expect(realRes.license).toBe('MIT');
  });

  it('fetchFlatTree: handles mock and real repo successfully', async () => {
    const mockRes = await fetchFlatTree('mock-owner', 'repo', 'sha');
    expect(mockRes.items).toEqual([]);

    const realRes = await fetchFlatTree('real-owner', 'repo', 'sha');
    expect(realRes.items).toHaveLength(3);
    expect(realRes.truncated).toBe(false);
  });

  it('buildTreeFromPaths and findManifestPaths work', () => {
    const items = [
      { path: 'package.json', type: 'blob' as const, sha: 'sha-p', size: 10 },
      { path: 'src/main.ts', type: 'blob' as const, sha: 'sha-m', size: 20 },
    ];
    const tree = buildTreeFromPaths(items);
    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe('src');
    expect(tree[1].name).toBe('package.json');

    const manifests = findManifestPaths(items);
    expect(manifests).toEqual(['package.json']);
  });

  it('fetchFileContents: handles mock and real repo successfully', async () => {
    const mockRes = await fetchFileContents('mock-owner', 'repo', ['a'], 'main');
    expect(mockRes).toEqual({});

    const realRes = await fetchFileContents('real-owner', 'repo', ['package.json'], 'sha');
    expect(realRes).toEqual({ 'package.json': 'content of package.json' });
  });

  it('fetchContributors: handles mock and real repo, handles catch', async () => {
    const mockRes = await fetchContributors('mock-owner', 'repo');
    expect(mockRes).toEqual([]);

    const realRes = await fetchContributors('real-owner', 'repo');
    expect(realRes).toEqual([{ login: 'user-a', avatarUrl: 'url-a', contributions: 5 }]);

    mockListContributors.mockImplementationOnce(async () => {
      throw new Error('API failure');
    });
    const errRes = await fetchContributors('real-owner', 'repo');
    expect(errRes).toEqual([]);
  });

  it('fetchTimeline: handles mock and real repo, handles catch', async () => {
    const mockRes = await fetchTimeline('mock-owner', 'repo');
    expect(mockRes).toEqual([]);

    const realRes = await fetchTimeline('real-owner', 'repo');
    expect(realRes.length).toBeGreaterThanOrEqual(1);

    mockListCommits.mockImplementationOnce(async () => {
      throw new Error('API failure');
    });
    const errRes = await fetchTimeline('real-owner', 'repo');
    expect(errRes).toEqual([]);
  });

  it('fetchRepoInfo: propagates error through catch path', async () => {
    mockGetRepo.mockImplementationOnce(async () => {
      throw new Error('API failure');
    });
    await expect(fetchRepoInfo('real-owner', 'repo', 'main')).rejects.toThrow('API failure');
  });

  it('fetchFlatTree: propagates error through catch path', async () => {
    mockGetTree.mockImplementationOnce(async () => {
      throw new Error('Tree failure');
    });
    await expect(fetchFlatTree('real-owner', 'repo', 'sha')).rejects.toThrow('Tree failure');
  });

  it('fetchFileContents: uses RequestContext octokit when provided', async () => {
    const ctxOctokit = {
      repos: {
        listBranches: mockListBranches,
        get: mockGetRepo,
        getBranch: mockGetBranch,
        getContent: mockGetContent,
        listContributors: mockListContributors,
        listCommits: mockListCommits,
      },
      git: { getTree: mockGetTree },
    };
    const ctx = { octokit: ctxOctokit };
    const res = await fetchFileContents('real-owner', 'repo', ['package.json'], 'sha', ctx as any);
    expect(res).toEqual({ 'package.json': 'content of package.json' });
  });
  it('fetchTimeline: handles missing author/date edge cases', async () => {
    mockListCommits.mockImplementationOnce(async () => ({
      data: [
        {
          sha: 'sha1',
          commit: { author: { date: null }, message: 'no date' },
        },
        {
          sha: 'sha2',
          commit: { author: { date: '2026-06-15T00:00:00Z' }, message: 'no author' },
          author: null,
        },
      ] as any,
    }));
    const res = await fetchTimeline('real-owner', 'repo');
    expect(res).toHaveLength(1);
    expect(res[0].commits[0].authorName).toBeUndefined();
  });

  it('fetchFlatTree: handles empty tree data', async () => {
    mockGetTree.mockImplementationOnce(async () => ({ data: { tree: null, truncated: true } } as any));
    const res = await fetchFlatTree('real-owner', 'repo', 'sha');
    expect(res.items).toEqual([]);
    expect(res.truncated).toBe(true);
  });

  it('buildTreeFromPaths: handles nested directories and sort order', () => {
    const items = [
      { path: 'b.txt', type: 'blob' as const, sha: 's1' },
      { path: 'a/c.txt', type: 'blob' as const, sha: 's2' },
      { path: 'a/d.txt', type: 'blob' as const, sha: 's3' },
    ];
    const tree = buildTreeFromPaths(items);
    // Dirs first (a), then files (b.txt)
    expect(tree[0].name).toBe('a');
    expect(tree[1].name).toBe('b.txt');
    expect(tree[0].children![0].name).toBe('c.txt');
    expect(tree[0].children![1].name).toBe('d.txt');
  });

  it('findManifestPaths: limits results and handles empty path segments', () => {
    const items = Array(25).fill(0).map((_, i) => ({ path: `pkg-${i}/package.json`, type: 'blob' as const, sha: 's' }));
    const res = findManifestPaths(items);
    expect(res).toHaveLength(20);

    const edgeItems = [{ path: 'package.json', type: 'blob' as const, sha: 's' }];
    expect(findManifestPaths(edgeItems)).toEqual(['package.json']);
  });
  it('resolveOctokit: handles string token', async () => {
    // Calling fetchRepoBranches with a string token to trigger resolveOctokit(string) branch
    const res = await fetchRepoBranches('real-owner', 'repo', 'fake-token');
    expect(res).toEqual([{ name: 'main', protected: true }]);
  });

  it('fetchRepoBranches: handles empty and multiple branches', async () => {
    mockListBranches.mockImplementationOnce(async () => ({ data: [] } as any));
    expect(await fetchRepoBranches('real-owner', 'repo')).toEqual([]);

    mockListBranches.mockImplementationOnce(async () => ({
      data: [{ name: 'a', protected: true }, { name: 'b', protected: false }]
    } as any));
    const res = await fetchRepoBranches('real-owner', 'repo');
    expect(res).toHaveLength(2);
  });

  it('fetchFileContents: handles empty path list', async () => {
    const res = await fetchFileContents('real-owner', 'repo', [], 'main');
    expect(res).toEqual({});
  });

  it('buildTreeFromPaths: handles empty input', () => {
    expect(buildTreeFromPaths([])).toEqual([]);
  });
});
