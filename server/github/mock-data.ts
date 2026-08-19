import type { RepoInfo, FlatTreeItem } from './fetch-tree';
import type { Contributor, TimelineWeek } from '../../src/types';

const MOCK_B64 = "eyJ0b2RvIjp7InBhY2thZ2UuanNvbiI6IntcbiAgXCJuYW1lXCI6IFwibW9jay10b2RvLWFwcFwiLFxuICBcInZlcnNpb25cIjogXCIxLjAuMFwiLFxuICBcInByaXZhdGVcIjogdHJ1ZSxcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImRldlwiOiBcInZpdGVcIixcbiAgICBcImJ1aWxkXCI6IFwidHNjICYmIHZpdGUgYnVpbGRcIixcbiAgICBcInN0YXJ0XCI6IFwibm9kZSBzZXJ2ZXIvaW5kZXguanNcIlxuICB9LFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJyZWFjdFwiOiBcIl4xOC4zLjFcIixcbiAgICBcInJlYWN0LWRvbVwiOiBcIl4xOC4zLjFcIixcbiAgICBcImx1Y2lkZS1yZWFjdFwiOiBcIl4wLjM5NS4wXCIsXG4gICAgXCJ6b2RcIjogXCJeMy4yMy44XCIsXG4gICAgXCJjbHN4XCI6IFwiXjIuMS4xXCIsXG4gICAgXCJ0YWlsd2luZC1tZXJnZVwiOiBcIl4yLjMuMFwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkB0eXBlcy9yZWFjdFwiOiBcIl4xOC4zLjNcIixcbiAgICBcIkB0eXBlcy9yZWFjdC1kb21cIjogXCJeMTguMy4wXCIsXG4gICAgXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiOiBcIl40LjMuMFwiLFxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjIuMlwiLFxuICAgIFwidml0ZVwiOiBcIl41LjMuMVwiLFxuICAgIFwidGFpbHdpbmRjc3NcIjogXCJeMy40LjRcIixcbiAgICBcInBvc3Rjc3NcIjogXCJeOC40LjM4XCIsXG4gICAgXCJhdXRvcHJlZml4ZXJcIjogXCJeMTAuNC4xOVwiXG4gIH1cbn0iLCJ0c2NvbmZpZy5qc29uIjoie1xuICBcImNvbXBpbGVyT3B0aW9uc1wiOiB7XG4gICAgXCJ0YXJnZXRcIjogXCJFUzIwMjBcIixcbiAgICBcInVzZURlZmluZUZvckNsYXNzRmllbGRzXCI6IHRydWUsXG4gICAgXCJsaWJcIjogW1wiRE9NXCIsIFwiRE9NLkl0ZXJhYmxlXCIsIFwiT1QyMDIwXCJdLFxuICAgIFwibW9kdWxlXCI6IFwiRVNOZXh0XCIsXG4gICAgXCJza2lwTGliQ2hlY2tcIjogdHJ1ZSxcbiAgICBcIm1vZHVsZVJlc29sdXRpb25cIjogXCJidW5kbGVyXCIsXG4gICAgXCJhbGxvd0ltcG9ydGluZ1RzRXh0ZW5zaW9uc1wiOiB0cnVlLFxuICAgIFwicmVzb2x2ZUpzb25Nb2R1bGVcIjogdHJ1ZSxcbiAgICBcImlzb2xhdGVkTW9kdWxlc1wiOiB0cnVlLFxuICAgIFwibm9FbWl0XCI6IHRydWUsXG4gICAgXCJqc3hcIjogXCJyZWFjdC1qc3hcIixcbiAgICBcInN0cmljdFwiOiB0cnVlLFxuICAgIFwibm9VbnVzZWRMb2NhbHNcIjogdHJ1ZSxcbiAgICBcIm5vVW51c2VkUGFyYW1ldGVyc1wiOiB0cnVlLFxuICAgIFwibm9JbXBsaWNpdFJldHVybnNcIjogdHJ1ZSxcbiAgICBcIm5vRmFsbHRocm91Z2hDYXNlc0luU3dpdGNoXCI6IHRydWVcbiAgfSxcbiAgXCJpbmNsdWRlXCI6IFtcInNyY1wiXVxufSIsIkRvY2tlcmZpbGUiOiJGUk9NIG5vZGU6MjAtYWxwaW5lXG5XT1JLRElSIC9hcHBcbkNPUFkgcGFja2FnZSouanNvbiAuL1xuUlVOIG5wbSBjaSAtLW9taXQ9ZGV2XG5DT1BZIC4gLlxuRVhQT1NFIDMwMDBcbkNNRCBbXCJucG1cIiwgXCJzdGFydFwiXSIsIlJFQURNRS5tZCI6IiMg8J+TnSBNb2NrIFRvZG8gQXBwXG5cbkEgYmVhdXRpZnVsLCBmdW5jdGlvbmFsIG9mZmxpbmUtZmlyc3QgUmVhY3QgVG9kbyBBcHBsaWNhdGlvbiB3aXRoIGEgbGlnaHR3ZWlnaHQgTm9kZS9FeHByZXNzIGJhY2tlbmQgZGF0YWJhc2UuXG5cbiMjIEZlYXR1cmVzXG5cbi0gKipSZWFjdCBDb250ZXh0IFN0YXRlKio6IENsZWFuIHN0YXRlIHVwZGF0ZXMgYW5kIG9mZmxpbmUgbG9jYWwgc3RvcmFnZSBwZXJzaXN0ZW5jZS5cbi0gKipFeHByZXNzIEJhY2tlbmQqKjogU3luY2VkIGVuZHBvaW50IGJhY2t1cCBBUEkuXG4tICoqVGFpbHdpbmQgQ1NTKio6IE1vZGVybiBnbG93IGNhcmRzLCBpbnRlcmFjdGl2ZSBjaGVja2JveGVzLCBhbmQga2V5Ym9hcmQgbmF2aWdhdGlvbi5cblxuIyMgSW5zdGFsbGF0aW9uXG5cbmBgYGJhc2hcbm5wbSBpbnN0YWxsXG5ucG0gcnVuIGRldlxuYGBgXG4iLCJzcmMvbWFpbi50c3giOiJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbS9jbGllbnQnO1xuaW1wb3J0IHsgQXBwIH0gZnJvbSAnLi9BcHAnO1xuaW1wb3J0ICcuL2luZGV4LmNzcyc7XG5cblJlYWN0RE9NLmNyZWF0ZVJvb3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKSEpLnJlbmRlcihcbiAgPFJlYWN0LlN0cmljdE1vZGU+XG4gICAgPEFwcCAvPlxuICA8L1JlYWN0LlN0cmljdE1vZGU+XG4pOyIsInNyYy9BcHAudHN4IjoiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IFRvZG9Qcm92aWRlciB9IGZyb20gJy4vY29udGV4dC9Ub2RvQ29udGV4dCc7XG5pbXBvcnQgeyBUb2RvTGlzdCB9IGZyb20gJy4vY29tcG9uZW50cy9Ub2RvTGlzdCc7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tICcuL2NvbXBvbmVudHMvQnV0dG9uJztcblxuZXhwb3J0IGZ1bmN0aW9uIEFwcCgpIHtcbiAgcmV0dXJuIChcbiAgICA8VG9kb1Byb3ZpZGVyPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4taC1zY3JlZW4gYmctemluYy05NTAgdGV4dC13aGl0ZSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTZcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctbWQgYmctemluYy05MDAgYm9yZGVyIGJvcmRlci16aW5jLTgwMCByb3VuZGVkLTJ4bCBwLTYgc2hhZG93LTJ4bFwiPlxuICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIG1iLTZcIj5cbiAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdHJhY2tpbmctdGlnaHQgYmctZ3JhZGllbnQtdG8tciBmcm9tLXZpb2xldC00MDAgdG8taW5kaWdvLTQwMCBiZy1jbGlwLXRleHQgdGV4dC10cmFuc3BhcmVudFwiPlxuICAgICAgICAgICAgICBUYXNrc1xuICAgICAgICAgICAgPC9oMT5cbiAgICAgICAgICAgIDxCdXR0b24gdmFyaWFudD1cIm91dGxpbmVcIiBzaXplPVwic21cIj5cbiAgICAgICAgICAgICAgU2V0dGluZ3NcbiAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgIDwvaGVhZGVyPlxuICAgICAgICAgIDxUb2RvTGlzdCAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvVG9kb1Byb3ZpZGVyPlxuICApO1xufSJ9LCJnaXRzZG0iOnsicGFja2FnZS5qc29uIjoie1xuICBcIm5hbWVcIjogXCJnaXRzZG1cIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMS4wLjBcIixcbiAgXCJwcml2YXRlXCI6IHRydWUsXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiZGV2XCI6IFwidml0ZVwiLFxuICAgIFwiYnVpbGRcIjogXCJ2aXRlIGJ1aWxkICYmIHRzY1wiLFxuICAgIFwibGludFwiOiBcImVzbGludCAuXCJcbiAgfSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQG9jdG9raXQvcmVzdFwiOiBcIl4yMC4xLjFcIixcbiAgICBcIkB4eWZsb3cvcmVhY3RcIjogXCJeMTIuMC4wLW5leHQuMTdcIixcbiAgICBcImZyYW1lci1tb3Rpb25cIjogXCJeMTEuMi4xMFwiLFxuICAgIFwibHVjaWRlLXJlYWN0XCI6IFwiXjAuMzk1LjBcIixcbiAgICBcInpvZFwiOiBcIl4zLjIzLjhcIixcbiAgICBcInp1c3RhbmRcIjogXCJeNC41LjJcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJ2aXRlXCI6IFwiXjUuMy4xXCIsXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjUuMi4yXCIsXG4gICAgXCJ0YWlsd2luZGNzc1wiOiBcIl4zLjQuNFwiXG4gIH1cbn0iLCJEb2NrZXJmaWxlIjoiRlJPTSBub2RlOjIwLWFscGluZVxuV09SS0RJUiAvYXBwXG5DT1BZIHBhY2thZ2UqLmpzb24gLi9cblJVTiBucG0gaW5zdGFsbFxuQ09QWSAuIC5cbkVYUE9TRSA1MTczXG5DTUQgW1wibnBtXCIsIFwicnVuXCIsIFwiZGV2XCJdIiwiUkVBRE1FLm1kIjoiIyDwn5SuIGdpdFNkbSDigJQgR2l0IFNvZnR3YXJlIERlcGVuZGVuY3kgTWFwXG5cbmdpdFNkbSBpcyBhIGJlYXV0aWZ1bCwgaW50ZXJhY3RpdmUgdG9vbCB0byB2aXN1YWxpemUgR2l0SHViIHJlcG9zaXRvcmllcywgdGhlaXIgZm9sZGVycywgZmlsZXMsIGFuZCBlY29zeXN0ZW0gZGVwZW5kZW5jaWVzLlxuXG4jIyBLZXkgQWJzdHJhY3Rpb25zXG5cbi0gKipHcmFwaCBSZW5kZXJlcioqOiBVdGlsaXplcyBSZWFjdCBGbG93IHdpdGggY3VzdG9tIGxheW91dCBlbmdpbmVzIChEYWdyZSkuXG4tICoqRGVwZW5kZW5jeSBQYXJzZXIqKjogUmVhZHMgcGFja2FnZXMsIHJlcXVpcmVtZW50cywgYW5kIENhcmdvIG1hbmlmZXN0cy5cbi0gKipBSSBTaWRlYmFyKio6IEdlbmVyYXRlcyBjb2RlIHJvYXN0cywgaW50ZXJhY3RpdmUgb25ib2FyZGluZyBndWlkZXMsIGFuZCByZWZhY3RvcmluZyBtYXBzLlxuIn19";

