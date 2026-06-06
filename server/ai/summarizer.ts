import { hashContext } from '../cache/lru';
import type { RepoAnalysis } from '../../src/types';
import type { RequestContext } from '../utils/context';
import { buildRepoContext, SYSTEM_PROMPT } from './prompts';
import { analyzeRepository } from '../services/analyze-repo';
import { executeAiTask } from './service';

export async function explainRepo(
  params: {
    owner: string;
    repo: string;
    branch?: string;
    scope: 'repo' | 'node' | 'file';
    nodeId?: string;
    filePath?: string;
    fileSnippet?: string;
    context?: string;
    apiKey?: string;
    gitHubToken?: string;
  },
  ctx?: RequestContext,
): Promise<{ explanation: string; cached: boolean }> {
  const analysis = await analyzeRepository({ owner: params.owner, repo: params.repo, branch: params.branch }, ctx || params.gitHubToken);
  const ctxHash = hashContext(
    JSON.stringify({ scope: params.scope, nodeId: params.nodeId, filePath: params.filePath, context: params.context }),
  );

  let userPrompt = buildRepoContext(analysis);
  if (params.scope === 'node' && params.nodeId) {
    userPrompt += `\n\nFocus on graph node: ${params.nodeId}`;
  }
  if (params.scope === 'file' && params.filePath) {
    userPrompt += `\n\nFocus on file: ${params.filePath}`;
    if (params.fileSnippet) {
      userPrompt += `\n\nFile snippet:\n\`\`\`\n${params.fileSnippet.slice(0, 4000)}\n\`\`\``;
    }
  }
  if (params.context) userPrompt += `\n\nAdditional context: ${params.context}`;

  const scopeInstruction =
    params.scope === 'node' && params.nodeId
      ? `Focus specifically on the graph node/module "${params.nodeId}". Explain: (1) what this module does, (2) its role in the overall architecture, (3) what calls into it and what it calls, (4) any notable implementation patterns or concerns.`
      : params.scope === 'file' && params.filePath
      ? `Focus specifically on the file "${params.filePath}". Explain: (1) the file's purpose and responsibility, (2) its key functions/classes/exports, (3) how it fits into the overall data flow, (4) any notable patterns, gotchas, or design decisions.`
      : `Provide a comprehensive repository overview covering: (1) What this project actually does and who it's for — be specific, not generic. (2) The architectural style (e.g. monorepo, microservices, layered MVC, etc) and why it makes sense for this project. (3) The main execution flow — trace a typical user request from entry point through all key layers. (4) The most important modules/directories and their exact roles. (5) Notable technical choices (framework picks, state management, build tooling) and what they reveal about the project's priorities.`;

  const result = await executeAiTask<string>({
    taskName: 'explain',
    owner: params.owner,
    repo: params.repo,
    sha: analysis.meta.sha,
    paramHash: ctxHash,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${scopeInstruction}\n\n${userPrompt}`,
    apiKey: params.apiKey,
    json: false,
    mockFallback: () => {
      const branchSuffix = params.branch ? ` on branch **${params.branch}**` : '';
      return params.scope === 'node' && params.nodeId
        ? `This is a mock explanation for the selected node: **${params.nodeId}**${branchSuffix}. It acts as a key module in the codebase.`
        : params.scope === 'file' && params.filePath
        ? `This is a mock explanation for file: \`${params.filePath}\`${branchSuffix}. It contains core application logic.`
        : `This is a mock explanation for repository: **${params.owner}/${params.repo}**${branchSuffix}.`;
    },
  });

  return { explanation: result.data, cached: result.cached };
}

