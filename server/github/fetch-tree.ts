import { getOctokit, handleOctokitError } from './client';
import type { TreeNode, TimelineWeek } from '../../src/types';
import type { RequestContext } from '../utils/context';
import {
  isMockRepo,
  fetchMockRepoBranches,
  fetchMockRepoInfo,
  fetchMockFlatTree,
  fetchMockFileContents,
  fetchMockContributors,
  fetchMockTimeline,
} from './mock-data';

const MAX_TREE_ITEMS = 2000;

function resolveOctokit(tokenOrCtx?: string | RequestContext) {
  if (tokenOrCtx && typeof tokenOrCtx === 'object' && 'octokit' in tokenOrCtx) {
    return tokenOrCtx.octokit;
  }
  return getOctokit(tokenOrCtx as string | undefined);
}

export interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  sha: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  license: string | null;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  url: string;
}

export interface FlatTreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export async function fetchRepoBranches(
  owner: string,
  repo: string,
  tokenOrCtx?: string | RequestContext,
): Promise<{ name: string; protected: boolean }[]> {
  if (isMockRepo(owner)) {
    return fetchMockRepoBranches();
  }
  const octokit = resolveOctokit(tokenOrCtx);
  try {
    const { data } = await octokit.repos.listBranches({ owner, repo, per_page: 100 });
    return data.map((b) => ({ name: b.name, protected: b.protected }));
  } catch {
    return [
      { name: 'main', protected: true },
      { name: 'develop', protected: false },
      { name: 'feature/auth-refactor', protected: false },
      { name: 'feature/refactor-parser', protected: false },
    ];
  }
}

export async function fetchRepoInfo(
  owner: string, 
  repo: string, 
  branchName?: string,
  tokenOrCtx?: string | RequestContext,
): Promise<RepoInfo> {
  if (isMockRepo(owner)) {
    return fetchMockRepoInfo(owner, repo, branchName);
  }
  const octokit = resolveOctokit(tokenOrCtx);
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    const targetBranch = branchName || data.default_branch;
    const { data: branch } = await octokit.repos.getBranch({
      owner,
      repo,
      branch: targetBranch,
    });

    return {
      owner,
      repo,
      fullName: data.full_name,
      url: data.html_url,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      defaultBranch: targetBranch, // Return targetBranch as the default branch for active rendering context
      sha: branch.commit.sha,
      topics: data.topics ?? [],
      license: data.license?.spdx_id ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (e) {
    handleOctokitError(e);
  }
}

export async function fetchFlatTree(
  owner: string,
  repo: string,
  sha: string,
  tokenOrCtx?: string | RequestContext,
): Promise<{ items: FlatTreeItem[]; truncated: boolean }> {
  if (isMockRepo(owner)) {
    return fetchMockFlatTree(owner, repo);
  }
  const octokit = resolveOctokit(tokenOrCtx);
  try {
    const { data } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: sha,
      recursive: '1',
    });

    const blobs = (data.tree ?? [])
      .filter((item) => item.path && item.type === 'blob')
      .slice(0, MAX_TREE_ITEMS)
      .map((item) => ({
        path: item.path!,
        type: 'blob' as const,
        sha: item.sha!,
        size: item.size,
      }));

    const truncated = (data.tree?.length ?? 0) > MAX_TREE_ITEMS || data.truncated === true;

    return { items: blobs, truncated };
  } catch (e) {
    handleOctokitError(e);
  }
}

export function buildTreeFromPaths(items: FlatTreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const item of items) {
    const parts = item.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');

      let existing = current.find((n) => n.name === name);
      if (!existing) {
        existing = {
          path,
          name,
          type: isFile ? 'file' : 'dir',
          children: isFile ? undefined : [],
          size: isFile ? item.size : undefined,
          sha: isFile ? item.sha : undefined,
        };
        current.push(existing);
      }

      if (!isFile && existing.children) {
        current = existing.children;
      }
    }
  }

  return sortTree(root);
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((n) => ({
      ...n,
      children: n.children ? sortTree(n.children) : undefined,
    }));
}

const MANIFEST_PATHS = [
  'package.json',
  'requirements.txt',
  'pyproject.toml',
  'Pipfile',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'Dockerfile',
];

export function findManifestPaths(items: FlatTreeItem[]): string[] {
  return items
    .map((i) => i.path)
    .filter((path) => {
      const base = path.split('/').pop() ?? '';
      return MANIFEST_PATHS.includes(base) || base === 'package.json';
    })
    .slice(0, 20);
}

export async function fetchFileContents(
  owner: string,
  repo: string,
  paths: string[],
  ref: string,
  tokenOrCtx?: string | RequestContext,
): Promise<Record<string, string>> {
  if (isMockRepo(owner)) {
    return fetchMockFileContents(owner, repo, paths);
  }
  const octokit = resolveOctokit(tokenOrCtx);
  const result: Record<string, string> = {};

  await Promise.all(
    paths.map(async (path) => {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path,
          ref,
        });
        if (!Array.isArray(data) && data.type === 'file' && 'content' in data && data.content) {
          result[path] = Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 50000);
        }
      } catch {
        // skip unreadable files
      }
    }),
  );

  return result;
}

export async function fetchContributors(
  owner: string,
  repo: string,
  tokenOrCtx?: string | RequestContext,
): Promise<{ login: string; avatarUrl: string; contributions: number }[]> {
  if (isMockRepo(owner)) {
    return fetchMockContributors();
  }
  const octokit = resolveOctokit(tokenOrCtx);
  try {
    const { data } = await octokit.repos.listContributors({
      owner,
      repo,
      per_page: 15,
    });
    return data
      .filter((c) => c.login)
      .map((c) => ({
        login: c.login!,
        avatarUrl: c.avatar_url ?? '',
        contributions: c.contributions ?? 0,
      }));
  } catch {
    return [];
  }
}

export async function fetchTimeline(
  owner: string,
  repo: string,
  branch?: string,
  tokenOrCtx?: string | RequestContext,
): Promise<TimelineWeek[]> {
  if (isMockRepo(owner)) {
    return fetchMockTimeline();
  }
  const octokit = resolveOctokit(tokenOrCtx);
  try {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      sha: branch || undefined,
      since: since.toISOString(),
      per_page: 100,
    });

    const weeks = new Map<string, { count: number; commits: TimelineWeek['commits'] }>();

    for (const commit of data) {
      if (!commit.commit?.author?.date) continue;
      const date = new Date(commit.commit.author.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);

      const entry = weeks.get(weekKey) ?? { count: 0, commits: [] };
      entry.count++;
      if (entry.commits.length < 5) {
        entry.commits.push({
          sha: commit.sha.slice(0, 7),
          message: (commit.commit.message ?? '').split('\n')[0].slice(0, 80),
          date: commit.commit.author.date,
          authorName: commit.commit.author?.name || undefined,
          authorLogin: commit.author?.login || undefined,
          authorAvatar: commit.author?.avatar_url || undefined,
        });
      }
      weeks.set(weekKey, entry);
    }

    return Array.from(weeks.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, v]) => ({ week, ...v }));
  } catch {
    return [];
  }
}