const MOCK_DATA = JSON.parse(Buffer.from(MOCK_B64, 'base64').toString('utf8'));
const TODO_APP_CONTENTS: Record<string, string> = MOCK_DATA.todo;
const GITSDM_CONTENTS: Record<string, string> = MOCK_DATA.gitsdm;
export function isMockRepo(owner: string): boolean {
  return owner.toLowerCase() === 'mock' || owner.toLowerCase() === 'mock-owner';
}

const TODO_APP_FILES = [

  { path: 'README.md', size: 1200 },
  { path: 'src/main.tsx', size: 450 },
  { path: 'src/App.tsx', size: 1800 },
  { path: 'src/index.css', size: 1400 },
  { path: 'src/components/TodoList.tsx', size: 2100 },
  { path: 'src/components/TodoItem.tsx', size: 1200 },
  { path: 'src/components/Button.tsx', size: 800 },
  { path: 'src/components/ui/input.tsx', size: 600 },
  { path: 'src/components/ui/dialog.tsx', size: 1500 },
  { path: 'src/context/TodoContext.tsx', size: 1600 },
  { path: 'src/hooks/useLocalStorage.ts', size: 900 },
  { path: 'src/types/index.ts', size: 800 },
  { path: 'src/utils/date.ts', size: 400 },
  { path: 'server/index.js', size: 1200 },
  { path: 'server/db.js', size: 900 },
  { path: 'server/routes.js', size: 1500 },
];

