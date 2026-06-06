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

export function parsePyproject(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const depSection = content.match(/\[project\.dependencies\]([\s\S]*?)(\[|$)/);
  if (depSection) {
    const lines = depSection[1].match(/"([^"]+)"/g) ?? [];
    for (const line of lines) {
      const pkg = line.replace(/"/g, '');
      const parts = pkg.split(/[=<>~!]+/);
      const name = parts[0]?.trim();
      const version = parts[1]?.trim();
      if (name) {
        deps.push({ name, version, type: 'prod', ecosystem: 'python' });
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
