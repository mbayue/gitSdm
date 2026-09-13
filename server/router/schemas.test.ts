import { describe, expect, it } from 'bun:test';
import { indexBodySchema } from './schemas';

const parseScope = (includePaths?: string[], excludePaths?: string[]) =>
  indexBodySchema.safeParse({ owner: 'o', repo: 'r', query: 'abc', includePaths, excludePaths });

describe('index scope path validation', () => {
  it('rejects whole `..` path components in both arrays', () => {
    for (const path of ['..', 'a/../b', '../x', 'x/..', 'a/b/../../c']) {
      expect(parseScope([path]).success).toBe(false);
      expect(parseScope(undefined, [path]).success).toBe(false);
    }
  });

  it('accepts names that merely contain `..` inside a component', () => {
    for (const path of ['a..b.ts', 'foo..bar', 'src/a..b/x.ts', '..foo/bar']) {
      expect(parseScope([path]).success).toBe(true);
      expect(parseScope(undefined, [path]).success).toBe(true);
    }
  });

  it('keeps the structural rules: no leading slash, no trailing slash, no wildcards', () => {
    for (const path of ['/src', 'src/', 'src/**', '']) {
      expect(parseScope([path]).success).toBe(false);
    }
  });
});