const GITSDM_FILES = [
  { path: 'package.json', size: 1871 },
  { path: 'tsconfig.json', size: 747 },
  { path: 'vite.config.ts', size: 415 },
  { path: 'tailwind.config.js', size: 2082 },
  { path: 'postcss.config.js', size: 87 },
  { path: 'index.html', size: 1161 },
  { path: 'Dockerfile', size: 705 },
  { path: 'README.md', size: 10905 },
  { path: 'server/api-router.ts', size: 10804 },
  { path: 'server/dev-api.ts', size: 1264 },
  { path: 'server/prod-server.ts', size: 3209 },
  { path: 'server/github/client.ts', size: 2299 },
  { path: 'server/github/fetch-tree.ts', size: 7495 },
  { path: 'server/github/parse-url.ts', size: 1031 },
  { path: 'server/services/analyze-repo.ts', size: 2515 },
  { path: 'server/services/get-file.ts', size: 571 },
  { path: 'server/services/trending.ts', size: 2048 },
  { path: 'server/graph/graph-builder.ts', size: 3126 },
  { path: 'server/graph/layout.ts', size: 1288 },
  { path: 'server/graph/node-colors.ts', size: 1388 },
  { path: 'server/parser/dependency-analyzer.ts', size: 638 },
  { path: 'server/parser/file-classifier.ts', size: 2525 },
  { path: 'server/parser/manifest-parsers/index.ts', size: 5205 },
  { path: 'src/main.tsx', size: 520 },
  { path: 'src/App.tsx', size: 3200 },
  { path: 'src/index.css', size: 2500 },
  { path: 'src/types/index.ts', size: 4466 },
  { path: 'src/lib/api-client.ts', size: 3500 },
  { path: 'src/lib/utils.ts', size: 776 },
  { path: 'src/hooks/useAnalyzeRepo.ts', size: 2800 },
  { path: 'src/components/home/RepoInput.tsx', size: 4021 },
  { path: 'src/components/viz/VizTopBar.tsx', size: 3200 },
  { path: 'src/components/viz/VizError.tsx', size: 3648 },
  { path: 'src/components/explorer/ExplorerPanel.tsx', size: 5000 },
  { path: 'src/components/contributors/ContributorList.tsx', size: 3800 },
  { path: 'src/components/timeline/CommitHistory.tsx', size: 4200 },
];


