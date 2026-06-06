import type { Octokit } from '@octokit/rest';

export interface RequestContext {
  octokit: Octokit;
  gitHubToken?: string;
  geminiApiKey?: string;
}
