import { describe, expect, it } from 'bun:test';
import {
  isMockRepo,
  fetchMockRepoInfo,
  fetchMockFlatTree,
  fetchMockFileContents,
  fetchMockContributors,
  fetchMockTimeline,
  fetchMockRepoBranches,
} from './mock-data';

describe('github/mock-data', () => {
  it('isMockRepo: checks mock owner', () => {
    expect(isMockRepo('mock')).toBe(true);
    expect(isMockRepo('MOCK')).toBe(true);
    expect(isMockRepo('Mock')).toBe(true);
    expect(isMockRepo('real')).toBe(false);
    expect(isMockRepo('')).toBe(false);
  });

  it('fetchMockRepoInfo: returns mock info for gitsdm and others', async () => {
    const infoGitsdm = await fetchMockRepoInfo('mock', 'gitsdm', 'main');
    expect(infoGitsdm.repo).toBe('gitsdm');
    expect(infoGitsdm.owner).toBe('mock');
    expect(infoGitsdm.stars).toBe(128);
    expect(infoGitsdm.defaultBranch).toBe('main');
    expect(infoGitsdm.license).toBe('MIT');
    expect(infoGitsdm.sha).toContain('mock');

    const infoOther = await fetchMockRepoInfo('mock', 'other');
    expect(infoOther.repo).toBe('other');
    expect(infoOther.stars).toBe(45);
    expect(infoOther.defaultBranch).toBe('main');

    // Branch name override
    const infoBranch = await fetchMockRepoInfo('mock', 'gitsdm', 'develop');
    expect(infoBranch.defaultBranch).toBe('develop');
  });

  it('fetchMockFlatTree: returns files for gitsdm and others', async () => {
    const treeGitsdm = await fetchMockFlatTree('mock', 'gitsdm');
    expect(treeGitsdm.items.length).toBeGreaterThan(0);
    expect(treeGitsdm.truncated).toBe(false);
    expect(treeGitsdm.items[0].type).toBe('blob');

    const treeOther = await fetchMockFlatTree('mock', 'other');
    expect(treeOther.items.length).toBeGreaterThan(0);
  });

  it('fetchMockFileContents: returns mock files contents and placeholders', async () => {
    const contentGitsdm = await fetchMockFileContents('mock', 'gitsdm', ['package.json', 'nonexistent.ts']);
    expect(contentGitsdm['package.json']).toContain('gitsdm');
    expect(contentGitsdm['nonexistent.ts']).toContain('mock repository file');

    const contentOther = await fetchMockFileContents('mock', 'other', ['package.json', 'nonexistent.ts']);
    expect(contentOther['package.json']).toContain('mock-todo-app');
    expect(contentOther['nonexistent.ts']).toContain('mock repository file');
  });

  it('fetchMockContributors: returns contributors list', async () => {
    const list = await fetchMockContributors();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].login).toBe('mbayue');
    expect(list[0].contributions).toBe(84);
  });

  it('fetchMockTimeline: returns timeline weeks', async () => {
    const timeline = await fetchMockTimeline();
    expect(timeline.length).toBe(8);
    expect(timeline[0].commits.length).toBeGreaterThan(0);
    expect(timeline[0].week).toBeTruthy();
  });

  it('fetchMockRepoBranches: returns branches list', async () => {
    const branches = await fetchMockRepoBranches();
    expect(branches).toEqual([
      { name: 'main', protected: true },
      { name: 'develop', protected: false },
      { name: 'feature/mock-mode', protected: false },
    ]);
  });
});
