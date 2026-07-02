import { afterEach, describe, expect, it, mock, beforeEach } from 'bun:test';
import { fetchTrending } from './trending';

const mockSearchRepos = mock(async () => ({
  data: {
    items: [
      {
        owner: { login: 'test-owner' },
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        description: 'Test Description',
        stargazers_count: 55000,
        language: 'TypeScript',
        html_url: 'https://github.com/test-owner/test-repo',
      },
    ],
  },
}));

describe('services/trending', () => {
  beforeEach(() => {
    mock.module('../github/client', () => ({
      getOctokit: () => ({
        search: {
          repos: mockSearchRepos,
        },
      }),
      handleOctokitError: (err: any) => {
        throw err;
      },
    }));
    mockSearchRepos.mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  it('fetches and maps trending repositories successfully', async () => {
    const repos = await fetchTrending();
    expect(repos).toHaveLength(1);
    expect(repos[0]).toEqual({
      owner: 'test-owner',
      repo: 'test-repo',
      fullName: 'test-owner/test-repo',
      description: 'Test Description',
      stars: 55000,
      language: 'TypeScript',
      url: 'https://github.com/test-owner/test-repo',
    });
    expect(mockSearchRepos).toHaveBeenCalled();
  });

  it('returns fallback data when fetch fails and handleOctokitError throws', async () => {
    mockSearchRepos.mockImplementationOnce(async () => {
      throw new Error('GitHub API Error');
    });

    const repos = await fetchTrending();
    expect(repos.length).toBeGreaterThan(0);
    expect(repos[0].owner).toBe('facebook');
  });

  it('returns fallback data when fetch fails and handleOctokitError is a no-op', async () => {
    mockSearchRepos.mockImplementationOnce(async () => {
      throw new Error('GitHub API Error');
    });

    // Re-mock handleOctokitError to be a no-op
    mock.module('../github/client', () => ({
      getOctokit: () => ({
        search: {
          repos: mockSearchRepos,
        },
      }),
      handleOctokitError: () => {},
    }));

    const repos = await fetchTrending();
    expect(repos.length).toBeGreaterThan(0);
    expect(repos[0].owner).toBe('facebook');

    // Restore original mock
    mock.module('../github/client', () => ({
      getOctokit: () => ({
        search: {
          repos: mockSearchRepos,
        },
      }),
      handleOctokitError: (err: any) => {
        throw err;
      },
    }));
  });
});
