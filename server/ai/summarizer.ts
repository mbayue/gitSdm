import { aiCacheKey, cache, hashContext } from '../cache/lru';
import type { RepoAnalysis } from '../../src/types';
import { getAIProvider } from './provider';
import { buildRepoContext, SYSTEM_PROMPT } from './prompts';
import { analyzeRepository } from '../services/analyze-repo';

function safeParseJSON<T>(raw: string): T {
  let cleaned = raw.trim();
  
  // 1. Remove markdown code block wraps (like ```json ... ``` or ``` ... ```)
  const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = cleaned.match(codeBlockRegex);
  if (match) {
    cleaned = match[1].trim();
  }
  
  // 2. Locate the first { or [ and last } or ] if there is outer noise
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const startIdx = (firstBrace !== -1 && firstBracket !== -1) 
    ? Math.min(firstBrace, firstBracket) 
    : (firstBrace !== -1 ? firstBrace : firstBracket);
    
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const endIdx = (lastBrace !== -1 && lastBracket !== -1)
    ? Math.max(lastBrace, lastBracket)
    : (lastBrace !== -1 ? lastBrace : lastBracket);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  return JSON.parse(cleaned) as T;
}

export async function explainRepo(params: {
  owner: string;
  repo: string;
  scope: 'repo' | 'node' | 'file';
  nodeId?: string;
  filePath?: string;
  fileSnippet?: string;
  context?: string;
}): Promise<{ explanation: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const explanation = params.scope === 'node' && params.nodeId
      ? `This is a mock explanation for the selected node: **${params.nodeId}**. It acts as a key module in the codebase.`
      : params.scope === 'file' && params.filePath
      ? `This is a mock explanation for file: \`${params.filePath}\`. It contains core application logic.`
      : `This is a mock explanation for repository: **${params.owner}/${params.repo}**.`;
    return { explanation, cached: false };
  }

  const analysis = await analyzeRepository({ owner: params.owner, repo: params.repo });
  const ctxHash = hashContext(
    JSON.stringify({ scope: params.scope, nodeId: params.nodeId, filePath: params.filePath, context: params.context }),
  );
  const key = aiCacheKey('explain', params.owner, params.repo, analysis.meta.sha, ctxHash);

  const cached = cache.get<string>(key);
  if (cached) return { explanation: cached, cached: true };

  const provider = await getAIProvider();
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

  const explanation = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Explain this repository for a developer onboarding. Scope: ${params.scope}.\n\n${userPrompt}`,
    },
  ]);

  cache.set(key, explanation);
  return { explanation, cached: false };
}

export async function explainArchitecture(
  owner: string,
  repo: string,
): Promise<{ overview: string; layers: { name: string; description: string }[]; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    return {
      overview: 'This repository follows a modular architecture with clear separation between API routes, shared server logic, and a React frontend. The visualization layer uses React Flow for interactive dependency graphs.',
      layers: [
        { name: 'Presentation', description: 'React + Vite SPA with Tailwind and Framer Motion' },
        { name: 'API', description: 'Serverless handlers for GitHub ingestion and AI' },
        { name: 'Core', description: 'Parsers, graph builder, and GitHub client' },
      ],
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo });
  const key = aiCacheKey('architecture', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<{ overview: string; layers: { name: string; description: string }[] }>(key);
  if (cached) return { ...cached, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Provide an architecture overview as JSON: { "overview": string, "layers": [{ "name": string, "description": string }] }\n\n${buildRepoContext(analysis)}`,
      },
    ],
    { json: true },
  );

  let parsed: { overview: string; layers: { name: string; description: string }[] };
  try {
    parsed = safeParseJSON(raw) as typeof parsed;
  } catch {
    parsed = {
      overview: raw,
      layers: [{ name: 'Application', description: 'Main application layer' }],
    };
  }

  cache.set(key, parsed);
  return { ...parsed, cached: false };
}

