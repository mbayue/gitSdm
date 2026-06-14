import type { RequestContext } from '../../utils/context';
import { buildRepoContext, SYSTEM_PROMPT } from '../prompts';
import { analyzeRepository } from '../../services/analyze-repo';
import { executeAiTask } from '../service';

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
