import { describe, it, expect } from 'bun:test';
import { createChunker } from './chunker';
import { MAX_CHUNK_TOKENS } from './constants';

const MAX_CHUNK_CHARS = MAX_CHUNK_TOKENS * 4;

describe('createChunker', () => {
  const chunker = createChunker();

  describe('chunkFile', () => {
    it('returns empty array for empty content', () => {
      expect(chunker.chunkFile('', 'src/a.ts', 'typescript')).toEqual([]);
    });

    it('returns empty array for whitespace-only content', () => {
      expect(chunker.chunkFile('   \n\n  ', 'src/a.ts', 'typescript')).toEqual([]);
    });

    it('returns a single chunk for small content', () => {
      const content = 'const x = 1;';
      const chunks = chunker.chunkFile(content, 'src/a.ts', 'typescript');
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(content);
      expect(chunks[0].filePath).toBe('src/a.ts');
      expect(chunks[0].language).toBe('typescript');
      expect(chunks[0].startLine).toBe(1);
      expect(chunks[0].chunkIndex).toBe(0);
    });

    it('assigns sequential chunkIndex values', () => {
      const bigLine = 'a'.repeat(MAX_CHUNK_CHARS + 1);
      const content = Array(6).fill(bigLine).join('\n');
      const chunks = chunker.chunkFile(content, 'src/a.ts', 'text');
      chunks.forEach((c, i) => expect(c.chunkIndex).toBe(i));
    });

    it('assigns filePath and language to every chunk', () => {
      const bigLine = 'a'.repeat(MAX_CHUNK_CHARS + 1);
      const content = Array(4).fill(bigLine).join('\n');
      const chunks = chunker.chunkFile(content, 'server/b.py', 'python');
      for (const c of chunks) {
        expect(c.filePath).toBe('server/b.py');
        expect(c.language).toBe('python');
      }
    });

    it('startLine is always >= 1', () => {
      const content = 'line1\nline2\nline3';
      const chunks = chunker.chunkFile(content, 'x.ts', 'typescript');
      for (const c of chunks) {
        expect(c.startLine).toBeGreaterThanOrEqual(1);
      }
    });

    it('endLine >= startLine for every chunk', () => {
      const content = Array(20).fill('const x = 1;').join('\n');
      const chunks = chunker.chunkFile(content, 'x.ts', 'typescript');
      for (const c of chunks) {
        expect(c.endLine).toBeGreaterThanOrEqual(c.startLine);
      }
    });
  });

  describe('AST-aware chunking (TypeScript)', () => {
    it('splits at function boundaries', () => {
      const content = `function foo() {\n  return 1;\n}\n\nfunction bar() {\n  return 2;\n}`;
      const chunks = chunker.chunkFile(content, 'a.ts', 'typescript');
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      const allContent = chunks.map((c) => c.content).join('\n');
      expect(allContent).toContain('foo');
      expect(allContent).toContain('bar');
    });

    it('splits at class boundaries', () => {
      const content = `class Foo {\n  run() {}\n}\n\nclass Bar {\n  run() {}\n}`;
      const chunks = chunker.chunkFile(content, 'a.ts', 'typescript');
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('handles arrow function declarations', () => {
      const content = `export const greet = (name: string) => {\n  return \`Hello \${name}\`;\n};`;
      const chunks = chunker.chunkFile(content, 'a.ts', 'typescript');
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks[0].content).toContain('greet');
    });

    it('chunks leading and trailing text around TS boundaries', () => {
      const content = `import x from 'x';\n\nfunction foo() {\n  return 1;\n}\n\nexport type Thing = {\n  id: string;\n};\n\nconst tail = true;`;
      const chunks = chunker.chunkFile(content, 'a.ts', 'typescript');
      expect(chunks.map((c) => c.content).join('\n')).toContain('import x');
      expect(chunks.map((c) => c.content).join('\n')).toContain('const tail = true');
    });

    it('falls back end line for brace blocks without closing brace', () => {
      const content = `function open() {\n${Array(60).fill('  const x = 1;').join('\n')}`;
      const chunks = chunker.chunkFile(content, 'open.ts', 'typescript');
      expect(chunks.at(0)?.endLine).toBe(51);
    });

    it('sub-splits oversized AST blocks', () => {
      const content = `function huge() {\n${Array(4).fill('  ' + 'x'.repeat(MAX_CHUNK_CHARS)).join('\n')}\n}`;
      const chunks = chunker.chunkFile(content, 'huge.ts', 'typescript');
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('recognizes exported function expressions and abstract classes', () => {
      const content = `export const run = function () {\n  return 1;\n}\n\nexport abstract class Base {\n  abstract x(): void;\n}`;
      const chunks = chunker.chunkFile(content, 'expr.ts', 'tsx');
      const all = chunks.map((c) => c.content).join('\n');
      expect(all).toContain('export const run');
      expect(all).toContain('abstract class Base');
    });
  });

  describe('AST-aware chunking (Python)', () => {
    it('splits at def boundaries', () => {
      const content = `def foo():\n    return 1\n\ndef bar():\n    return 2\n`;
      const chunks = chunker.chunkFile(content, 'a.py', 'python');
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('splits at class boundaries', () => {
      const content = `class Foo:\n    def method(self):\n        pass\n\nclass Bar:\n    pass\n`;
      const chunks = chunker.chunkFile(content, 'a.py', 'python');
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('sliding-window chunking (unsupported language)', () => {
    it('routes unsupported AST languages through sliding window', () => {
      const chunks = chunker.chunkFile('function x() {}\nclass Y {}', 'a.rb', 'ruby');
      expect(chunks).toHaveLength(1);
    });

    it('returns single chunk for short Go file', () => {
      const content = `package main\n\nfunc main() {\n\tprintln("hi")\n}`;
      const chunks = chunker.chunkFile(content, 'main.go', 'go');
      expect(chunks).toHaveLength(1);
      expect(chunks[0].startLine).toBe(1);
    });

    it('splits large content across multiple chunks', () => {
      const line = 'x'.repeat(100);
      const content = Array(Math.ceil((MAX_CHUNK_CHARS / 100) * 3)).fill(line).join('\n');
      const chunks = chunker.chunkFile(content, 'big.go', 'go');
      expect(chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('no chunk content exceeds MAX_CHUNK_CHARS significantly', () => {
      const line = 'y'.repeat(200);
      const content = Array(100).fill(line).join('\n');
      const chunks = chunker.chunkFile(content, 'big.rb', 'ruby');
      for (const c of chunks) {
        expect(c.content.length).toBeLessThanOrEqual(MAX_CHUNK_CHARS + 201);
      }
    });

    it('prefers blank-line breakpoints when splitting large text', () => {
      const first = 'a'.repeat(1000);
      const second = 'b'.repeat(1000);
      const third = 'c'.repeat(100);
      const chunks = chunker.chunkFile(`${first}\n\n${second}\n${third}`, 'notes.txt', 'text');
      expect(chunks.length).toBe(2);
      expect(chunks[0].content).toBe(`${first}\n`);
      expect(chunks[1].content).toBe(`${second}\n${third}`);
    });

    it('handles hard split when no blank-line break exists in sliding window', () => {
      const longLine = 'x'.repeat(MAX_CHUNK_CHARS + 1);
      const content = `${longLine}\n${longLine}`;
      const chunks = chunker.chunkFile(content, 'no-blank.txt', 'text');
      expect(chunks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('AST chunker edge cases', () => {
    it('includes trailing non-boundary content after last AST block', () => {
      const content = `interface Config {\n  name: string;\n}\n\n// trailing comment\nconst TRAILING = true;`;
      const chunks = chunker.chunkFile(content, 'trail.ts', 'typescript');
      const all = chunks.map((c) => c.content).join('\n');
      expect(all).toContain('TRAILING');
    });

    it('falls back to sliding window when AST boundaries are empty', () => {
      const content = 'just plain text\nno functions here\n';
      const chunks = chunker.chunkFile(content, 'plain.ts', 'typescript');
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('covers type alias, enum, and interface patterns', () => {
      const content = `type ID = string;\n\nenum Color {\n  Red,\n  Blue\n}\n\ninterface Config {\n  name: string;\n}`;
      const chunks = chunker.chunkFile(content, 'types.ts', 'typescript');
      const all = chunks.map((c) => c.content).join('\n');
      expect(all).toContain('type ID');
      expect(all).toContain('enum Color');
      expect(all).toContain('interface Config');
    });
  });
});