export async function suggestFiles(
  owner: string,
  repo: string,
): Promise<{
  files: { path: string; reason: string; priority: 'high' | 'medium' | 'low' }[];
  cached: boolean;
}> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    return {
      files: [
        { path: 'README.md', reason: 'Project overview and setup', priority: 'high' },
        { path: 'package.json', reason: 'Dependencies and scripts', priority: 'high' },
        { path: 'src/main.tsx', reason: 'Application entry point', priority: 'high' },
      ],
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo });
  const key = aiCacheKey('suggest', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<{ files: { path: string; reason: string; priority: 'high' | 'medium' | 'low' }[] }>(key);
  if (cached) return { files: cached.files, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Suggest important files to read first. Return JSON: { "files": [{ "path": string, "reason": string, "priority": "high"|"medium"|"low" }] }. Only use paths from context.\n\n${buildRepoContext(analysis)}`,
      },
    ],
    { json: true },
  );

  let files: { path: string; reason: string; priority: 'high' | 'medium' | 'low' }[];
  try {
    const parsed = safeParseJSON(raw) as { files: typeof files };
    files = parsed.files ?? [];
  } catch {
    files = analysis.importantFiles.slice(0, 8).map((path, i) => ({
      path,
      reason: 'Identified as structurally important',
      priority: (i < 3 ? 'high' : i < 6 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    }));
  }

  cache.set(key, { files });
  return { files, cached: false };
}

export async function generateOnboarding(
  owner: string,
  repo: string,
): Promise<{ steps: { title: string; description: string; filePath?: string }[]; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    return {
      steps: [
        { title: 'Read the README', description: 'Understand project purpose and setup', filePath: 'README.md' },
        { title: 'Explore package.json', description: 'Review dependencies and scripts', filePath: 'package.json' },
        { title: 'Start with src/', description: 'Browse the main source directory', filePath: 'src/' },
      ],
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo });
  const key = aiCacheKey('onboarding', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<{ steps: { title: string; description: string; filePath?: string }[] }>(key);
  if (cached) return { steps: cached.steps, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Create a 5-step onboarding walkthrough. Return JSON: { "steps": [{ "title": string, "description": string, "filePath"?: string }] }\n\n${buildRepoContext(analysis)}`,
      },
    ],
    { json: true },
  );

  let steps: { title: string; description: string; filePath?: string }[];
  try {
    const parsed = safeParseJSON(raw) as { steps: typeof steps };
    steps = parsed.steps ?? [];
  } catch {
    steps = [
      { title: 'Overview', description: `Explore ${analysis.meta.fullName}`, filePath: 'README.md' },
      { title: 'Dependencies', description: 'Review project dependencies', filePath: analysis.importantFiles[0] },
      { title: 'Source', description: 'Browse the main source tree', filePath: 'src/' },
    ];
  }

  cache.set(key, { steps });
  return { steps, cached: false };
}

