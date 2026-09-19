import { beforeEach, describe, expect, it } from 'bun:test';
import { getRepoFileContent } from './get-file';
import { fetchMockFileContents, fetchMockRepoInfo } from '../github/mock-data';
import type { RequestContext } from '../utils/context';

// Stub behavior for the non-mock (real API) path, served through
// RequestContext.octokit so no mock.module() on shared internal modules is
// needed (see AGENTS.md testing gotchas).
let getContentImpl: (path: string) => Promise<{ type: string; content?: string }>;
let getContentCalls = 0;
const stubOctokit = {
  repos: {
    get: async () => ({
      data: {
        full_name: 'real-owner/repo',
        html_url: 'https://github.com/real-owner/repo',
        description: null,
        stargazers_count: 0,
        forks_count: 0,
        language: null,
        default_branch: 'main',
        topics: [],
        license: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    }),
    getCommit: async () => ({ data: { sha: 'test-sha' } }),
    getContent: async ({ path }: { path: string }) => {
      getContentCalls++;
      return { data: await getContentImpl(path) };
    },
  },
};
const mockCtx = { octokit: stubOctokit } as unknown as RequestContext;

const helloContent = Buffer.from('hello world').toString('base64');

describe('services/get-file', () => {
  beforeEach(() => {
    getContentCalls = 0;
    getContentImpl = async () => ({ type: 'file', content: helloContent });
  });

  it('fetches mock file content when owner is mock-owner', async () => {
    const res = await getRepoFileContent('mock-owner', 'repo', 'src/main.ts');
    const expected = await fetchMockFileContents('mock-owner', 'repo', ['src/main.ts']);
    const info = await fetchMockRepoInfo('mock-owner', 'repo');
    expect(res).toEqual({
      path: 'src/main.ts',
      content: expected['src/main.ts'],
      sha: info.sha,
    });
    expect(getContentCalls).toBe(0);
  });

  it('fetches real file content from github when owner is not mock', async () => {
    const res = await getRepoFileContent('real-owner', 'repo', 'src/main.ts', undefined, mockCtx);
    expect(res).toEqual({
      path: 'src/main.ts',
      content: 'hello world',
      sha: 'test-sha',
    });
    expect(getContentCalls).toBe(1);
  });

  it('throws error when file is not found in github repo (404 status)', async () => {
    getContentImpl = async () => {
      throw { status: 404 };
    };

    await expect(getRepoFileContent('real-owner', 'repo', 'nonexistent.ts', undefined, mockCtx)).rejects.toThrow(
      'File not found: nonexistent.ts',
    );
  });

  it('throws error when file is not a regular file (e.g. is a directory)', async () => {
    getContentImpl = async () => ({ type: 'dir' });

    await expect(getRepoFileContent('real-owner', 'repo', 'src/folder', undefined, mockCtx)).rejects.toThrow(
      'File is not a regular file or too large to display.',
    );
  });

  it('delegates other API errors to handleOctokitError', async () => {
    getContentImpl = async () => {
      throw new Error('500 internal server error');
    };

    await expect(getRepoFileContent('real-owner', 'repo', 'src/main.ts', undefined, mockCtx)).rejects.toThrow(
      '500 internal server error',
    );
  });
});
