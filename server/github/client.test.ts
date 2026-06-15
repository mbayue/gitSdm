import { describe, expect, it, beforeEach } from 'bun:test';
import {
  resetOctokit,
  getOctokit,
  isGitHubAuthenticated,
  handleOctokitError,
  GitHubRateLimitError,
} from './client';

describe('github/client', () => {
  const originalToken = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    resetOctokit();
    if (originalToken) {
      process.env.GITHUB_TOKEN = originalToken;
    } else {
      delete process.env.GITHUB_TOKEN;
    }
  });

  it('creates octokit instance with token, without token, and caches it', () => {
    const octokit1 = getOctokit('test-token');
    expect(octokit1).toBeDefined();

    // Call without token uses GITHUB_TOKEN or undefined and caches it
    process.env.GITHUB_TOKEN = 'env-token';
    const octokit2 = getOctokit();
    const octokit3 = getOctokit();
    expect(octokit2).toBe(octokit3);

    resetOctokit();
    const octokit4 = getOctokit();
    expect(octokit4).not.toBe(octokit2);
  });

  it('checks authentication status correctly', () => {
    process.env.GITHUB_TOKEN = '  ';
    expect(isGitHubAuthenticated()).toBe(false);

    process.env.GITHUB_TOKEN = 'some-token';
    expect(isGitHubAuthenticated()).toBe(true);
  });

  it('throws rate limit error for constructor', () => {
    const err = new GitHubRateLimitError('limit', 120);
    expect(err.retryAfter).toBe(120);
    expect(err.name).toBe('GitHubRateLimitError');
  });

  it('handles various octokit errors', () => {
    // 401
    expect(() =>
      handleOctokitError({
        status: 401,
      })
    ).toThrow('Invalid or expired GITHUB_TOKEN');

    // 404
    expect(() =>
      handleOctokitError({
        status: 404,
      })
    ).toThrow('Repository not found or is private');

    // 403 / 429 unauthenticated rate limit
    delete process.env.GITHUB_TOKEN;
    expect(() =>
      handleOctokitError({
        status: 403,
        response: {
          headers: {
            'x-ratelimit-limit': '60',
            'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 10),
            'retry-after': '30',
          },
        },
      })
    ).toThrow('GitHub API rate limit exceeded (unauthenticated — 60/hr)');

    // 403 / 429 authenticated rate limit
    process.env.GITHUB_TOKEN = 'some-token';
    expect(() =>
      handleOctokitError({
        status: 403,
        response: {
          headers: {
            'x-ratelimit-limit': '5000',
            'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 10),
          },
        },
      })
    ).toThrow('GitHub API rate limit exceeded (authenticated quota used)');

    // Other status errors
    expect(() =>
      handleOctokitError({
        status: 500,
        message: 'Internal server error',
      })
    ).toThrow('GitHub API error');

    // Non-octokit standard Error
    const standardError = new Error('local failure');
    expect(() => handleOctokitError(standardError)).toThrow('local failure');

    // String error
    expect(() => handleOctokitError('string error')).toThrow('GitHub API error');
  });
});
