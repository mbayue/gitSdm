import type { ManifestParser } from './types';
import { npmParser } from './npm-parser';
import { requirementsParser, pyprojectParser } from './pip-parser';
import { cargoParser } from './rust-parser';
import { goModParser } from './go-parser';
import { dockerfileParser } from './docker-parser';
import { pomParser } from './java-parser';

// Central Registry Map
export const parserRegistry = new Map<string, ManifestParser>();

// Register out-of-the-box parser plugins
const defaultParsers = [
  npmParser,
  requirementsParser,
  pyprojectParser,
  cargoParser,
  goModParser,
  dockerfileParser,
  pomParser,
];

for (const parser of defaultParsers) {
  parserRegistry.set(parser.name, parser);
}

/**
 * Resolves a registered parser matching the target file pattern
 */
export function getParserForFile(path: string): ManifestParser | null {
  const base = path.split('/').pop() ?? path;
  
  for (const parser of parserRegistry.values()) {
    if (typeof parser.filePattern === 'string') {
      if (parser.filePattern === base) {
        return parser;
      }
    } else if (parser.filePattern instanceof RegExp) {
      if (parser.filePattern.test(base)) {
        return parser;
      }
    }
  }
  return null;
}