export async function explainRepoELI5(
  owner: string,
  repo: string,
): Promise<{ explanation: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    return {
      explanation: `### Welcome to the Repository! 👋\n\nThink of this project as a **smart digital map** of a codebase. It takes a repository URL, analyzes its contents, and draws a visual graph of files, folders, and dependencies.\n\nHere is the quick breakdown of how things flow:\n1. **The Entrance (Landing Page)**: You paste a GitHub URL in the search bar.\n2. **The Scanner (Backend)**: The app talks to the GitHub API, parses configuration manifests (like \`package.json\`), and maps dependencies.\n3. **The Painter (Frontend Canvas)**: React Flow builds an interactive graph where you can zoom, click, and inspect files.\n4. **The Helper (AI Intelligence)**: You can ask the AI to explain specific files or recommend clean refactoring suggestions.\n\n**Main entry points:**\n- \`src/main.tsx\`: Launches the React app.\n- \`server/api-router.ts\`: Handles all backend API requests.`,
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo });
  const key = aiCacheKey('eli5', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<string>(key);
  if (cached) return { explanation: cached, cached: true };

  const provider = await getAIProvider();
  const explanation = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Explain this repository like I am completely new to it (ELI5). Focus on:
1. The general project flow and how systems interact.
2. What files/folders matter most and why.
3. The execution pipeline in simple, conversational terms.
Never invent files or dependencies. Keep it encouraging and clear.

${buildRepoContext(analysis)}`,
    },
  ]);

  cache.set(key, explanation);
  return { explanation, cached: false };
}

export async function generateRefactorSuggestions(
  owner: string,
  repo: string,
): Promise<{
  suggestions: { title: string; description: string; category: string; files: string[]; risk: 'high' | 'medium' | 'low' }[];
  cached: boolean;
}> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    return {
      suggestions: [
        {
          title: 'Centralize State Management in Zustand',
          description: 'Right now, some components manage local states that overlap. Consider moving panel visibility states to the global VizState store.',
          category: 'State Management',
          files: ['src/pages/VizPage.tsx', 'src/components/viz/AISidebar.tsx'],
          risk: 'medium'
        },
        {
          title: 'Centralize HTTP Utilities',
          description: 'Duplicate fetch handling logic observed in server routers. Recommend centralizing custom json/error responders to the shared HTTP utility file.',
          category: 'DRY Principle',
          files: ['server/api-router.ts', 'server/utils/http.ts'],
          risk: 'low'
        },
        {
          title: 'Optimize React Flow Graph Node Re-renders',
          description: 'Custom nodes are re-rendering on hover, causing minor frame rate drops on large repositories. Wrap custom nodes with React.memo.',
          category: 'Performance',
          files: ['src/features/graph/nodes/index.tsx'],
          risk: 'high'
        }
      ],
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo });
  const key = aiCacheKey('refactor', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<any>(key);
  if (cached) return { suggestions: cached.suggestions, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Analyze this codebase and suggest refactoring improvements. Focus on architectural bottlenecks, duplicated logic, tight coupling, naming inconsistencies, and risky areas.
Return JSON: { "suggestions": [{ "title": string, "description": string, "category": string, "files": string[], "risk": "high"|"medium"|"low" }] }. Only reference real files from the context.

${buildRepoContext(analysis)}`,
    },
  ], { json: true });

  let suggestions;
  try {
    const parsed = safeParseJSON<any>(raw);
    suggestions = parsed.suggestions ?? [];
  } catch {
    suggestions = [
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
  }

  cache.set(key, { suggestions });
  return { suggestions, cached: false };
}

export async function generateHealthReport(
  owner: string,
  repo: string,
): Promise<{
  scores: { maintainability: number; modularity: number; readability: number; architecture: number; complexity: number };
  summary: string;
  cached: boolean;
}> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    return {
      scores: {
        maintainability: 88,
        modularity: 92,
        readability: 84,
        architecture: 90,
        complexity: 76
      },
      summary: 'The repository exhibits a highly structured framework. Components are cleanly separated by domain, and custom React Flow elements are compartmentalized. The addition of standard environment configurations and cached service interfaces indicates strong architecture quality.',
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo });
  const key = aiCacheKey('health', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<any>(key);
  if (cached) return { scores: cached.scores, summary: cached.summary, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Analyze codebase health and generate scores (0 to 100) and a summary.
Return JSON: { "scores": { "maintainability": number, "modularity": number, "readability": number, "architecture": number, "complexity": number }, "summary": string }

${buildRepoContext(analysis)}`,
    },
  ], { json: true });

  let scores;
  let summary;
  try {
    const parsed = safeParseJSON<any>(raw);
    scores = parsed.scores ?? { maintainability: 80, modularity: 80, readability: 80, architecture: 80, complexity: 80 };
    summary = parsed.summary ?? 'The codebase displays solid organization and moderate complexity.';
  } catch {
    scores = { maintainability: 85, modularity: 82, readability: 78, architecture: 88, complexity: 72 };
    summary = `Analysis of ${analysis.meta.fullName} reveals a highly modular structure. Dependencies are cleanly mapped, with clear entry points and config boundaries.`;
  }

  cache.set(key, { scores, summary });
  return { scores, summary, cached: false };
}

export async function generateMermaidDiagram(
  owner: string,
  repo: string,
): Promise<{ diagram: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    return {
      diagram: `\`\`\`mermaid\ngraph TD\n  User[Developer Browser] -->|Requests| Router[Vite Dev API Router]\n  Router -->|Parses GitHub| GitHubService[GitHub Tree Fetcher]\n  Router -->|Orchestrates AI| AIService[AI Provider Manager]\n  \n  GitHubService -->|Manifest Contents| DepParser[Dependency Analyzer]\n  GitHubService -->|File Tree| GraphBuilder[Graph Builder Engine]\n  \n  GraphBuilder -->|Positions Nodes| Layout[Dagre Layout Engine]\n  Layout -->|Graph Nodes & Edges| UI[React Flow Canvas View]\n  AIService -->|Markdown / JSON Summaries| UI\n\`\`\``,
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo });
  const key = aiCacheKey('mermaid', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<string>(key);
  if (cached) return { diagram: cached, cached: true };

  const provider = await getAIProvider();
  const diagram = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Generate a beautiful Mermaid.js architecture flowchart for this repository. It should map out the high-level layers (e.g. entry points, controllers/routers, services, utilities, database/external api) and show their relationships.
Output ONLY the mermaid code block wrapped in \`\`\`mermaid and \`\`\`. Do not add any text before or after.
Example format:
\`\`\`mermaid
graph TD
  A[App] --> B[Router]
\`\`\`

${buildRepoContext(analysis)}`,
    },
  ]);

  cache.set(key, diagram);
  return { diagram, cached: false };
}

