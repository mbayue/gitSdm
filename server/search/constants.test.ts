import { describe, it, expect } from 'bun:test';
import {
  SUPPORTED_EXTENSIONS,
  AST_SUPPORTED_LANGUAGES,
  extToLanguage,
  searchCacheKey,
  indexCacheKey,
  DEFAULT_TOP_K,
  DEFAULT_MIN_SCORE,
  MAX_CHUNK_TOKENS,
} from './constants';

describe('constants', () => {
  describe('SUPPORTED_EXTENSIONS', () => {
    it('contains common web extensions', () => {
      expect(SUPPORTED_EXTENSIONS.has('.ts')).toBe(true);
      expect(SUPPORTED_EXTENSIONS.has('.tsx')).toBe(true);
      expect(SUPPORTED_EXTENSIONS.has('.js')).toBe(true);
      expect(SUPPORTED_EXTENSIONS.has('.jsx')).toBe(true);
    });

    it('contains common backend extensions', () => {
      expect(SUPPORTED_EXTENSIONS.has('.py')).toBe(true);
      expect(SUPPORTED_EXTENSIONS.has('.go')).toBe(true);
      expect(SUPPORTED_EXTENSIONS.has('.rs')).toBe(true);
      expect(SUPPORTED_EXTENSIONS.has('.java')).toBe(true);
    });

    it('contains config/doc extensions', () => {
      expect(SUPPORTED_EXTENSIONS.has('.json')).toBe(true);
      expect(SUPPORTED_EXTENSIONS.has('.md')).toBe(true);
      expect(SUPPORTED_EXTENSIONS.has('.yaml')).toBe(true);
    });

    it('does not contain binary/image extensions', () => {
      expect(SUPPORTED_EXTENSIONS.has('.png')).toBe(false);
      expect(SUPPORTED_EXTENSIONS.has('.jpg')).toBe(false);
      expect(SUPPORTED_EXTENSIONS.has('.zip')).toBe(false);
    });
  });

  describe('AST_SUPPORTED_LANGUAGES', () => {
    it('includes typescript and javascript variants', () => {
      expect(AST_SUPPORTED_LANGUAGES.has('typescript')).toBe(true);
      expect(AST_SUPPORTED_LANGUAGES.has('tsx')).toBe(true);
      expect(AST_SUPPORTED_LANGUAGES.has('javascript')).toBe(true);
      expect(AST_SUPPORTED_LANGUAGES.has('jsx')).toBe(true);
    });

    it('includes python', () => {
      expect(AST_SUPPORTED_LANGUAGES.has('python')).toBe(true);
    });

    it('does not include go or rust', () => {
      expect(AST_SUPPORTED_LANGUAGES.has('go')).toBe(false);
      expect(AST_SUPPORTED_LANGUAGES.has('rust')).toBe(false);
    });
  });

  describe('extToLanguage', () => {
    it('maps TypeScript extensions correctly', () => {
      expect(extToLanguage('.ts')).toBe('typescript');
      expect(extToLanguage('.tsx')).toBe('tsx');
    });

    it('maps JavaScript extensions correctly', () => {
      expect(extToLanguage('.js')).toBe('javascript');
      expect(extToLanguage('.jsx')).toBe('jsx');
      expect(extToLanguage('.mjs')).toBe('javascript');
      expect(extToLanguage('.cjs')).toBe('javascript');
    });

    it('maps Python', () => {
      expect(extToLanguage('.py')).toBe('python');
    });

    it('maps Go, Rust, Java', () => {
      expect(extToLanguage('.go')).toBe('go');
      expect(extToLanguage('.rs')).toBe('rust');
      expect(extToLanguage('.java')).toBe('java');
    });

    it('returns text for unknown extension', () => {
      expect(extToLanguage('.xyz')).toBe('text');
      expect(extToLanguage('')).toBe('text');
    });

    it('maps markup/config formats', () => {
      expect(extToLanguage('.json')).toBe('json');
      expect(extToLanguage('.yaml')).toBe('yaml');
      expect(extToLanguage('.yml')).toBe('yaml');
      expect(extToLanguage('.md')).toBe('markdown');
    });
  });

  describe('searchCacheKey', () => {
    it('produces deterministic key', () => {
      const key = searchCacheKey('octocat', 'hello-world', 'abc123', 'hashXYZ');
      expect(key).toBe('search:octocat/hello-world@abc123:hashXYZ');
    });

    it('keys differ for different queries', () => {
      const k1 = searchCacheKey('o', 'r', 'sha', 'hash1');
      const k2 = searchCacheKey('o', 'r', 'sha', 'hash2');
      expect(k1).not.toBe(k2);
    });

    it('keys differ for different commits', () => {
      const k1 = searchCacheKey('o', 'r', 'sha1', 'hash');
      const k2 = searchCacheKey('o', 'r', 'sha2', 'hash');
      expect(k1).not.toBe(k2);
    });
  });

  describe('indexCacheKey', () => {
    it('produces deterministic key', () => {
      const key = indexCacheKey('octocat', 'hello-world', 'abc123');
      expect(key).toBe('index:octocat/hello-world@abc123');
    });

    it('differs from searchCacheKey for same inputs', () => {
      const ik = indexCacheKey('o', 'r', 'sha');
      const sk = searchCacheKey('o', 'r', 'sha', '');
      expect(ik).not.toBe(sk);
    });
  });

  describe('numeric constants', () => {
    it('DEFAULT_TOP_K is a positive integer', () => {
      expect(DEFAULT_TOP_K).toBeGreaterThan(0);
      expect(Number.isInteger(DEFAULT_TOP_K)).toBe(true);
    });

    it('DEFAULT_MIN_SCORE is between 0 and 1', () => {
      expect(DEFAULT_MIN_SCORE).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_MIN_SCORE).toBeLessThanOrEqual(1);
    });

    it('MAX_CHUNK_TOKENS is a positive integer', () => {
      expect(MAX_CHUNK_TOKENS).toBeGreaterThan(0);
      expect(Number.isInteger(MAX_CHUNK_TOKENS)).toBe(true);
    });
  });
});
