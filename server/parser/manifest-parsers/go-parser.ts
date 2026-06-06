import type { Dependency } from '../../../src/types';
import type { ManifestParser } from './types';

export function parseGoMod(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const lines = content.split('\n');
  let inRequire = false;
  for (const line of lines) {
    if (line.trim() === 'require (') {
      inRequire = true;
      continue;
    }
    if (inRequire && line.trim() === ')') {
      inRequire = false;
      continue;
    }
    if (line.trim().startsWith('require ')) {
      const parts = line.trim().replace('require ', '').split(/\s+/);
      if (parts[0]) deps.push({ name: parts[0], version: parts[1], type: 'prod', ecosystem: 'go' });
      continue;
    }
    if (inRequire) {
      const parts = line.trim().split(/\s+/);
      if (parts[0] && !parts[0].startsWith('//')) {
        deps.push({ name: parts[0], version: parts[1], type: 'prod', ecosystem: 'go' });
      }
    }
  }
  return deps.slice(0, 80);
}

export const goModParser: ManifestParser = {
  name: 'go-mod',
  filePattern: 'go.mod',
  parse: parseGoMod,
};