export async function fetchMockRepoInfo(owner: string, repo: string, branchName?: string): Promise<RepoInfo> {
  const isGitSdm = repo.toLowerCase() === 'gitsdm';
  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
    description: isGitSdm 
      ? '🔮 Git Software Dependency Map — Interactive visualization & AI diagnostics for any repository.'
      : '📝 Beautiful offline-first React Todo Application with LocalStorage persistence.',
    stars: isGitSdm ? 128 : 45,
    forks: isGitSdm ? 14 : 3,
    language: isGitSdm ? 'TypeScript' : 'TypeScript',
    defaultBranch: branchName || 'main',
    sha: 'mock_commit_sha_abcdef1234567890',
    topics: isGitSdm ? ['visualization', 'react-flow', 'dependency-graph', 'ai'] : ['todo', 'react', 'localstorage', 'offline-first'],
    license: 'MIT',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchMockFlatTree(_owner: string, repo: string): Promise<{ items: FlatTreeItem[]; truncated: boolean; totalFiles: number }> {
  const files = repo.toLowerCase() === 'gitsdm' ? GITSDM_FILES : TODO_APP_FILES;
  const data = files.map((file, idx) => ({
    path: file.path,
    type: 'blob' as const,
    sha: `mock_file_sha_${idx}_${file.path.replace(/\//g, '_')}`,
    size: file.size,
  }));

  return {
    items: data,
    truncated: false,
    totalFiles: data.length,
  };
}

export async function fetchMockFileContents(
  _owner: string,
  repo: string,
  paths: string[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const database = repo.toLowerCase() === 'gitsdm' ? GITSDM_CONTENTS : TODO_APP_CONTENTS;

  for (const path of paths) {
    if (database[path]) {
      result[path] = database[path];
    } else {
      // Return placeholder for source files
      result[path] = `// Mock content for: ${path}\n\nexport function mockHandler() {\n  console.log("This is a mock repository file for local development.");\n}`;
    }
  }

  return result;
}

export async function fetchMockContributors(): Promise<Contributor[]> {
  return [
    { login: 'mbayue', avatarUrl: 'https://github.com/mbayue.png', contributions: 84 },
    { login: 'octocat', avatarUrl: 'https://github.com/octocat.png', contributions: 12 },
    { login: 'antigravity-ai', avatarUrl: 'https://github.com/github.png', contributions: 9 },
  ];
}

export async function fetchMockTimeline(): Promise<TimelineWeek[]> {
  const weeks: TimelineWeek[] = [];
  const now = new Date();
  
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (now.getDay() + i * 7));
    const weekKey = weekStart.toISOString().slice(0, 10);
    
    weeks.push({
      week: weekKey,
      count: 2 + (i % 3),
      commits: [
        {
          sha: `mock${i}a`,
          message: i === 0 ? 'docs: Update README with deployment badges' : `feat: Core module refactor phase ${i}`,
          date: weekStart.toISOString(),
          authorName: 'Bayu Erich',
          authorLogin: 'mbayue',
          authorAvatar: 'https://github.com/mbayue.png',
        },
        {
          sha: `mock${i}b`,
          message: `fix: Resolve layout regression on node size update #${12 + i}`,
          date: new Date(weekStart.getTime() + 86400000).toISOString(),
          authorName: 'Antigravity AI',
          authorLogin: 'antigravity-ai',
          authorAvatar: 'https://github.com/github.png',
        }
      ]
    });
  }

  return weeks.reverse();
}

