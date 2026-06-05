import { Octokit } from '@octokit/rest';

let octokitInstance: Octokit | null = null;

export function resetOctokit(): void {
  octokitInstance = null;
}

export function getOctokit(token?: string): Octokit {
  if (token) {
    return new Octokit({
      auth: token,
      userAgent: 'gitSdm/1.0',
    });
  }
  if (!octokitInstance) {
    const envToken = process.env.GITHUB_TOKEN?.trim();
    octokitInstance = new Octokit({
      auth: envToken || undefined,
      userAgent: 'gitSdm/1.0',
    });
  }
  return octokitInstance;
}

export function isGitHubAuthenticated(): boolean {
  return Boolean(process.env.GITHUB_TOKEN?.trim());
}

export class GitHubRateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'GitHubRateLimitError';
  }
}

export function handleOctokitError(error: unknown): never {
  if (error && typeof error === 'object' && 'status' in error) {
    const err = error as {
      status: number;
      message?: string;
      response?: { headers?: Record<string, string> };
    };
    const headers = err.response?.headers ?? {};
    const limit = headers['x-ratelimit-limit'];

    if (err.status === 401) {
      throw new Error(
        'Invalid or expired GITHUB_TOKEN. Create a new token at github.com/settings/tokens with public repo read access.',
      );
    }

    if (err.status === 403 || err.status === 429) {
      const retryAfter = headers['retry-after'];
      const resetAt = headers['x-ratelimit-reset'];
      const resetHint = resetAt
        ? ` Try again after ${new Date(parseInt(resetAt, 10) * 1000).toLocaleTimeString()}.`
        : '';

      if (limit === '60' || !isGitHubAuthenticated()) {
        throw new GitHubRateLimitError(
          `GitHub API rate limit exceeded (unauthenticated — 60/hr). Set GITHUB_TOKEN in .env and restart \`npm run dev\`.${resetHint}`,
          retryAfter ? parseInt(retryAfter, 10) : 60,
        );
      }

      throw new GitHubRateLimitError(
        `GitHub API rate limit exceeded (authenticated quota used).${resetHint}`,
        retryAfter ? parseInt(retryAfter, 10) : 60,
      );
    }
    if (err.status === 404) {
      throw new Error('Repository not found or is private.');
    }
  }
  throw error instanceof Error ? error : new Error('GitHub API error');
}