export async function explainArchitecture(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{ overview: string; layers: { name: string; description: string }[]; cached: boolean }> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  const result = await executeAiTask<{ overview: string; layers: { name: string; description: string }[] }>({
    taskName: 'architecture',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v1',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Analyze this repository's system architecture deeply and return JSON with this exact shape:
{
  "overview": "A 2-3 sentence technical description of the architectural style, main design decisions, and how components interact. Be specific — mention real file names and modules.",
  "layers": [
    { "name": "Layer Name", "description": "Precise description of what this layer does, which files/directories implement it, and how it connects to adjacent layers." }
  ]
}

Identify 4-7 distinct architectural layers (e.g. Presentation/UI, API/Router, Services/Business Logic, Data/GitHub API, AI/ML Layer, Cache, Utilities). Each layer description must reference real files from the context. Do NOT produce generic descriptions.

${buildRepoContext(analysis)}`,
    apiKey,
    json: true,
    mockFallback: () => {
      const branchSuffix = branch ? ` (branch: ${branch})` : '';
      const isTodoApp = repo.toLowerCase() !== 'gitsdm';
      if (isTodoApp) {
        return {
          overview: `The todo-app follows a classic React Context + Express pattern${branchSuffix}. The frontend is a Vite/React SPA that manages state via TodoContext and persists locally with useLocalStorage. The server/ folder provides an optional Express REST API for remote sync.`,
          layers: [
            { name: 'Presentation', description: 'React components in src/components/ — TodoList, TodoItem, Button, and UI primitives like input.tsx and dialog.tsx' },
            { name: 'State / Context', description: 'src/context/TodoContext.tsx provides the useTodo hook and all CRUD operations via React Context' },
            { name: 'Persistence', description: 'src/hooks/useLocalStorage.ts wraps localStorage with JSON serialization for offline-first state' },
            { name: 'Backend API', description: 'server/routes.js defines Express REST endpoints; server/db.js handles JSON file persistence' },
          ],
        };
      }
      return {
        overview: `This repository follows a modular architecture with clear separation between API routes, shared server logic, and a React frontend${branchSuffix}. The visualization layer uses React Flow for interactive dependency graphs.`,
        layers: [
          { name: 'Presentation', description: 'React + Vite SPA with Tailwind and Framer Motion' },
          { name: 'API', description: 'Serverless handlers for GitHub ingestion and AI' },
          { name: 'Core', description: 'Parsers, graph builder, and GitHub client' },
        ],
      };
    },
  });

  return { ...result.data, cached: result.cached };
}

export async function suggestFiles(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{
  files: { path: string; reason: string; priority: 'high' | 'medium' | 'low' }[];
  cached: boolean;
}> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  const result = await executeAiTask<{ files: { path: string; reason: string; priority: 'high' | 'medium' | 'low' }[] }>({
    taskName: 'suggest',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v1',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `You are helping a new developer understand this repository. Identify the 8-10 most important files to read, in the order that builds understanding most efficiently.

For each file, provide:
- path: exact file path from context (must exist in the file list)
- reason: a specific, technical explanation of WHY this file matters and what the developer will learn from it
- priority: "high" (read first), "medium" (read second), "low" (reference material)

Return JSON: { "files": [{ "path": string, "reason": string, "priority": "high"|"medium"|"low" }] }

Prioritize: entry points, core routers/controllers, main business logic, key data models. Avoid test files unless they reveal important patterns.

${buildRepoContext(analysis)}`,
    apiKey,
    json: true,
    mockFallback: () => {
      const branchSuffix = branch ? ` [${branch}]` : '';
      return {
        files: [
          { path: 'README.md', reason: `Project overview and setup${branchSuffix}`, priority: 'high' },
          { path: 'package.json', reason: `Dependencies and scripts${branchSuffix}`, priority: 'high' },
          { path: 'src/main.tsx', reason: `Application entry point${branchSuffix}`, priority: 'high' },
        ],
      };
    },
  });

  // Ensure files array exists
  const files = result.data.files ?? [];
  return { files, cached: result.cached };
}

export async function generateOnboarding(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{ steps: { title: string; description: string; filePath?: string }[]; cached: boolean }> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  const result = await executeAiTask<{ steps: { title: string; description: string; filePath?: string }[] }>({
    taskName: 'onboarding',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v1',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Create a 6-step onboarding walkthrough for a developer joining this project for the first time.

Each step should:
- Build logically on the previous step (start with the big picture, drill down progressively)
- Reference REAL, SPECIFIC files from the context
- Explain not just WHAT the file does, but HOW it fits into the execution flow
- Be written for a competent developer who needs context, not a beginner who needs hand-holding

Steps should follow this progression:
1. Project purpose & mental model (high level)
2. Entry point & startup sequence (where does execution begin?)
3. Core routing / request lifecycle
4. Main business logic / key service layer
5. State management / data layer
6. Configuration, testing, or deployment setup

Return JSON: { "steps": [{ "title": string, "description": string, "filePath"?: string }] }

${buildRepoContext(analysis)}`,
    apiKey,
    json: true,
    mockFallback: () => {
      const branchSuffix = branch ? ` on branch ${branch}` : '';
      return {
        steps: [
          { title: 'Read the README', description: `Understand project purpose and setup${branchSuffix}`, filePath: 'README.md' },
          { title: 'Explore package.json', description: `Review dependencies and scripts${branchSuffix}`, filePath: 'package.json' },
          { title: 'Start with src/', description: `Browse the main source directory${branchSuffix}`, filePath: 'src/' },
        ],
      };
    },
  });

  // Fallback for steps parsing issues
  const steps = result.data.steps ?? [
    { title: 'Overview', description: `Explore ${analysis.meta.fullName}`, filePath: 'README.md' },
    { title: 'Dependencies', description: 'Review project dependencies', filePath: analysis.importantFiles[0] },
    { title: 'Source', description: 'Browse the main source tree', filePath: 'src/' },
  ];

  return { steps, cached: result.cached };
}

