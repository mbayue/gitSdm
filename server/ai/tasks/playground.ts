import type { RequestContext } from '../../utils/context';
import { buildRepoContext, SYSTEM_PROMPT } from '../prompts';
import { analyzeRepository } from '../../services/analyze-repo';
import { executeAiTask } from '../service';

export async function generateRepoRoast(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{ roast: string; cached: boolean }> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  const result = await executeAiTask<string>({
    taskName: 'roast',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v1',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `You are a witty, sarcastic senior developer who has been asked to "roast" this codebase at a hackathon demo day. Think: Silicon Valley meets a comedy roast.

Rules:
- Be specific: joke about REAL files, REAL dependencies, and REAL structural decisions from the context
- Be funny, not mean. The goal is the audience laughs AND nods in recognition
- Reference at least 3 specific things from the codebase (file names, package choices, directory structure)
- Include at least one backhanded compliment ("The only good thing about...")
- End with an encouraging punchline
- Keep it to 3-4 punchy paragraphs. Quality over quantity.

Examples of good roast lines:
- "Your nested callbacks have callbacks. It's turtles all the way down, except the turtles are promises that were never awaited."
- "I see you've committed your .env file to git. Bold move. Very bold."
- "The README says 'simple setup' but the setup guide is 847 lines long."

${buildRepoContext(analysis)}`,
    apiKey,
    json: false,
    mockFallback: () => {
      const branchSuffix = branch ? ` on branch \`${branch}\`` : '';
      const isTodoApp = repo.toLowerCase() !== 'gitsdm';
      if (isTodoApp) {
        return `🔥 **The AI Todo App Roast**\n\nA Todo app. In 2026. Using React Context${branchSuffix}. Bold choice — because clearly useState wasn't painful enough on its own, so you wrapped everything in a context that now does state, localStorage, AND API sync. That's not separation of concerns, that's a cry for help disguised as a hook.\n\nLet's appreciate \`useLocalStorage.ts\` — a whole file to wrap two lines of localStorage. Peak abstraction. Meanwhile \`server/db.js\` is literally a JSON file being read and written like it's 2013 and MongoDB hasn't been invented yet. At least it's honest about what it is.\n\nThe good news? TodoItem.tsx is genuinely clean, the Tailwind styling is actually tasteful, and the folder structure won't make a senior developer cry. This codebase is the coding equivalent of a really solid junior dev interview project — just don't ship it to production.`;
      }
      return `🔥 **The AI Repository Roast**\n\nOh, look! Another developer tool utilizing React Flow! Did you build this because reading directories in VS Code was too easy, or did you just want to feel like a sci-fi hacker zooming into a dependency tree${branchSuffix}?\n\nLet's look at the structure:\n- You have a directory named \`server\` and a directory named \`src\` inside the root. Nice separation of concerns, except Vite is running both as one giant middleware monster.\n- A custom LRU cache that lives in-memory on a Vercel serverless function... that's like putting a state-of-the-art vault inside a cardboard box that gets shredded every 15 minutes on cold starts.\n- TypeScript typings defined everywhere, yet half of the network payloads are still labeled \`any\` under the hood. "Type-safety" is more of a wish list than a feature here, isn't it?\n\n*Keep up the good work! At least the dark mode gradient looks beautiful.*`;
    },
  });

  return { roast: result.data, cached: result.cached };
}

