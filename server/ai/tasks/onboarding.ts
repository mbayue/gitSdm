import type { RequestContext } from '../../utils/context';
import { buildRepoContext, SYSTEM_PROMPT } from '../prompts';
import { analyzeRepository } from '../../services/analyze-repo';
import { executeAiTask } from '../service';

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
