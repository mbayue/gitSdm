import type { Dependency } from '../../../src/types';
import { getParserForFile } from './registry';

// Export all individual parser functions to retain complete backward compatibility
export { parsePackageJson } from './npm-parser';
export { parseRequirementsTxt, parsePyproject } from './pip-parser';
export { parseCargoToml } from './rust-parser';
export { parseGoMod } from './go-parser';
export { parseDockerfile } from './docker-parser';
export { parsePomXml } from './java-parser';

/**
 * Unified dispatch entry matching original signature
 */
export function parseManifest(path: string, content: string): Dependency[] {
  const parser = getParserForFile(path);
  if (!parser) {
    return [];
  }
  return parser.parse(content);
}
