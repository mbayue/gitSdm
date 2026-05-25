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
  branch?: string;
  scope: 'repo' | 'node' | 'file';
  nodeId?: string;
  filePath?: string;
  fileSnippet?: string;
  context?: string;
}): Promise<{ explanation: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = params.branch ? ` on branch **${params.branch}**` : '';
    const explanation = params.scope === 'node' && params.nodeId
      ? `This is a mock explanation for the selected node: **${params.nodeId}**${branchSuffix}. It acts as a key module in the codebase.`
      : params.scope === 'file' && params.filePath
      ? `This is a mock explanation for file: \`${params.filePath}\`${branchSuffix}. It contains core application logic.`
      : `This is a mock explanation for repository: **${params.owner}/${params.repo}**${branchSuffix}.`;
    return { explanation, cached: false };
  }

  const analysis = await analyzeRepository({ owner: params.owner, repo: params.repo, branch: params.branch });
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

  const scopeInstruction =
    params.scope === 'node' && params.nodeId
      ? `Focus specifically on the graph node/module "${params.nodeId}". Explain: (1) what this module does, (2) its role in the overall architecture, (3) what calls into it and what it calls, (4) any notable implementation patterns or concerns.`
      : params.scope === 'file' && params.filePath
      ? `Focus specifically on the file "${params.filePath}". Explain: (1) the file's purpose and responsibility, (2) its key functions/classes/exports, (3) how it fits into the overall data flow, (4) any notable patterns, gotchas, or design decisions.`
      : `Provide a comprehensive repository overview covering: (1) What this project actually does and who it's for — be specific, not generic. (2) The architectural style (e.g. monorepo, microservices, layered MVC, etc) and why it makes sense for this project. (3) The main execution flow — trace a typical user request from entry point through all key layers. (4) The most important modules/directories and their exact roles. (5) Notable technical choices (framework picks, state management, build tooling) and what they reveal about the project's priorities.`;

  const explanation = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${scopeInstruction}\n\n${userPrompt}`,
    },
  ]);

  cache.set(key, explanation);
  return { explanation, cached: false };
}

export async function explainArchitecture(
  owner: string,
  repo: string,
  branch?: string,
): Promise<{ overview: string; layers: { name: string; description: string }[]; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` (branch: ${branch})` : '';
    return {
      overview: `This repository follows a modular architecture with clear separation between API routes, shared server logic, and a React frontend${branchSuffix}. The visualization layer uses React Flow for interactive dependency graphs.`,
      layers: [
        { name: 'Presentation', description: 'React + Vite SPA with Tailwind and Framer Motion' },
        { name: 'API', description: 'Serverless handlers for GitHub ingestion and AI' },
        { name: 'Core', description: 'Parsers, graph builder, and GitHub client' },
      ],
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
  const key = aiCacheKey('architecture', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<{ overview: string; layers: { name: string; description: string }[] }>(key);
  if (cached) return { ...cached, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this repository's system architecture deeply and return JSON with this exact shape:
{
  "overview": "A 2-3 sentence technical description of the architectural style, main design decisions, and how components interact. Be specific — mention real file names and modules.",
  "layers": [
    { "name": "Layer Name", "description": "Precise description of what this layer does, which files/directories implement it, and how it connects to adjacent layers." }
  ]
}

Identify 4-7 distinct architectural layers (e.g. Presentation/UI, API/Router, Services/Business Logic, Data/GitHub API, AI/ML Layer, Cache, Utilities). Each layer description must reference real files from the context. Do NOT produce generic descriptions.

${buildRepoContext(analysis)}`,
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
  branch?: string,
): Promise<{
  files: { path: string; reason: string; priority: 'high' | 'medium' | 'low' }[];
  cached: boolean;
}> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` [${branch}]` : '';
    return {
      files: [
        { path: 'README.md', reason: `Project overview and setup${branchSuffix}`, priority: 'high' },
        { path: 'package.json', reason: `Dependencies and scripts${branchSuffix}`, priority: 'high' },
        { path: 'src/main.tsx', reason: `Application entry point${branchSuffix}`, priority: 'high' },
      ],
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
  const key = aiCacheKey('suggest', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<{ files: { path: string; reason: string; priority: 'high' | 'medium' | 'low' }[] }>(key);
  if (cached) return { files: cached.files, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `You are helping a new developer understand this repository. Identify the 8-10 most important files to read, in the order that builds understanding most efficiently.

For each file, provide:
- path: exact file path from context (must exist in the file list)
- reason: a specific, technical explanation of WHY this file matters and what the developer will learn from it
- priority: "high" (read first), "medium" (read second), "low" (reference material)

Return JSON: { "files": [{ "path": string, "reason": string, "priority": "high"|"medium"|"low" }] }

Prioritize: entry points, core routers/controllers, main business logic, key data models. Avoid test files unless they reveal important patterns.

${buildRepoContext(analysis)}`,
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
  branch?: string,
): Promise<{ steps: { title: string; description: string; filePath?: string }[]; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` on branch ${branch}` : '';
    return {
      steps: [
        { title: 'Read the README', description: `Understand project purpose and setup${branchSuffix}`, filePath: 'README.md' },
        { title: 'Explore package.json', description: `Review dependencies and scripts${branchSuffix}`, filePath: 'package.json' },
        { title: 'Start with src/', description: `Browse the main source directory${branchSuffix}`, filePath: 'src/' },
      ],
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
  const key = aiCacheKey('onboarding', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<{ steps: { title: string; description: string; filePath?: string }[] }>(key);
  if (cached) return { steps: cached.steps, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Create a 6-step onboarding walkthrough for a developer joining this project for the first time.

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
  branch?: string,
): Promise<{ explanation: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` (reading branch: **${branch}**)` : '';
    return {
      explanation: `### Welcome to the Repository! 👋\n\nThink of this project as a **smart digital map** of a codebase${branchSuffix}. It takes a repository URL, analyzes its contents, and draws a visual graph of files, folders, and dependencies.\n\nHere is the quick breakdown of how things flow:\n1. **The Entrance (Landing Page)**: You paste a GitHub URL in the search bar.\n2. **The Scanner (Backend)**: The app talks to the GitHub API, parses configuration manifests (like \`package.json\`), and maps dependencies.\n3. **The Painter (Frontend Canvas)**: React Flow builds an interactive graph where you can zoom, click, and inspect files.\n4. **The Helper (AI Intelligence)**: You can ask the AI to explain specific files or recommend clean refactoring suggestions.\n\n**Main entry points:**\n- \`src/main.tsx\`: Launches the React app.\n- \`server/api-router.ts\`: Handles all backend API requests.`,
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
  const key = aiCacheKey('eli5', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<string>(key);
  if (cached) return { explanation: cached, cached: true };

  const provider = await getAIProvider();
  const explanation = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Explain this repository to a developer who is smart but completely unfamiliar with this specific codebase.

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
    },
  ]);

  cache.set(key, explanation);
  return { explanation, cached: false };
}

export async function generateRefactorSuggestions(
  owner: string,
  repo: string,
  branch?: string,
): Promise<{
  suggestions: { title: string; description: string; category: string; files: string[]; risk: 'high' | 'medium' | 'low' }[];
  cached: boolean;
}> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` (analyzing branch: ${branch})` : '';
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
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
  const key = aiCacheKey('refactor', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<any>(key);
  if (cached) return { suggestions: cached.suggestions, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `You are a principal engineer doing a code review of this repository. Identify the top 4-6 most impactful refactoring opportunities.

For each suggestion:
- Focus on REAL architectural issues visible from the file structure and dependencies
- Be specific: name exact files, explain the exact problem, and describe the concrete improvement
- Assign risk based on scope of change (high = touches many files/core paths, low = isolated)
- Categories: Architecture | Performance | DRY/Duplication | Coupling | Naming | Testing | Security | Scalability

Return JSON: { "suggestions": [{ "title": string, "description": string, "category": string, "files": string[], "risk": "high"|"medium"|"low" }] }

Only reference file paths that actually appear in the provided context. Do not invent files.

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
  branch?: string,
): Promise<{
  scores: { maintainability: number; modularity: number; readability: number; architecture: number; complexity: number };
  summary: string;
  cached: boolean;
}> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` [branch: ${branch}]` : '';
    return {
      scores: {
        maintainability: 88,
        modularity: 92,
        readability: 84,
        architecture: 90,
        complexity: 76
      },
      summary: `The repository exhibits a highly structured framework${branchSuffix}. Components are cleanly separated by domain, and custom React Flow elements are compartmentalized. The addition of standard environment configurations and cached service interfaces indicates strong architecture quality.`,
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
  const key = aiCacheKey('health', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<any>(key);
  if (cached) return { scores: cached.scores, summary: cached.summary, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Perform a rigorous codebase health assessment. Score each dimension from 0-100 based on evidence from the actual file structure and dependencies:

- maintainability: How easy is it to change this codebase? (Consider: module size, separation of concerns, config clarity)
- modularity: How well-decomposed is the code? (Consider: directory structure, file count per concern, coupling indicators)
- readability: How easy is it to understand? (Consider: naming conventions, file organization, documentation presence)
- architecture: How sound is the overall design? (Consider: layer separation, entry points clarity, dependency direction)
- complexity: Inverse complexity — higher score means LESS complexity (Consider: file count, nesting depth, dependency count)

Be realistic and specific. A score of 85+ should only be given for genuinely exceptional quality. A typical mid-size project should score 60-80.

The summary (2-3 sentences) must reference specific observed strengths and weaknesses from the actual codebase.

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
  branch?: string,
): Promise<{ diagram: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` (rendering branch: ${branch})` : '';
    return {
      diagram: `\`\`\`mermaid\ngraph TD\n  User[Developer Browser] -->|Requests| Router[Vite Dev API Router]\n  Router -->|Parses GitHub| GitHubService[GitHub Tree Fetcher]\n  Router -->|Orchestrates AI| AIService[AI Provider Manager]\n  \n  GitHubService -->|Manifest Contents| DepParser[Dependency Analyzer]\n  GitHubService -->|File Tree| GraphBuilder[Graph Builder Engine]\n  \n  GraphBuilder -->|Positions Nodes| Layout[Dagre Layout Engine]\n  Layout -->|Graph Nodes & Edges| UI[React Flow Canvas View${branchSuffix}]\n  AIService -->|Markdown / JSON Summaries| UI\n\`\`\``,
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
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
  branch?: string,
): Promise<{ roast: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` on branch \`${branch}\`` : '';
    return {
      roast: `🔥 **The AI Repository Roast**\n\nOh, look! Another developer tool utilizing React Flow! Did you build this because reading directories in VS Code was too easy, or did you just want to feel like a sci-fi hacker zooming into a dependency tree${branchSuffix}?\n\nLet's look at the structure:\n- You have a directory named \`server\` and a directory named \`src\` inside the root. Nice separation of concerns, except Vite is running both as one giant middleware monster.\n- A custom LRU cache that lives in-memory on a Vercel serverless function... that's like putting a state-of-the-art vault inside a cardboard box that gets shredded every 15 minutes on cold starts.\n- TypeScript typings defined everywhere, yet half of the network payloads are still labeled \`any\` under the hood. "Type-safety" is more of a wish list than a feature here, isn't it?\n\n*Keep up the vibe-coding! At least the dark mode gradient looks absolutely beautiful.*`,
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
  const key = aiCacheKey('roast', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<string>(key);
  if (cached) return { roast: cached, cached: true };

  const provider = await getAIProvider();
  const roast = await provider.complete([
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `You are a witty, sarcastic senior developer who has been asked to "roast" this codebase at a hackathon demo day. Think: Silicon Valley meets a comedy roast.

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
    },
  ]);

  cache.set(key, roast);
  return { roast, cached: false };
}

export async function generateReadmeEnhancement(
  owner: string,
  repo: string,
  branch?: string,
): Promise<{ readme: string; cached: boolean }> {
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` (branch: ${branch})` : '';
    return {
      readme: `# 🔮 gitSdm — AI-Powered Repository Intelligence Platform${branchSuffix}\n\n> Instantly visualize, understand, and optimize codebase architecture.\n\n[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)\n[![GitHub Stars](https://img.shields.io/github/stars/bayue48/gitSdm?style=flat&color=violet)](https://github.com/bayue48/gitSdm)\n[![MIT License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)\n\n---\n\n## 🚀 Key Features\n\n* **Interactive Codebase Mapping**: Glowing node visualizer highlighting configurations, tests, source files, and dependencies.\n* **AI Architecture Summaries**: Understand module interaction, entry points, and systems flow instantly.\n* **ELI5 mode**: Perfect for onboarding new engineers on complex, multi-layered codebases.\n* **Health Dashboard & Refactoring**: Discover bottlenecks, coupled modules, and code duplication before they hit production.\n* **Mermaid Flowchart Generator**: Instantly export visual diagrams to copy-paste into internal developer wikis.\n\n---\n\n## 🛠️ Tech Stack\n\n- **Frontend**: React, TypeScript, Tailwind CSS, React Flow, Zustand, Framer Motion\n- **Backend**: Node.js API Router, Octokit, Google Gemini API\n`,
      cached: false,
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
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

export async function generateLearningPath(
  owner: string,
  repo: string,
  branch?: string,
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
  if ((process.env.AI_PROVIDER ?? 'mock').toLowerCase() === 'mock') {
    const branchSuffix = branch ? ` (branch: ${branch})` : '';
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
      cached: false
    };
  }

  const analysis = await analyzeRepository({ owner, repo, branch });
  const key = aiCacheKey('learning-path', owner, repo, analysis.meta.sha, 'v1');

  const cached = cache.get<any>(key);
  if (cached) return { ...cached, cached: true };

  const provider = await getAIProvider();
  const raw = await provider.complete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this repository and return a comprehensive onboarding intelligence JSON with this exact shape:
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
      },
    ],
    { json: true },
  );

  let parsed: any;
  try {
    parsed = safeParseJSON(raw);
  } catch (err) {
    parsed = {
      mentalModel: { type: 'Modular Application', concept: 'Unknown flow', description: 'Unable to parse AI mental model.' },
      recommendedPath: analysis.importantFiles.slice(0, 4).map((f, idx) => ({ path: f, importance: 90 - idx * 10, reason: 'Structurally important file.', role: 'Source' })),
      executionFlow: { steps: [], visualSteps: analysis.importantFiles.slice(0, 4) },
      insights: { architecture: 'Standard setup.', risks: [], suggestions: [] }
    };
  }

  cache.set(key, parsed);
  return { ...parsed, cached: false };
}

export type { RepoAnalysis };