export async function generateReadmeEnhancement(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{ readme: string; cached: boolean }> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  const result = await executeAiTask<string>({
    taskName: 'readme-enhance',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v1',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Create an enhanced, professional, and clean README.md for this repository.
Include:
1. High-quality markdown shields/badges (build, license, stars).
2. Professional description and value proposition.
3. Clean structure with interactive/visual folders layout.
4. Setup, installation, and usage instructions based on package managers found in dependencies.
Use rich typography and make it look clean.

${buildRepoContext(analysis)}`,
    apiKey,
    json: false,
    mockFallback: () => {
      const branchSuffix = branch ? ` (branch: ${branch})` : '';
      return `# 🔮 gitSdm — Graph-Based Repository Analysis${branchSuffix}\n\n> Graph-based repository analysis tool for mapping dependencies, modules, and architecture notes from a GitHub URL.\n\n[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)\n[![GitHub Stars](https://img.shields.io/github/stars/mbayue/gitSdm?style=flat&color=violet)](https://github.com/mbayue/gitSdm)\n[![MIT License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)\n\n---\n\n## 🚀 Key Features\n\n* **Interactive Codebase Mapping**: Glowing node visualizer showing configurations, tests, source files, and dependencies.\n* **Architecture Summaries**: Understand module interaction, entry points, and systems flow quickly.\n* **Detailed Insights**: Perfect for onboarding new engineers on complex, multi-layered codebases.\n* **Health Dashboard & Refactoring**: Discover bottlenecks, coupled modules, and code duplication before they hit production.\n* **Mermaid Flowchart Generator**: Quickly export visual diagrams to copy-paste into internal developer wikis.\n\n---\n\n## 🛠️ Tech Stack\n\n- **Frontend**: React, TypeScript, Tailwind CSS, React Flow, Zustand, Framer Motion\n- **Backend**: Node.js API Router, Octokit, Google Gemini API\n`;
    },
  });

  return { readme: result.data, cached: result.cached };
}