export async function explainRepoELI5(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{ explanation: string; cached: boolean }> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  const result = await executeAiTask<string>({
    taskName: 'eli5',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v1',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Explain this repository to a developer who is smart but completely unfamiliar with this specific codebase.

Use a friendly, conversational tone — like a senior engineer giving a 5-minute tour before a pairing session. Structure your explanation as:

## What This Is
One clear, specific sentence about what the project does and who uses it.

## The Big Picture
How does it work end-to-end? Walk through the happy path from user action to result. Name real files and directories.

## Key Areas to Know
List 3-5 directories or files that are most important to understand, with a one-liner on what each does.

## Where to Start
If I had to read just 2-3 files to understand this codebase, which ones and why?

Keep it concrete. Every claim should reference real files from the context. Never be vague.

${buildRepoContext(analysis)}`,
    apiKey,
    json: false,
    mockFallback: () => {
      const branchSuffix = branch ? ` (reading branch: **${branch}**)` : '';
      return `### Welcome to the Repository! 👋\n\nThink of this project as a **smart digital map** of a codebase${branchSuffix}. It takes a repository URL, analyzes its contents, and draws a visual graph of files, folders, and dependencies.\n\nHere is the quick breakdown of how things flow:\n1. **The Entrance (Landing Page)**: You paste a GitHub URL in the search bar.\n2. **The Scanner (Backend)**: The app talks to the GitHub API, parses configuration manifests (like \`package.json\`), and maps dependencies.\n3. **The Painter (Frontend Canvas)**: React Flow builds an interactive graph where you can zoom, click, and inspect files.\n4. **The Helper (AI Intelligence)**: You can ask the AI to explain specific files or recommend clean refactoring suggestions.\n\n**Main entry points:**\n- \`src/main.tsx\`: Launches the React app.\n- \`server/api-router.ts\`: Handles all backend API requests.`;
    },
  });

  return { explanation: result.data, cached: result.cached };
}

