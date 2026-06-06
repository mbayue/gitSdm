import type { Dependency } from '../../../src/types';
import type { ManifestParser } from './types';

export function parseCargoToml(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const section = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
  if (!section) return deps;
  const lines = section[1].split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const name = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();

    let version = '';
    if (val.startsWith('{')) {
      const versionMatch = val.match(/version\s*=\s*["']([^"']+)["']/);
      if (versionMatch) {
        version = versionMatch[1];
      }
    } else {
      const versionMatch = val.match(/^["']([^"']+)["']/);
      if (versionMatch) {
        version = versionMatch[1];
      } else {
        version = val;
      }
    }

    deps.push({ name, version, type: 'prod', ecosystem: 'rust' });
  }
  return deps;
}

export const cargoParser: ManifestParser = {
  name: 'cargo',
  filePattern: 'Cargo.toml',
  parse: parseCargoToml,
};
