import type { Dependency } from '../../../src/types';
import type { ManifestParser } from './types';

export function parseDockerfile(content: string): Dependency[] {
  const fromLines = content.match(/^FROM\s+(.+)$/gim) ?? [];
  return fromLines.map((line) => {
    const image = line.replace(/^FROM\s+/i, '').split(/\s+/)[0];
    return { name: image, type: 'prod' as const, ecosystem: 'docker' };
  });
}

export const dockerfileParser: ManifestParser = {
  name: 'dockerfile',
  filePattern: 'Dockerfile',
  parse: parseDockerfile,
};
