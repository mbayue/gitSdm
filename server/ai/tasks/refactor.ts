import type { RequestContext } from '../../utils/context';
import { buildRepoContext, SYSTEM_PROMPT } from '../prompts';
import { analyzeRepository } from '../../services/analyze-repo';
import { executeAiTask } from '../service';

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