export async function fetchMockChurn(
  paths: string[],
): Promise<Record<string, { commitCount: number; authorCount: number; lastModified: string; churnScore: number }>> {
  const result: Record<string, { commitCount: number; authorCount: number; lastModified: string; churnScore: number }> = {};
  const now = new Date();

  // First pass: generate all entries
  for (let i = 0; i < paths.length; i++) {
    const commitCount = Math.floor(Math.random() * 15) + 1;
    const authorCount = Math.min(commitCount, Math.floor(Math.random() * 4) + 1);
    const daysAgo = Math.floor(Math.random() * 30);
    const lastModified = new Date(now.getTime() - daysAgo * 86400000).toISOString();
    result[paths[i]] = {
      commitCount,
      authorCount,
      lastModified,
      churnScore: 0, // placeholder, normalized in second pass
    };
  }

  // Second pass: normalize from actual max
  const maxCommits = Math.max(1, ...Object.values(result).map((d) => d.commitCount));
  for (const data of Object.values(result)) {
    data.churnScore = +(data.commitCount / maxCommits).toFixed(4);
  }

  return result;
}

export async function fetchMockRepoBranches(): Promise<{ name: string; protected: boolean }[]> {
  return [
    { name: 'main', protected: true },
    { name: 'develop', protected: false },
    { name: 'feature/mock-mode', protected: false },
  ];
}
