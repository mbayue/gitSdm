import { describe, it, expect } from 'bun:test';
import { extractRawImports, resolveImports, buildImportEdges } from './import-resolver';

describe('import-resolver', () => {
  describe('extractRawImports', () => {
    it('extracts JS/TS imports', () => {
      const code = `
        import React from 'react'; // third party, skip
        import { TodoList } from './components/TodoList';
        import defaultStyle from '../styles/main.css';
        export { Button } from './ui/Button';
        const config = require('./config/app.json');
      `;
      const imports = extractRawImports('src/App.tsx', code);
      expect(imports).toContain('./components/TodoList');
      expect(imports).toContain('../styles/main.css');
      expect(imports).toContain('./ui/Button');
      expect(imports).toContain('./config/app.json');
      expect(imports).not.toContain('react');
    });

    it('extracts Python imports', () => {
      const pyCode = `
        import os
        from ..db import session
        from .models import User
      `;
      const imports = extractRawImports('app/routers/user.py', pyCode);
      expect(imports).toContain('../db');
      expect(imports).toContain('./models');
    });
  });

  describe('resolveImports', () => {
    it('resolves relative file paths with candidates', () => {
      const files = new Set([
        'src/components/TodoList.tsx',
        'src/styles/main.css',
        'src/components/ui/Button.tsx',
        'src/config/app.json',
      ]);

      const resolved = resolveImports(
        'src/App.tsx',
        ['./components/TodoList', '../src/styles/main.css', './components/ui/Button', './config/app.json'],
        files
      );

      expect(resolved).toContain('src/components/TodoList.tsx');
      expect(resolved).toContain('src/styles/main.css');
      expect(resolved).toContain('src/components/ui/Button.tsx');
      expect(resolved).toContain('src/config/app.json');
    });

    it('safely handles empty rawImports array', () => {
      const resolved = resolveImports('src/App.tsx', [], new Set(['src/components/TodoList.tsx']));
      expect(resolved).toEqual([]);
    });
  });

  describe('buildImportEdges', () => {
    it('creates graph edges for valid imports', () => {
      const fileContents = {
        'src/App.tsx': `import { TodoList } from './components/TodoList';`,
        'src/components/TodoList.tsx': `import { Button } from './ui/Button';`,
      };
      const allFiles = [
        'src/App.tsx',
        'src/components/TodoList.tsx',
        'src/components/ui/Button.tsx',
      ];

      const edges = buildImportEdges(fileContents, allFiles);
      expect(edges).toHaveLength(2);
      expect(edges).toContainEqual({
        id: 'e:file:src/App.tsx->file:src/components/TodoList.tsx',
        source: 'file:src/App.tsx',
        target: 'file:src/components/TodoList.tsx',
        type: 'imports',
      });
    });
  });
});