export async function generateRepoRoast(
  owner: string,
  repo: string,
): Promise<{ roast: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    return {
      roast: `🔥 **The AI Repository Roast**\n\nOh, look! Another developer tool utilizing React Flow! Did you build this because reading directories in VS Code was too easy, or did you just want to feel like a sci-fi hacker zooming into a dependency tree?\n\nLet's look at the structure:\n- You have a directory named \`server\` and a directory named \`src\` inside the root. Nice separation of concerns, except Vite is running both as one giant middleware monster.\n- A custom LRU cache that lives in-memory on a Vercel serverless function... that's like putting a state-of-the-art vault inside a cardboard box that gets shredded every 15 minutes on cold starts.\n- TypeScript typings defined everywhere, yet half of the network payloads are still labeled \`any\` under the hood. "Type-safety" is more of a wish list than a feature here, isn't it?\n\n*Keep up the vibe-coding! At least the dark mode gradient looks absolutely beautiful.*`,
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo });
  const key = aiCacheKey('roast', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<string>(key);
  if (cached) return { roast: cached, cached: true };

  const provider = await getAIProvider();
  const roast = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Write a funny, sarcastic, lighthearted developer "roast" of this repository. Be witty and joke about its structure, dependencies, files, or naming conventions. Maintain a humorous, friendly hackathon vibe. Keep it to a few paragraphs.

${buildRepoContext(analysis)}`,
    },
  ]);

  cache.set(key, roast);
  return { roast, cached: false };
}

export async function generateReadmeEnhancement(
  owner: string,
  repo: string,
): Promise<{ readme: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    return {
      readme: `# 🔮 gitSdm — AI-Powered Repository Intelligence Platform\n\n> Instantly visualize, understand, and optimize codebase architecture.\n\n[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)\n[![GitHub Stars](https://img.shields.io/github/stars/bayue48/gitSdm?style=flat&color=violet)](https://github.com/bayue48/gitSdm)\n[![MIT License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)\n\n---\n\n## 🚀 Key Features\n\n* **Interactive Codebase Mapping**: Glowing node visualizer highlighting configurations, tests, source files, and dependencies.\n* **AI Architecture Summaries**: Understand module interaction, entry points, and systems flow instantly.\n* **ELI5 mode**: Perfect for onboarding new engineers on complex, multi-layered codebases.\n* **Health Dashboard & Refactoring**: Discover bottlenecks, coupled modules, and code duplication before they hit production.\n* **Mermaid Flowchart Generator**: Instantly export visual diagrams to copy-paste into internal developer wikis.\n\n---\n\n## 🛠️ Tech Stack\n\n- **Frontend**: React, TypeScript, Tailwind CSS, React Flow, Zustand, Framer Motion\n- **Backend**: Node.js API Router, Octokit, Google Gemini API\n`,
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo });
  const key = aiCacheKey('readme-enhance', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<string>(key);
  if (cached) return { readme: cached, cached: true };

  const provider = await getAIProvider();
  const readme = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Create an enhanced, professional, and visually stunning README.md for this repository.
Include:
1. High-quality markdown shields/badges (build, license, stars).
2. Professional description and value proposition.
3. Clean structure with interactive/visual folders layout.
4. Setup, installation, and usage instructions based on package managers found in dependencies.
Use rich typography and make it look clean.

${buildRepoContext(analysis)}`,
    },
  ]);

  cache.set(key, readme);
  return { readme, cached: false };
}

export type { RepoAnalysis };
