import type { Dependency } from '../../../src/types';
import { getParserForFile } from './registry';
import { detectPackageJsonWorkspace, parsePnpmWorkspace } from './npm-parser';

// Export all individual parser functions to retain complete backward compatibility
export { parsePackageJson } from './npm-parser';
export { parsePackageJsonName, parsePackageJsonScoped, parsePnpmWorkspace } from './npm-parser';
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

export function detectWorkspaceManifest(path: string, content: string) {
  if (path.endsWith('pnpm-workspace.yaml')) {
    return parsePnpmWorkspace(path, content);
  }
  if (path.endsWith('package.json')) {
    return detectPackageJsonWorkspace(path, content);
  }
  return null;
}
