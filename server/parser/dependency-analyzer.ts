import type { Dependency } from '../../src/types';
import { parseManifest } from './manifest-parsers';

export function analyzeDependencies(fileContents: Record<string, string>): Dependency[] {
  const all: Dependency[] = [];
  const seen = new Set<string>();

  for (const [path, content] of Object.entries(fileContents)) {
    const deps = parseManifest(path, content);
    for (const dep of deps) {
      const key = `${dep.ecosystem}:${dep.name}:${dep.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        all.push(dep);
      }
    }
  }

  return all.sort((a, b) => a.name.localeCompare(b.name));
}
