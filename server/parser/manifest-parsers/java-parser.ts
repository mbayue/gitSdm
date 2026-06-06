import type { Dependency } from '../../../src/types';
import type { ManifestParser } from './types';

export function parsePomXml(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const matches = content.matchAll(/<artifactId>([^<]+)<\/artifactId>/g);
  for (const m of matches) {
    if (m[1] && !m[1].includes('${')) {
      deps.push({ name: m[1], type: 'prod', ecosystem: 'java' });
    }
  }
  return deps.slice(0, 50);
}

export const pomParser: ManifestParser = {
  name: 'maven-pom',
  filePattern: 'pom.xml',
  parse: parsePomXml,
};