export async function generateRefactorSuggestions(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{
  suggestions: { title: string; description: string; category: string; files: string[]; risk: 'high' | 'medium' | 'low' }[];
  cached: boolean;
}> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  const result = await executeAiTask<{ suggestions: { title: string; description: string; category: string; files: string[]; risk: 'high' | 'medium' | 'low' }[] }>({
    taskName: 'refactor',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v1',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `You are a principal engineer doing a code review of this repository. Identify the top 4-6 most impactful refactoring opportunities.

For each suggestion:
- Focus on REAL architectural issues visible from the file structure and dependencies
- Be specific: name exact files, explain the exact problem, and describe the concrete improvement
- Assign risk based on scope of change (high = touches many files/core paths, low = isolated)
- Categories: Architecture | Performance | DRY/Duplication | Coupling | Naming | Testing | Security | Scalability

Return JSON: { "suggestions": [{ "title": string, "description": string, "category": string, "files": string[], "risk": "high"|"medium"|"low" }] }

Only reference file paths that actually appear in the provided context. Do not invent files.

${buildRepoContext(analysis)}`,
    apiKey,
    json: true,
    mockFallback: () => {
      const branchSuffix = branch ? ` (analyzing branch: ${branch})` : '';
      const isTodoApp = repo.toLowerCase() !== 'gitsdm';
      if (isTodoApp) {
        return {
          suggestions: [
            {
              title: `Split TodoContext into Smaller Concerns${branchSuffix}`,
              description: 'TodoContext currently handles state, localStorage persistence, and API sync all in one place. Consider separating data fetching (useServerSync), local persistence (useLocalStorage), and UI state into distinct hooks.',
              category: 'Architecture',
              files: ['src/context/TodoContext.tsx', 'src/hooks/useLocalStorage.ts'],
              risk: 'medium'
            },
            {
              title: `Add Optimistic Updates for Toggle and Delete${branchSuffix}`,
              description: 'Currently toggling or deleting a todo waits for the server response before updating the UI. Implementing optimistic updates in TodoContext will make the app feel instant.',
              category: 'Performance',
              files: ['src/context/TodoContext.tsx', 'server/routes.js'],
              risk: 'low'
            },
            {
              title: `Extract Form Logic from TodoList${branchSuffix}`,
              description: 'TodoList.tsx handles both rendering the list and the add-todo form state. Extract the form into a dedicated AddTodoForm component to keep each file focused on a single responsibility.',
              category: 'DRY Principle',
              files: ['src/components/TodoList.tsx'],
              risk: 'low'
            }
          ],
        };
      }
      return {
        suggestions: [
          {
            title: `Centralize State Management in Zustand${branchSuffix}`,
            description: 'Right now, some components manage local states that overlap. Consider moving panel visibility states to the global VizState store.',
            category: 'State Management',
            files: ['src/pages/VizPage.tsx', 'src/components/viz/AISidebar.tsx'],
            risk: 'medium'
          },
          {
            title: `Centralize HTTP Utilities${branchSuffix}`,
            description: 'Duplicate fetch handling logic observed in server routers. Recommend centralizing custom json/error responders to the shared HTTP utility file.',
            category: 'DRY Principle',
            files: ['server/api-router.ts', 'server/utils/http.ts'],
            risk: 'low'
          },
          {
            title: `Optimize React Flow Graph Node Re-renders${branchSuffix}`,
            description: 'Custom nodes are re-rendering on hover, causing minor frame rate drops on large repositories. Wrap custom nodes with React.memo.',
            category: 'Performance',
            files: ['src/features/graph/nodes/index.tsx'],
            risk: 'high'
          }
        ],
      };
    },
  });

  const suggestions = result.data.suggestions ?? [
    {
      title: 'Centralize Configuration Management',
      description: 'Consider extracting scattered project configuration properties into a unified config provider.',
      category: 'Architecture',
      files: analysis.importantFiles.slice(0, 2),
      risk: 'medium'
    },
    {
      title: 'Review Modular Structure',
      description: 'Verify modular boundaries to prevent circular dependencies between components.',
      category: 'Coupling',
      files: analysis.importantFiles.slice(2, 4),
      risk: 'low'
    }
  ];

  return { suggestions, cached: result.cached };
}

export async function generateHealthReport(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{
  scores: { maintainability: number; modularity: number; readability: number; architecture: number; complexity: number };
  summary: string;
  cached: boolean;
}> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  const result = await executeAiTask<{
    scores: { maintainability: number; modularity: number; readability: number; architecture: number; complexity: number };
    summary: string;
  }>({
    taskName: 'health',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v1',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Perform a rigorous codebase health assessment. Score each dimension from 0-100 based on evidence from the actual file structure and dependencies:

- maintainability: How easy is it to change this codebase? (Consider: module size, separation of concerns, config clarity)
- modularity: How well-decomposed is the code? (Consider: directory structure, file count per concern, coupling indicators)
- readability: How easy is it to understand? (Consider: naming conventions, file organization, documentation presence)
- architecture: How sound is the overall design? (Consider: layer separation, entry points clarity, dependency direction)
- complexity: Inverse complexity — higher score means LESS complexity (Consider: file count, nesting depth, dependency count)

Be realistic and specific. A score of 85+ should only be given for genuinely exceptional quality. A typical mid-size project should score 60-80.

The summary (2-3 sentences) must reference specific observed strengths and weaknesses from the actual codebase.

Return JSON: { "scores": { "maintainability": number, "modularity": number, "readability": number, "architecture": number, "complexity": number }, "summary": string }

${buildRepoContext(analysis)}`,
    apiKey,
    json: true,
    mockFallback: () => {
      const branchSuffix = branch ? ` [branch: ${branch}]` : '';
      const isTodoApp = repo.toLowerCase() !== 'gitsdm';
      if (isTodoApp) {
        return {
          scores: { maintainability: 78, modularity: 72, readability: 85, architecture: 70, complexity: 88 },
          summary: `The todo-app${branchSuffix} is clean and readable with a straightforward component hierarchy. The main risk is that TodoContext is beginning to act as a monolithic state container — splitting concerns earlier will prevent it from becoming hard to maintain as features grow.`,
        };
      }
      return {
        scores: { maintainability: 88, modularity: 92, readability: 84, architecture: 90, complexity: 76 },
        summary: `The repository exhibits a highly structured framework${branchSuffix}. Components are cleanly separated by domain, and custom React Flow elements are compartmentalized. The addition of standard environment configurations and cached service interfaces indicates strong architecture quality.`,
      };
    },
  });

  const scores = result.data.scores ?? { maintainability: 80, modularity: 80, readability: 80, architecture: 80, complexity: 80 };
  const summary = result.data.summary ?? 'The codebase displays solid organization and moderate complexity.';

  return { scores, summary, cached: result.cached };
}

