import type { Dependency } from '../../../src/types';
import type { ManifestParser } from './types';

export function parsePackageJson(content: string): Dependency[] {
  try {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const deps: Dependency[] = [];
    for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
      deps.push({ name, version, type: 'prod', ecosystem: 'npm' });
    }
    for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
      deps.push({ name, version, type: 'dev', ecosystem: 'npm' });
    }
    for (const [name, version] of Object.entries(pkg.peerDependencies ?? {})) {
      deps.push({ name, version, type: 'peer', ecosystem: 'npm' });
    }
    return deps;
  } catch {
    return [];
  }
}

export const npmParser: ManifestParser = {
  name: 'npm',
  filePattern: 'package.json',
  parse: parsePackageJson,
};
