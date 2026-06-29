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

const MAX_TREE_ITEMS = 5000;

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
  } catch (e) {
    handleOctokitError(e);
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

  // Step 1: Get repo metadata (separate try/catch for precise errors)
  let data;
  try {
    ({ data } = await octokit.repos.get({ owner, repo }));
  } catch (e) {
    handleOctokitError(e);
    return undefined as never;
  }

  // Step 2: Resolve branch (fall back to default if specified branch doesn't exist)
  const targetBranch = branchName || data.default_branch;
  try {
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
      defaultBranch: targetBranch,
      sha: branch.commit.sha,
      topics: data.topics ?? [],
      license: data.license?.spdx_id ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (e) {
    // If the requested branch doesn't exist, fall back to default branch
    if (branchName && e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
      try {
        const { data: branch } = await octokit.repos.getBranch({
          owner,
          repo,
          branch: data.default_branch,
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
          defaultBranch: data.default_branch,
          sha: branch.commit.sha,
          topics: data.topics ?? [],
          license: data.license?.spdx_id ?? null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      } catch (fallbackErr) {
        handleOctokitError(fallbackErr);
        return undefined as never;
      }
    }
    handleOctokitError(e);
    return undefined as never;
  }
}

export async function fetchFlatTree(
  owner: string,
  repo: string,
  sha: string,
  tokenOrCtx?: string | RequestContext,
): Promise<{ items: FlatTreeItem[]; truncated: boolean; totalFiles: number }> {
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

    const allBlobs: FlatTreeItem[] = [];
    const tree = data.tree ?? [];
    for (const item of tree) {
      if (item.path && item.type === 'blob') {
        allBlobs.push({
          path: item.path,
          type: 'blob',
          sha: item.sha!,
          size: item.size,
        });
      }
    }

    const totalFiles = allBlobs.length;

    // Prioritize source code over noise (docs, tests, generated)
    const isManifest = (p: string) => {
      const base = p.split('/').pop() ?? '';
      return MANIFEST_PATHS.includes(base);
    };

    const isNoise = (p: string) => {
      const lower = p.toLowerCase();
      // Match explicit noise folders
      if (lower.includes('docs/') || lower.includes('test/') || lower.includes('tests/') || lower.includes('spec/') || lower.includes('dist/') || lower.includes('build/') || lower.includes('example/')) return true;
      // Match any hidden folder starting with a dot (e.g., .github, .vscode, .husky)
      if (lower.includes('/.') || lower.startsWith('.')) return true;
      return false;
    };

    const mapped = allBlobs.map((item) => {
      let priority = 0;
      if (isManifest(item.path)) priority = -1; // Highest priority: never truncate manifests
      else if (isNoise(item.path)) priority = 1;  // Lowest priority: noise
      return { item, priority };
    });

    mapped.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.item.path.localeCompare(b.item.path);
    });
    for (let i = 0; i < mapped.length; i++) {
      allBlobs[i] = mapped[i].item;
    }

    const blobs = allBlobs.slice(0, MAX_TREE_ITEMS);

    const truncated = tree.length > MAX_TREE_ITEMS || data.truncated === true;

    return { items: blobs, truncated, totalFiles };
  } catch (e) {
    handleOctokitError(e);
    return undefined as never;
  }
}

export function buildTreeFromPaths(items: FlatTreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  for (const item of items) {
    const parts = item.path.split('/');
    let current = root;
    let path = '';

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      path = path ? `${path}/${name}` : name;

      let existing = map.get(path);
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
        map.set(path, existing);
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
  'pnpm-workspace.yaml',
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
  const paths: string[] = [];
  for (const item of items) {
    const base = item.path.split('/').pop() ?? '';
    if (MANIFEST_PATHS.includes(base)) {
      paths.push(item.path);
      if (paths.length >= 50) break;
    }
  }
  return paths;
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

  const CONCURRENCY = 7;
  for (let i = 0; i < paths.length; i += CONCURRENCY) {
    const chunk = paths.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (path) => {
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
  }

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
    const result: { login: string; avatarUrl: string; contributions: number }[] = [];
    for (let page = 1; ; page++) {
      const { data } = await octokit.repos.listContributors({
        owner,
        repo,
        per_page: 100,
        page,
      });
      for (const c of data) {
        if (c.login) {
          result.push({
            login: c.login,
            avatarUrl: c.avatar_url ?? '',
            contributions: c.contributions ?? 0,
          });
        }
      }
      if (data.length < 100) break;
    }
    return result;
  } catch {
    return [];
  }
}

export async function fetchTotalCommits(
  owner: string,
  repo: string,
  branch?: string,
  tokenOrCtx?: string | RequestContext,
): Promise<number> {
  if (isMockRepo(owner)) {
    return (await fetchMockContributors()).reduce((sum, c) => sum + c.contributions, 0);
  }
  const octokit = resolveOctokit(tokenOrCtx);
  try {
    const { data, headers } = await octokit.repos.listCommits({
      owner,
      repo,
      sha: branch || undefined,
      per_page: 1,
    });
    const link = headers?.link ?? '';
    const lastPage = /[?&]page=(\d+)>;\s*rel="last"/.exec(link)?.[1];
    return lastPage ? Number(lastPage) : data.length;
  } catch {
    return 0;
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

    const result: TimelineWeek[] = [];
    const sortedEntries = Array.from(weeks.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [week, v] of sortedEntries) {
      result.push({ week, ...v });
    }
    return result;
  } catch {
    return [];
  }
}

