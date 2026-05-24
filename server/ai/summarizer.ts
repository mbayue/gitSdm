import { aiCacheKey, cache, hashContext } from '../cache/lru';
import type { RepoAnalysis } from '../../src/types';
import { getAIProvider } from './provider';
import { buildRepoContext, SYSTEM_PROMPT } from './prompts';
import { analyzeRepository } from '../services/analyze-repo';

export async function explainRepo(params: {
  owner: string;
  repo: string;
  scope: 'repo' | 'node' | 'file';
  nodeId?: string;
  filePath?: string;
  fileSnippet?: string;
  context?: string;
}): Promise<{ explanation: string; cached: boolean }> {
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
    parsed = JSON.parse(raw) as typeof parsed;
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
    const parsed = JSON.parse(raw) as { files: typeof files };
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
    const parsed = JSON.parse(raw) as { steps: typeof steps };
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

export type { RepoAnalysis };
