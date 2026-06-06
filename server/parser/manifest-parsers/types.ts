import type { Dependency } from '../../../src/types';

export interface ManifestParser {
  name: string;
  filePattern: string | RegExp;
  parse(content: string): Dependency[];
}
