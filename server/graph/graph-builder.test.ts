import { describe, it, expect } from 'bun:test';
import { buildGraph } from './graph-builder';

describe('buildGraph', () => {
  it('creates repo node and edges', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [
        {
          path: 'src',
          name: 'src',
          type: 'dir',
          children: [
            { path: 'src/index.ts', name: 'index.ts', type: 'file', fileClass: 'entry' },
          ],
        },
      ],
      dependencies: [{ name: 'react', version: '^19', type: 'prod', ecosystem: 'npm' }],
      contributors: [{ login: 'dev', avatarUrl: '', contributions: 10 }],
    });

    expect(graph.nodes.some((n) => n.type === 'repo')).toBe(true);
    expect(graph.nodes.some((n) => n.type === 'folder' && n.data.label.includes('(1)'))).toBe(true);
    expect(graph.nodes.some((n) => n.type === 'package')).toBe(false);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.layout).toBe('dagre');
  });

  it('handles empty trees gracefully without crashing', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [],
      dependencies: [],
      contributors: [],
    });
    expect(graph.nodes.length).toBe(1); // repo node still constructed
    expect(graph.nodes[0].type).toBe('repo');
  });

  it('builds import edges when fileContents are provided', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [
        {
          path: 'src',
          name: 'src',
          type: 'dir',
          children: [
            { path: 'src/index.ts', name: 'index.ts', type: 'file', fileClass: 'source' },
            { path: 'src/utils.ts', name: 'utils.ts', type: 'file', fileClass: 'source' },
          ],
        },
      ],
      dependencies: [],
      contributors: [],
      fileContents: {
        'src/index.ts': "import { helper } from './utils';\nconsole.log(helper());",
        'src/utils.ts': 'export function helper() { return 42; }',
      },
    });

    const importEdges = graph.edges.filter((e) => e.type === 'imports');
    expect(importEdges.length).toBeGreaterThan(0);
    expect(importEdges.some((e) => e.source === 'file:src/index.ts' && e.target === 'file:src/utils.ts')).toBe(true);
  });
});
