import type { RepoInfo, FlatTreeItem } from './fetch-tree';
import type { Contributor, TimelineWeek } from '../../src/types';

export function isMockRepo(owner: string): boolean {
  return owner.toLowerCase() === 'mock';
}

const TODO_APP_FILES = [
  { path: 'package.json', size: 680 },
  { path: 'tsconfig.json', size: 340 },
  { path: 'Dockerfile', size: 210 },
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

const TODO_APP_CONTENTS: Record<string, string> = {
  'package.json': `{
  "name": "mock-todo-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "start": "node server/index.js"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.395.0",
    "zod": "^3.23.8",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.2.2",
    "vite": "^5.3.1",
    "tailwindcss": "^3.4.4",
    "postcss": "^8.4.38",
    "autoprefixer": "^10.4.19"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "OT2020"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}`,
  'Dockerfile': `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,
  'README.md': `# 📝 Mock Todo App

A beautiful, functional offline-first React Todo Application with a lightweight Node/Express backend database.

## Features

- **React Context State**: Clean state updates and offline local storage persistence.
- **Express Backend**: Synced endpoint backup API.
- **Tailwind CSS**: Modern glow cards, interactive checkboxes, and keyboard navigation.

## Installation

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  'src/App.tsx': `import React from 'react';
import { TodoProvider } from './context/TodoContext';
import { TodoList } from './components/TodoList';
import { Button } from './components/Button';

export function App() {
  return (
    <TodoProvider>
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Tasks
            </h1>
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </header>
          <TodoList />
        </div>
      </div>
    </TodoProvider>
  );
}`,
};

const GITSDM_CONTENTS: Record<string, string> = {
  'package.json': `{
  "name": "gitsdm",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && tsc",
    "lint": "eslint ."
  },
  "dependencies": {
    "@octokit/rest": "^20.1.1",
    "@xyflow/react": "^12.0.0-next.17",
    "framer-motion": "^11.2.10",
    "lucide-react": "^0.395.0",
    "zod": "^3.23.8",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "vite": "^5.3.1",
    "typescript": "^5.2.2",
    "tailwindcss": "^3.4.4"
  }
}`,
  'Dockerfile': `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]`,
  'README.md': `# 🔮 gitSdm — Git Software Dependency Map

gitSdm is a beautiful, interactive tool to visualize GitHub repositories, their folders, files, and ecosystem dependencies.

## Key Abstractions

- **Graph Renderer**: Utilizes React Flow with custom layout engines (Dagre).
- **Dependency Parser**: Reads packages, requirements, and Cargo manifests.
- **AI Sidebar**: Generates code roasts, interactive onboarding guides, and refactoring maps.
`,
};

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

export async function fetchMockRepoBranches(): Promise<{ name: string; protected: boolean }[]> {
  return [
    { name: 'main', protected: true },
    { name: 'develop', protected: false },
    { name: 'feature/mock-mode', protected: false },
  ];
}
