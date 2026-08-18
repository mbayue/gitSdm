import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { fetchRepoChurn } from './churn-service';
import { clearAllCaches } from '../cache/lru';

describe('churn-service', () => {
  beforeEach(() => {
    clearAllCaches();
  });

  afterEach(() => {
    mock.restore();
  });

  it('handles mock repos via fetchMockChurn', async () => {
    const res = await fetchRepoChurn('mock', 'mock-repo', ['src/index.ts', 'src/app.ts']);
    expect(res['src/index.ts']).toBeDefined();
    expect(res['src/index.ts'].commitCount).toBeGreaterThanOrEqual(1);
    expect(res['src/app.ts'].churnScore).toBeGreaterThanOrEqual(0);
  });

  it('fetches churn data from octokit, caches result, parses link header and author info', async () => {
    const listCommitsMock = mock(async ({ path }: { path: string }) => {
      if (path === 'err.ts') {
        throw new Error('Github API rate limited');
      }
      if (path === 'empty.ts') {
        return { data: [], headers: {} };
      }
      return {
        data: [
          {
            commit: {
              author: { name: 'Alice', date: '2025-01-01T00:00:00Z' },
            },
            author: { login: 'Alice' },
          },
          {
            commit: {
              author: { name: 'Bob', date: '2024-12-01T00:00:00Z' },
            },
            author: { login: 'Bob' },
          },
        ],
        headers: {
          link: '<https://api.github.com/repositories/1/commits?page=3>; rel="last"',
        },
      };
    });

    const octokitMock = {
      repos: {
        listCommits: listCommitsMock,
      },
    };

    const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});

    const res = await fetchRepoChurn(
      'real-owner',
      'real-repo',
      ['file1.ts', 'empty.ts', 'err.ts'],
      'main',
      { octokit: octokitMock } as any,
    );

    expect(res['file1.ts']).toBeDefined();
    expect(res['file1.ts'].commitCount).toBe(300); // 3 * 100 from Link header
    expect(res['file1.ts'].authorCount).toBe(2);
    expect(res['file1.ts'].churnScore).toBe(1); // max commits

    expect(res['empty.ts']).toBeUndefined();
    expect(res['err.ts']).toBeUndefined();

    // Verify cache hit
    const cachedRes = await fetchRepoChurn(
      'real-owner',
      'real-repo',
      ['file1.ts'],
      'main',
      { octokit: octokitMock } as any,
    );
    expect(cachedRes).toEqual(res);

    consoleErrorSpy.mockRestore();

    // Test 403/429 silent error handling
    const rateLimitMock = {
      repos: {
        listCommits: mock(async () => {
          const error: any = new Error('Rate limit');
          error.status = 403;
          throw error;
        }),
      },
    };
    const rateLimitRes = await fetchRepoChurn(
      'rate-limit-owner',
      'rate-limit-repo',
      ['blocked.ts'],
      'main',
      { octokit: rateLimitMock } as any,
    );
    expect(rateLimitRes).toEqual({});

  });
});

