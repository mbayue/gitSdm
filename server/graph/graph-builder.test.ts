import { describe, it, expect } from 'vitest';
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
});
