import type { RepoAnalysis } from '../../src/types';

export function buildRepoContext(analysis: RepoAnalysis, extra?: string): string {
  const topDirs = analysis.tree.map((n) => n.name).slice(0, 15).join(', ');
  const deps = analysis.dependencies
    .slice(0, 30)
    .map((d) => `${d.name}@${d.version ?? '*'} (${d.ecosystem})`)
    .join(', ');
  const files = analysis.importantFiles.slice(0, 15).join(', ');

  return `
Repository: ${analysis.meta.fullName}
Description: ${analysis.meta.description ?? 'N/A'}
Language: ${analysis.meta.language ?? 'Unknown'}
Stars: ${analysis.meta.stars} | Forks: ${analysis.meta.forks}
Topics: ${analysis.meta.topics.join(', ') || 'none'}
Top-level directories/files: ${topDirs}
Key files: ${files}
Dependencies (sample): ${deps || 'none detected'}
Contributors: ${analysis.contributors.map((c) => c.login).join(', ') || 'unknown'}
${extra ?? ''}
`.trim();
}

export const SYSTEM_PROMPT = `You are an expert software architect helping developers understand GitHub repositories quickly.
Be concise, practical, and developer-focused. Use markdown sparingly in explanations.
Never invent files or dependencies not present in the context.`;