export async function generateLearningPath(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{
  mentalModel: {
    type: string;
    description: string;
    concept: string;
  };
  recommendedPath: {
    path: string;
    importance: number;
    reason: string;
    role: string;
  }[];
  executionFlow: {
    steps: {
      from: string;
      to: string;
      description: string;
    }[];
    visualSteps: string[];
  };
  insights: {
    architecture: string;
    risks: string[];
    suggestions: string[];
  };
  cached: boolean;
}> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  type LearningPathResult = {
    mentalModel: { type: string; concept: string; description: string };
    recommendedPath: Array<{ path: string; importance: number; reason: string; role: string }>;
    executionFlow: { steps: Array<{ from: string; to: string; description: string }>; visualSteps: string[] };
    insights: { architecture: string; risks: string[]; suggestions: string[] };
  };

  const result = await executeAiTask<LearningPathResult>({
    taskName: 'learning-path',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v1',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Analyze this repository and return a detailed onboarding intelligence JSON with this exact shape:
{
  "mentalModel": {
    "type": "Architecture Type (e.g. Layered MVC, Event-Driven, Pipeline, Modular Service, Layered Frontend)",
    "concept": "1-sentence tagline describing the repository's core flow",
    "description": "2-3 sentences explaining the overarching mental model of this codebase to help a new developer."
  },
  "recommendedPath": [
    {
      "path": "exact file path from the repository files list (must exist!)",
      "importance": 0-100 score of how important this file is to read initially,
      "reason": "specific description of why this file matters and its main responsibilities",
      "role": "e.g. Entry Point, Core Logic, Config, Router, UI View"
    }
  ],
  "executionFlow": {
    "steps": [
      {
        "from": "starting component/file/stage",
        "to": "target component/file/stage",
        "description": "brief explanation of what data or execution flow happens between these two"
      }
    ],
    "visualSteps": [
      "array of 4-7 file paths (must exist in the repository files list) representing a typical execution pipeline in order"
    ]
  },
  "insights": {
    "architecture": "1-2 sentences on state management, visual engines, or database connections used.",
    "risks": [
      "2 critical architectural risks or potential technical debt items detected in this repository structure"
    ],
    "suggestions": [
      "2 helpful suggestions for a new developer or contributor trying to modify this repository"
    ]
  }
}

Choose 5-8 of the most critical files for recommendedPath, sorted by suggested reading order (highest priority at the top).
Ensure visualSteps lists actual existing file paths that map out the primary execution path (e.g., from main entrypoint through routers, controllers, services, database/view).
Only reference files that exist in the context list.

${buildRepoContext(analysis)}`,
    apiKey,
    json: true,
    mockFallback: () => {
      const branchSuffix = branch ? ` (branch: ${branch})` : '';
      const isTodoApp = repo.toLowerCase() !== 'gitsdm';

      if (isTodoApp) {
        return {
          mentalModel: {
            type: 'React Context + Express Backend',
            concept: 'UI Components → Context State → LocalStorage → Express API',
            description: `This is an offline-capable Todo app${branchSuffix}. The React frontend manages state via TodoContext and persists data with useLocalStorage. A lightweight Express backend (server/) provides a REST API for syncing todos to a simple JSON database.`
          },
          recommendedPath: [
            { path: 'README.md', importance: 95, reason: 'Overview of features, setup instructions, and architecture summary.', role: 'Documentation' },
            { path: 'src/App.tsx', importance: 90, reason: 'Root component — wraps the app in TodoProvider and renders the main layout.', role: 'Entry Point' },
            { path: 'src/context/TodoContext.tsx', importance: 88, reason: 'Core state logic — defines useTodo hook, handles add/remove/toggle operations and LocalStorage sync.', role: 'State Context' },
            { path: 'src/components/TodoList.tsx', importance: 84, reason: 'Renders the list of todos, wires up filtering and empty state handling.', role: 'UI Component' },
            { path: 'src/components/TodoItem.tsx', importance: 80, reason: 'Individual todo row — handles checkbox toggle, inline editing, and delete action.', role: 'UI Component' },
            { path: 'src/hooks/useLocalStorage.ts', importance: 76, reason: 'Generic hook for reading/writing to localStorage with JSON serialization.', role: 'Custom Hook' },
            { path: 'server/routes.js', importance: 72, reason: 'Express route definitions for GET/POST/PATCH/DELETE /todos endpoints.', role: 'API Routes' },
            { path: 'server/db.js', importance: 68, reason: 'Simple JSON file-based persistence layer used by the Express backend.', role: 'Data Layer' },
          ],
          executionFlow: {
            steps: [
              { from: 'src/main.tsx', to: 'src/App.tsx', description: 'React app mounts — App renders the root layout wrapped in TodoProvider.' },
              { from: 'src/App.tsx', to: 'src/context/TodoContext.tsx', description: 'TodoProvider initializes state from localStorage via useLocalStorage hook.' },
              { from: 'src/context/TodoContext.tsx', to: 'src/components/TodoList.tsx', description: 'Context provides todos array and dispatch actions (add, toggle, delete) to child components.' },
              { from: 'src/components/TodoList.tsx', to: 'src/components/TodoItem.tsx', description: 'Maps over todos array and renders a TodoItem per entry with bound handlers.' },
              { from: 'src/components/TodoItem.tsx', to: 'server/routes.js', description: 'On user action, context optionally syncs state change to the Express REST API.' },
            ],
            visualSteps: [
              'src/main.tsx',
              'src/App.tsx',
              'src/context/TodoContext.tsx',
              'src/components/TodoList.tsx',
              'src/components/TodoItem.tsx',
              'server/routes.js',
            ]
          },
          insights: {
            architecture: `The app uses React Context for state with localStorage persistence, keeping the frontend fully offline-capable. The Express backend is optional and acts as a remote sync layer, cleanly separated in the server/ directory.`,
            risks: [
              'TodoContext grows as a god-object: adding features like filtering, sorting, or tags will make it unwieldy without splitting into smaller contexts or a proper state manager like Zustand.',
              'localStorage sync inside the context is not debounced — rapid updates (e.g. fast typing in an inline editor) will trigger excessive serialization writes.'
            ],
            suggestions: [
              'Start by reading TodoContext.tsx in full before touching any component — all state mutations flow through it.',
              'The server/ folder is standalone Node/Express — you can test it independently with curl or Postman without running the Vite frontend.'
            ]
          },
        };
      }

      return {
        mentalModel: {
          type: 'Modular Service Pipeline',
          concept: 'Ingest → Parse & Layout → Render Graph → Enrich with LLM',
          description: `This repository follows a pipeline architecture${branchSuffix}. It fetches file structures via the GitHub API, parses configuration manifests (like package.json) to map dependencies, arranges nodes using the Dagre layout engine, and uses React Flow for canvas interactions. AI features query Gemini dynamically with code snippets.`
        },
        recommendedPath: [
          { path: 'README.md', importance: 95, reason: 'High-level project statement, configuration guides, and design directives.', role: 'Documentation' },
          { path: 'package.json', importance: 90, reason: 'Lists scripts and dependency graph. Critical for mapping dependencies.', role: 'Config' },
          { path: 'server/api-router.ts', importance: 88, reason: 'Entrypoint for API endpoints (Ingestion, AI explanations, Mermaid).', role: 'Server API Router' },
          { path: 'server/graph/graph-builder.ts', importance: 85, reason: 'Constructs nodes and edges, applying layout math via Dagre.', role: 'Core Builder' },
          { path: 'src/stores/viz-store.ts', importance: 82, reason: 'State container holding global graph filters, selection, and UI panels.', role: 'State Store' },
          { path: 'src/features/graph/GraphCanvas.tsx', importance: 80, reason: 'The primary interactive view where elements render on a canvas.', role: 'React Flow Canvas' }
        ],
        executionFlow: {
          steps: [
            { from: 'Landing Page (HomePage)', to: 'Repo Input Parser', description: 'User submits repository URL which gets parsed into owner, repo, and optional branch.' },
            { from: 'Repo Input Parser', to: 'Server Analysis Endpoint', description: 'Triggers /api/repo/analyze, launching flat tree fetching and dependency resolutions.' },
            { from: 'Server Analysis Endpoint', to: 'Graph Builder Engine', description: 'Files are categorized, package.json dependencies are analyzed, and tree is positioned.' },
            { from: 'Graph Builder Engine', to: 'React Flow Canvas', description: 'React Flow receives the Dagre layouted nodes and edges, drawing the visual model.' },
            { from: 'React Flow Canvas', to: 'Start Here AI Onboarding', description: 'AI synthesizes mental models, recommended files, and execution flow details.' }
          ],
          visualSteps: [
            'src/pages/HomePage.tsx',
            'server/api-router.ts',
            'server/services/analyze-repo.ts',
            'server/graph/graph-builder.ts',
            'src/pages/VizPage.tsx',
            'src/components/viz/LearningPathTab.tsx'
          ]
        },
        insights: {
          architecture: 'The repository leverages a cleanly decoupled layout: a Node server router for API handlers and GitHub data client pipelines, alongside a lightweight React Vite client. Global store synchronization is handled cleanly using Zustand.',
          risks: [
            'The Dagre layout calculation runs on the server, which can block the main API event loop for extremely large repositories.',
            'Memory-cached LRU storage in serverless server instances will reset during cold starts, causing frequent rate limits.'
          ],
          suggestions: [
            'New contributors should start by looking at how data flows from analyze-repo.ts into graph-builder.ts.',
            'Try implementing client-side layout caching or local storage hydration to avoid repeated API requests.'
          ]
        },
      };
    },
  });

  const mentalModel = result.data.mentalModel ?? { type: 'Modular Application', concept: 'Unknown flow', description: 'Unable to parse AI mental model.' };
  const recommendedPath = result.data.recommendedPath ?? analysis.importantFiles.slice(0, 4).map((f, idx) => ({ path: f, importance: 90 - idx * 10, reason: 'Structurally important file.', role: 'Source' }));
  const executionFlow = result.data.executionFlow ?? { steps: [], visualSteps: analysis.importantFiles.slice(0, 4) };
  const insights = result.data.insights ?? { architecture: 'Standard setup.', risks: [], suggestions: [] };

  return { mentalModel, recommendedPath, executionFlow, insights, cached: result.cached };
}

