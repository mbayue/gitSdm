import { describe, it, expect } from 'bun:test';
import { classifyFile, annotateTree, findImportantFiles } from './file-classifier';
import type { TreeNode } from '../../src/types';

describe('file-classifier', () => {
  describe('classifyFile', () => {
    it('identifies entry files', () => {
      expect(classifyFile('src/index.ts')).toBe('entry');
      expect(classifyFile('main.go')).toBe('entry');
      expect(classifyFile('src/App.tsx')).toBe('entry');
    });

    it('identifies test files', () => {
      expect(classifyFile('src/components/button.test.tsx')).toBe('test');
      expect(classifyFile('server/api/user_spec.go')).toBe('test');
      expect(classifyFile('__tests__/login.js')).toBe('test');
    });

    it('identifies config files', () => {
      expect(classifyFile('tsconfig.json')).toBe('config');
      expect(classifyFile('vite.config.ts')).toBe('config');
      expect(classifyFile('.env.production')).toBe('config');
    });

    it('identifies doc files', () => {
      expect(classifyFile('README.md')).toBe('doc');
      expect(classifyFile('LICENSE')).toBe('doc');
    });

    it('identifies asset files', () => {
      expect(classifyFile('assets/logo.png')).toBe('asset');
      expect(classifyFile('public/favicon.ico')).toBe('asset');
    });

    it('identifies source files', () => {
      expect(classifyFile('src/utils/helpers.ts')).toBe('source');
      expect(classifyFile('server/db/conn.go')).toBe('source');
    });

    it('safely handles empty filename strings', () => {
      expect(classifyFile('')).toBe('other');
    });
  });

  describe('annotateTree', () => {
    it('recursively labels node categories', () => {
      const nodes: TreeNode[] = [
        {
          path: 'src',
          name: 'src',
          type: 'dir',
          children: [
            { path: 'src/index.ts', name: 'index.ts', type: 'file' },
            { path: 'src/components/Button.test.tsx', name: 'Button.test.tsx', type: 'file' },
          ],
        },
      ];

      const annotated = annotateTree(nodes);
      expect(annotated[0].fileClass).toBeUndefined();
      expect(annotated[0].children?.[0].fileClass).toBe('entry');
      expect(annotated[0].children?.[1].fileClass).toBe('test');
    });
  });

  describe('findImportantFiles', () => {
    it('ranks entry and manifest files higher', () => {
      const paths = [
        'src/utils/helpers.ts',
        'package.json',
        'README.md',
        'assets/logo.png',
        'src/index.ts',
      ];

      const important = findImportantFiles(paths);
      expect(important[0]).toBe('package.json'); // score: 15 + depth <=2
      expect(important.includes('README.md')).toBe(true);
      expect(important.includes('src/index.ts')).toBe(true);
      expect(important.includes('assets/logo.png')).toBe(false); // asset should be filtered or ranked very low
    });
  });
});
