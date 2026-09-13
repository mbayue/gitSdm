import type { Dependency } from '../../../src/types';
import type { ManifestParser } from './types';

export function parseRequirementsTxt(content: string): Dependency[] {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((line) => {
      const match = line.match(/^([a-zA-Z0-9_-]+)([>=<~!]+.*)?$/);
      return {
        name: match?.[1] ?? line.split(/[>=<]/)[0],
        version: match?.[2]?.replace(/^[=<>~!]+/, ''),
        type: 'prod' as const,
        ecosystem: 'python',
      };
    })
    .slice(0, 100);
}

export const requirementsParser: ManifestParser = {
  name: 'pip-requirements',
  filePattern: 'requirements.txt',
  parse: parseRequirementsTxt,
};

function extractPythonPackageSpec(spec: string): { name: string; version?: string } | null {
  const cleaned = spec.trim().replace(/^['"]+|['"]+$/g, '').trim();
  if (!cleaned || cleaned.startsWith('#')) return null;
  const match = cleaned.match(/^([a-zA-Z0-9_.-]+)(?:\[.*?\])?(?:[=<>~!^@\s]+(.+))?$/);
  if (match) {
    const name = match[1].trim();
    const version = match[2]?.trim().replace(/^[=<>~!^@\s]+/, '').replace(/['"]/g, '').trim();
    return { name, version: version || undefined };
  }
  const parts = cleaned.split(/[=<>~!^@\s]+/);
  return parts[0]?.trim() ? { name: parts[0].trim(), version: parts[1]?.trim() } : null;
}

export function parsePyproject(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const seen = new Set<string>();

  const add = (name: string, version: string | undefined, type: 'prod' | 'dev') => {
    const lower = name.toLowerCase();
    if (!name || lower === 'python' || seen.has(lower)) return;
    seen.add(lower);
    deps.push({ name, version, type, ecosystem: 'python' });
  };

  // 1. Standard PEP 621 array syntax: dependencies = [ ... ] or optional-dependencies = [ ... ]
  const arrayMatches = content.matchAll(/(?:dependencies|optional-dependencies(?:\.[a-zA-Z0-9_.-]+)?)\s*=\s*\[([\s\S]*?)\]/g);
  for (const m of arrayMatches) {
    const rawItems = m[1].match(/"[^"]+"|'[^']+'/g) || [];
    for (const item of rawItems) {
      const parsed = extractPythonPackageSpec(item);
      if (parsed) add(parsed.name, parsed.version, 'prod');
    }
  }

  // 2. Table syntax: [project.dependencies], [tool.poetry.dependencies], or [tool.poetry.group.dev.dependencies]
  const tableMatches = content.matchAll(/\[(?:project\.dependencies|tool\.poetry\.(?:[a-zA-Z0-9_.-]+\.)?dependencies)\]([\s\S]*?)(?=\n\s*\[|$)/g);
  for (const tm of tableMatches) {
    const lines = tm[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const kv = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*=\s*(?:"([^"]+)"|'([^']+)'|\{.*?version\s*=\s*["']([^"']+)["'].*?\})/);
      if (kv) {
        add(kv[1], kv[2] || kv[3] || kv[4], 'prod');
        continue;
      }
      const quoted = trimmed.match(/^["']([^"']+)["']/);
      if (quoted) {
        const parsed = extractPythonPackageSpec(quoted[1]);
        if (parsed) add(parsed.name, parsed.version, 'prod');
      }
    }
  }

  return deps;
}

export const pyprojectParser: ManifestParser = {
  name: 'pip-pyproject',
  filePattern: 'pyproject.toml',
  parse: parsePyproject,
};