export async function generateMermaidDiagram(
  owner: string,
  repo: string,
  branch?: string,
  apiKey?: string,
  gitHubToken?: string,
  ctx?: RequestContext,
): Promise<{ diagram: string; cached: boolean }> {
  const analysis = await analyzeRepository({ owner, repo, branch }, ctx || gitHubToken);

  const result = await executeAiTask<string>({
    taskName: 'mermaid',
    owner,
    repo,
    sha: analysis.meta.sha,
    paramHash: 'v2',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Generate a beautiful, clean, and highly readable Mermaid.js architecture flowchart for this repository.
Follow these layout rules:
1. Use Left-to-Right layout (\`graph LR\`) for better readability and structure.
2. Group components logically into subgraphs (e.g., "Entry Points", "Controllers/Routers", "Services", "Utilities", "Database"). Keep subgraphs relatively compact.
3. Keep the number of nodes readable (around 15-20 total nodes max). Do not list every single file; focus on the main architectural blocks and core flows.
4. Classify nodes using these styles by adding class lines at the end of the diagram:
   - \`class NodeId entry;\` for entrypoints/gateways
   - \`class NodeId router;\` for routers/controllers/handlers
   - \`class NodeId service;\` for main business logic/services
   - \`class NodeId util;\` for utilities/helpers/parsers
   - \`class NodeId db;\` for database, cache, or external API integrations
   
Example format:
\`\`\`mermaid
graph LR
  subgraph EP ["Entry Points"]
    A[index.ts]
  end
  subgraph SRV ["Services"]
    B[api.ts]
  end
  A --> B
  
  class A entry;
  class B service;
\`\`\`

Output ONLY the mermaid code block wrapped in \`\`\`mermaid and \`\`\`. Do not add any text before or after.

${buildRepoContext(analysis)}`,
    apiKey,
    json: false,
    mockFallback: () => {
      const branchSuffix = branch ? ` (rendering branch: ${branch})` : '';
      return `\`\`\`mermaid\ngraph TD\n  User[Developer Browser] -->|Requests| Router[Vite Dev API Router]\n  Router -->|Parses GitHub| GitHubService[GitHub Tree Fetcher]\n  Router -->|Orchestrates AI| AIService[AI Provider Manager]\n  \n  GitHubService -->|Manifest Contents| DepParser[Dependency Analyzer]\n  GitHubService -->|File Tree| GraphBuilder[Graph Builder Engine]\n  \n  GraphBuilder -->|Positions Nodes| Layout[Dagre Layout Engine]\n  Layout -->|Graph Nodes & Edges| UI[React Flow Canvas View${branchSuffix}]\n  AIService -->|Markdown / JSON Summaries| UI\n\`\`\``;
    },
  });

  return { diagram: result.data, cached: result.cached };
}

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
      return `🔥 **The AI Repository Roast**\n\nOh, look! Another developer tool utilizing React Flow! Did you build this because reading directories in VS Code was too easy, or did you just want to feel like a sci-fi hacker zooming into a dependency tree${branchSuffix}?\n\nLet's look at the structure:\n- You have a directory named \`server\` and a directory named \`src\` inside the root. Nice separation of concerns, except Vite is running both as one giant middleware monster.\n- A custom LRU cache that lives in-memory on a Vercel serverless function... that's like putting a state-of-the-art vault inside a cardboard box that gets shredded every 15 minutes on cold starts.\n- TypeScript typings defined everywhere, yet half of the network payloads are still labeled \`any\` under the hood. "Type-safety" is more of a wish list than a feature here, isn't it?\n\n*Keep up the vibe-coding! At least the dark mode gradient looks absolutely beautiful.*`;
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
    userPrompt: `Create an enhanced, professional, and visually stunning README.md for this repository.
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
      return `# 🔮 gitSdm — AI-Powered Repository Intelligence Platform${branchSuffix}\n\n> Instantly visualize, understand, and optimize codebase architecture.\n\n[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)\n[![GitHub Stars](https://img.shields.io/github/stars/bayue48/gitSdm?style=flat&color=violet)](https://github.com/bayue48/gitSdm)\n[![MIT License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)\n\n---\n\n## 🚀 Key Features\n\n* **Interactive Codebase Mapping**: Glowing node visualizer highlighting configurations, tests, source files, and dependencies.\n* **AI Architecture Summaries**: Understand module interaction, entry points, and systems flow instantly.\n* **ELI5 mode**: Perfect for onboarding new engineers on complex, multi-layered codebases.\n* **Health Dashboard & Refactoring**: Discover bottlenecks, coupled modules, and code duplication before they hit production.\n* **Mermaid Flowchart Generator**: Instantly export visual diagrams to copy-paste into internal developer wikis.\n\n---\n\n## 🛠️ Tech Stack\n\n- **Frontend**: React, TypeScript, Tailwind CSS, React Flow, Zustand, Framer Motion\n- **Backend**: Node.js API Router, Octokit, Google Gemini API\n`;
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
    userPrompt: `Analyze this repository and return a comprehensive onboarding intelligence JSON with this exact shape:
{
  "mentalModel": {
    "type": "Architecture Type (e.g. Layered MVC, Event-Driven, Pipeline, Modular Service, Layered Frontend)",
    "concept": "1-sentence tagline describing the repository's core flow",
    "description": "2-3 sentences explaining the overarching mental model of this codebase to help a new developer."
  },
  "recommendedPath": [
    {
      "path": "exact file path from the repository files list (must exist!)",
      "importance": 0-100 score of how important this file is to read first,
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

Choose 5-8 of the most critical files for recommendedPath, sorted by suggested reading order (highest priority first).
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
            description: `This is an offline-first Todo app${branchSuffix}. The React frontend manages state via TodoContext and persists data with useLocalStorage. A lightweight Express backend (server/) provides a REST API for syncing todos to a simple JSON database.`
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
            'New contributors should first look at how data flows from analyze-repo.ts into graph-builder.ts.',
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

export type { RepoAnalysis };
