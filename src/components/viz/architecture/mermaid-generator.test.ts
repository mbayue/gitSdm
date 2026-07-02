import { describe, expect, it } from 'bun:test';
import { generateProgrammaticMermaid } from './mermaid-generator';
import type { RepoAnalysis } from '@/types';
import type { GraphNode, GraphEdge } from '@/types';

function makeNode(overrides: Partial<GraphNode> & { id: string }): GraphNode {
  return {
    type: 'file',
    position: { x: 0, y: 0 },
    data: { label: overrides.id },
    ...overrides,
  };
}

function makeEdge(overrides: Partial<GraphEdge> & { id: string; source: string; target: string }): GraphEdge {
  return {
    type: 'imports',
    ...overrides,
  };
}

const emptyAnalysis: RepoAnalysis = {
  meta: { owner: 'test', repo: 'test', fullName: 'test/test', stars: 0, defaultBranch: 'main', topics: [] },
  tree: [],
  treeTruncated: false,
  dependencies: [],
  graph: { nodes: [], edges: [], layout: 'force' },
  contributors: [],
  timeline: [],
  importantFiles: [],
};

describe('generateProgrammaticMermaid', () => {
  it('returns empty graph for no nodes', () => {
    const result = generateProgrammaticMermaid(emptyAnalysis);
    expect(result).toBe('graph LR');
  });

  it('includes node with folder subgraph for a single file node', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: {
        nodes: [
          makeNode({
            id: 'src/index.ts',
            type: 'file',
            data: { label: 'index.ts', path: 'src/index.ts', fileClass: 'entry' },
          }),
        ],
        edges: [],
        layout: 'force',
      },
    };

    const result = generateProgrammaticMermaid(analysis);
    expect(result).toContain('graph LR');
    expect(result).toContain('subgraph');
    expect(result).toContain('src');
    expect(result).toContain('index.ts');
  });

  it('renders edges between nodes that are both in the top-25', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: {
        nodes: [
          makeNode({ id: 'src/a.ts', data: { label: 'a.ts', path: 'src/a.ts' } }),
          makeNode({ id: 'src/b.ts', data: { label: 'b.ts', path: 'src/b.ts' } }),
        ],
        edges: [makeEdge({ id: 'a->b', source: 'src/a.ts', target: 'src/b.ts' })],
        layout: 'force',
      },
    };

    const result = generateProgrammaticMermaid(analysis);
    expect(result).toContain('-->');
  });

  it('limits output to at most 25 nodes', () => {
    // Create 30 nodes all with score 0 (no edges, not entry, not important)
    const nodes: GraphNode[] = Array.from({ length: 30 }, (_, i) =>
      makeNode({ id: `src/file${i}.ts`, data: { label: `file${i}.ts`, path: `src/file${i}.ts` } })
    );

    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: { nodes, edges: [], layout: 'force' },
    };

    const result = generateProgrammaticMermaid(analysis);
    // Count node entries (indented lines with id["label"] pattern — excludes subgraph headers)
    const nodeLines = result.match(/^    [a-zA-Z0-9_]+\["/gm);
    expect(nodeLines).not.toBeNull();
    expect(nodeLines!.length).toBeLessThanOrEqual(25);
  });

  it('prioritizes connected nodes over isolated ones', () => {
    // 26 isolated nodes + 2 heavily connected nodes
    const isolated: GraphNode[] = Array.from({ length: 26 }, (_, i) =>
      makeNode({ id: `src/isolated${i}.ts`, data: { label: `isolated${i}.ts`, path: `src/isolated${i}.ts` } })
    );
    const connected: GraphNode[] = [
      makeNode({ id: 'src/hub.ts', data: { label: 'hub.ts', path: 'src/hub.ts' } }),
      makeNode({ id: 'src/leaf.ts', data: { label: 'leaf.ts', path: 'src/leaf.ts' } }),
    ];
    // hub <-> leaf has 2 degrees for hub, 1 for leaf
    const edges: GraphEdge[] = [
      makeEdge({ id: 'h->l', source: 'src/hub.ts', target: 'src/leaf.ts' }),
      makeEdge({ id: 'l->h', source: 'src/leaf.ts', target: 'src/hub.ts' }),
    ];

    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: { nodes: [...isolated, ...connected], edges, layout: 'force' },
    };

    const result = generateProgrammaticMermaid(analysis);
    // hub and leaf should both be in the top-25 since they have higher connectivity scores
    expect(result).toContain('hub.ts');
    expect(result).toContain('leaf.ts');
  });

  it('assigns entry class to entry nodes', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      importantFiles: [],
      graph: {
        nodes: [
          makeNode({ id: 'src/main.ts', data: { label: 'main.ts', path: 'src/main.ts', fileClass: 'entry' } }),
        ],
        edges: [],
        layout: 'force',
      },
    };

    const result = generateProgrammaticMermaid(analysis);
    expect(result).toContain('class ');
    expect(result).toContain(' entry');
  });

  it('assigns config class to config nodes', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: {
        nodes: [
          makeNode({ id: 'tsconfig.json', data: { label: 'tsconfig.json', path: 'tsconfig.json', fileClass: 'config' } }),
        ],
        edges: [],
        layout: 'force',
      },
    };

    const result = generateProgrammaticMermaid(analysis);
    expect(result).toContain(' config');
  });

  it('assigns test class to test nodes', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: {
        nodes: [
          makeNode({ id: 'src/a.test.ts', data: { label: 'a.test.ts', path: 'src/a.test.ts', fileClass: 'test' } }),
        ],
        edges: [],
        layout: 'force',
      },
    };

    const result = generateProgrammaticMermaid(analysis);
    expect(result).toContain(' test');
  });

  it('groups nodes into subgraphs by folder', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: {
        nodes: [
          makeNode({ id: 'src/a.ts', data: { label: 'a.ts', path: 'src/a.ts' } }),
          makeNode({ id: 'src/b.ts', data: { label: 'b.ts', path: 'src/b.ts' } }),
          makeNode({ id: 'test/c.test.ts', data: { label: 'c.test.ts', path: 'test/c.test.ts', fileClass: 'test' } }),
        ],
        edges: [],
        layout: 'force',
      },
    };

    const result = generateProgrammaticMermaid(analysis);
    // Should have two subgraphs: src and test
    const subgraphMatches = result.match(/subgraph/g);
    expect(subgraphMatches).toHaveLength(2);
  });

  it('scores entry nodes higher and includes them even with low connectivity', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: {
        nodes: [
          // 30 nodes, only entry node is at index 29 (would normally be filtered)
          ...Array.from({ length: 29 }, (_, i) =>
            makeNode({ id: `src/file${i}.ts`, data: { label: `file${i}.ts`, path: `src/file${i}.ts` } })
          ),
          makeNode({ id: 'src/main.ts', data: { label: 'main.ts', path: 'src/main.ts', fileClass: 'entry' } }),
        ],
        edges: [],
        layout: 'force',
      },
      importantFiles: [],
    };

    const result = generateProgrammaticMermaid(analysis);
    // Entry node should be scored high enough to be in top-25 despite low connectivity
    expect(result).toContain('main.ts');
  });

  it('handles nodes with null/empty data gracefully', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: {
        nodes: [
          {
            id: 'src/unknown',
            type: 'file',
            position: { x: 0, y: 0 },
            data: { label: '' },
          },
        ],
        edges: [],
        layout: 'force',
      },
    };

    const result = generateProgrammaticMermaid(analysis);
    expect(result).toContain('unknown');
  });

  it('deduplicates parallel edges between the same nodes', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: {
        nodes: [
          makeNode({ id: 'src/a.ts', data: { label: 'a.ts', path: 'src/a.ts' } }),
          makeNode({ id: 'src/b.ts', data: { label: 'b.ts', path: 'src/b.ts' } }),
        ],
        edges: [
          makeEdge({ id: 'e1', source: 'src/a.ts', target: 'src/b.ts' }),
          makeEdge({ id: 'e2', source: 'src/a.ts', target: 'src/b.ts' }),
        ],
        layout: 'force',
      },
    };

    const result = generateProgrammaticMermaid(analysis);
    // Should only have one arrow
    const arrowCount = (result.match(/-->/g) || []).length;
    expect(arrowCount).toBe(1);
  });

  it('uses label from node data, falling back to filename then id', () => {
    const analysis: RepoAnalysis = {
      ...emptyAnalysis,
      graph: {
        nodes: [
          makeNode({ id: 'src/with-label.ts', data: { label: 'My Label', path: 'src/with-label.ts' } }),
          makeNode({ id: 'src/no-label.ts', data: { label: 'no-label.ts', path: 'src/no-label.ts' } }),
        ],
        edges: [],
        layout: 'force',
      },
    };

    const result = generateProgrammaticMermaid(analysis);
    expect(result).toContain('My Label');
    expect(result).toContain('no-label.ts');
  });
});
