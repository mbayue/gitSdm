import type { RequestContext } from '../../utils/context';
import { buildRepoContext, SYSTEM_PROMPT } from '../prompts';
import { analyzeRepository } from '../../services/analyze-repo';
import { executeAiTask } from '../service';

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
