import type { Dependency } from '../../../src/types';
import type { ManifestParser } from './types';

export function parseRequirementsTxt(content: string): Dependency[] {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((line) => {
      const withoutMarker = line.split(';')[0].trim();
      const match = withoutMarker.match(/^([a-zA-Z0-9_.-]+)(?:\[.*?\])?(?:[>=<~!]+(.+))?$/);
      return {
        name: match?.[1] ?? withoutMarker.split(/[>=<]/)[0],
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
  const markerIdx = cleaned.indexOf(';');
  const baseSpec = (markerIdx >= 0 ? cleaned.slice(0, markerIdx) : cleaned).trim();
  if (!baseSpec) return null;

  const match = baseSpec.match(/^([a-zA-Z0-9_.-]+)(?:\[.*?\])?(?:[=<>~!^@\s]+(.+))?$/);
  if (match) {
    const name = match[1].trim();
    const version = match[2]?.trim().replace(/^[=<>~!^@\s]+/, '').replace(/['"]/g, '').trim();
    return { name, version: version || undefined };
  }
  const parts = baseSpec.split(/[=<>~!^@\s]+/);
  return parts[0]?.trim() ? { name: parts[0].trim(), version: parts[1]?.trim() } : null;
}

function extractQuotedArrayItems(str: string, openBracketIndex: number): string[] {
  let inDouble = false;
  let inSingle = false;
  let inComment = false;
  let depth = 0;
  let start = -1;
  let arrayBody = '';
  for (let i = openBracketIndex; i < str.length; i++) {
    const ch = str[i];
    if (inComment) {
      if (ch === '\n') inComment = false;
      continue;
    }
    if (ch === '\\' && (inDouble || inSingle)) {
      i++;
      continue;
    }
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (!inDouble && !inSingle) {
      if (ch === '#') {
        inComment = true;
        continue;
      }
      if (ch === '[') {
        if (depth === 0) start = i + 1;
        depth++;
      } else if (ch === ']') {
        depth--;
        if (depth === 0 && start !== -1) {
          arrayBody = str.slice(start, i);
          break;
        }
      }
    }
  }
  return arrayBody.match(/"[^"]+"|'[^']+'/g) || [];
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

  // 1. PEP 621 `[project] dependencies = [ ... ]` — only when the assignment sits
  // inside the [project] table (a [tool.*] or [project.optional-*] table with its
  // own `dependencies = [` must not leak in as production dependencies).
  const projectMatch = content.match(/\[project\]([\s\S]*?)(?=\n\s*\[|$)/);
  if (projectMatch) {
    const section = projectMatch[1];
    const depAssignMatches = section.matchAll(/(?:^|\n)\s*(?:dependencies|optional-dependencies(?:\.[a-zA-Z0-9_.-]+)?)\s*=\s*\[/g);
    for (const m of depAssignMatches) {
      const items = extractQuotedArrayItems(section, m.index + m[0].lastIndexOf('['));
      for (const item of items) {
        const parsed = extractPythonPackageSpec(item);
        if (parsed) add(parsed.name, parsed.version, 'prod');
      }
    }
  }

  // 2. PEP 621 [project.optional-dependencies] section
  const optSectionMatch = content.match(/\[project\.optional-dependencies\]([\s\S]*?)(?=\n\s*\[|$)/);
  if (optSectionMatch) {
    const section = optSectionMatch[1];
    const groupMatches = section.matchAll(/[a-zA-Z0-9_.-]+\s*=\s*\[/g);
    for (const gm of groupMatches) {
      const items = extractQuotedArrayItems(section, gm.index + gm[0].lastIndexOf('['));
      for (const item of items) {
        const parsed = extractPythonPackageSpec(item);
        if (parsed) add(parsed.name, parsed.version, 'prod');
      }
    }
  }

  // 3. Table syntax: [project.dependencies], [tool.poetry.dependencies], [tool.poetry.dev-dependencies], [tool.poetry.group.<name>.dependencies]
  const tableMatches = content.matchAll(/\[(project\.dependencies|tool\.poetry\.(?:group\.([a-zA-Z0-9_.-]+)\.)?dependencies|tool\.poetry\.dev-dependencies)\]([\s\S]*?)(?=\n\s*\[|$)/g);
  for (const tm of tableMatches) {
    const tableType = tm[1];
    const groupName = tm[2];
    const isDev = tableType === 'tool.poetry.dev-dependencies' || groupName === 'dev' || groupName === 'test';
    const depType = isDev ? 'dev' : 'prod';

    const lines = tm[3].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const kv = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*=\s*(?:"([^"]+)"|'([^']+)'|\{.*?version\s*=\s*["']([^"']+)["'].*?\}|\{[^}]*\})/);
      if (kv) {
        // Key-only match keeps path/git/url inline tables (no version field) instead of dropping them.
        add(kv[1], kv[2] || kv[3] || kv[4], depType);
        continue;
      }
      const quoted = trimmed.match(/^["']([^"']+)["']/);
      if (quoted) {
        const parsed = extractPythonPackageSpec(quoted[1]);
        if (parsed) add(parsed.name, parsed.version, depType);
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
