import { hashContext } from '../../cache/lru';
import type { RequestContext } from '../../utils/context';
import { buildRepoContext, SYSTEM_PROMPT } from '../prompts';
import { analyzeRepository } from '../../services/analyze-repo';
import { executeAiTask } from '../service';

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
    eli5?: boolean;
  },
  ctx?: RequestContext,
): Promise<{ explanation: string; cached: boolean }> {
  const analysis = await analyzeRepository({ owner: params.owner, repo: params.repo, branch: params.branch }, ctx || params.gitHubToken);
  const ctxHash = hashContext(
    JSON.stringify({ scope: params.scope, nodeId: params.nodeId, filePath: params.filePath, context: params.context, eli5: params.eli5 }),
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

  let scopeInstruction =
    params.scope === 'node' && params.nodeId
      ? `Focus specifically on the graph node/module "${params.nodeId}". Structure your explanation with these exact markdown headings:
### What this does
(1-2 sentences explaining its purpose)

### Why it matters
(1-2 sentences on its role in the architecture)

### Where to look next
(1-2 sentences on what calls this or what this calls)

### Related files
(bullet list of 1-3 related file paths as inline \`code\`)`
      : params.scope === 'file' && params.filePath
      ? `Focus specifically on the file "${params.filePath}". Structure your explanation with these exact markdown headings:
### What this does
(1-2 sentences explaining its purpose)

### Why it matters
(1-2 sentences on its role in the data flow)

### Where to look next
(1-2 sentences on what to read after this)

### Related files
(bullet list of 1-3 related file paths as inline \`code\`)`
      : `Provide a detailed repository overview covering: (1) What this project actually does and who it's for — be specific, not generic. (2) The architectural style (e.g. monorepo, microservices, layered MVC, etc) and why it makes sense for this project. (3) The main execution flow — trace a typical user request from entry point through all key layers. (4) The most important modules/directories and their exact roles. (5) Notable technical choices (framework picks, state management, build tooling) and what they reveal about the project's priorities.`;

  if (params.eli5) {
    scopeInstruction += `\n\nExplain this in an extremely simple, friendly, and easy-to-understand way (ELI5 - Explain Like I'm 5 style) for a junior developer or a beginner. Use clear analogies, avoid dense jargon where possible (or explain it simply), and keep the tone conversational.`;
  }

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
      if (params.eli5) {
        return params.scope === 'node' && params.nodeId
          ? `### Node: **${params.nodeId}** 🛠️\n\nThink of this node as a friendly neighborhood assistant. Its main job is to help the rest of the application talk to other parts smoothly, like a postman delivering letters!`
          : params.scope === 'file' && params.filePath
          ? `### File: **${params.filePath}** 📝\n\nThis file is like a cooking recipe. It lists the steps and ingredients needed to make a specific part of the app work, keeping it super simple and neat!`
          : `### Repo: **${params.owner}/${params.repo}** 🔮\n\nThis codebase is like a beautiful digital map. It scans repository files and draws an interactive layout so you can easily see what connects to what!`;
      }
      return params.scope === 'node' && params.nodeId
        ? `### What this does\nThis node acts as a key module in the codebase${branchSuffix}.\n\n### Why it matters\nIt orchestrates data between the frontend and backend.\n\n### Where to look next\nCheck the routers that call into this module.\n\n### Related files\n- \`server/routes.js\``
        : params.scope === 'file' && params.filePath
        ? `### What this does\nThis file contains core application logic${branchSuffix}.\n\n### Why it matters\nIt defines the main business rules and state.\n\n### Where to look next\nLook at the components that import this file.\n\n### Related files\n- \`src/App.tsx\``
        : `### What this does\nThis is a mock explanation for repository: **${params.owner}/${params.repo}**${branchSuffix}.\n\n### Why it matters\nIt represents the entire project.\n\n### Where to look next\nCheck the entry points.\n\n### Related files\n- \`package.json\``;
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
