import { describe, expect, test } from 'bun:test';
import { buildForceGraphData } from './buildForceGraphData';
import type { GraphEdge, GraphNode, NodeType } from '@/types';

const nodes: GraphNode[] = [
  { id: 'repo', type: 'repo', position: { x: 0, y: 0 }, data: { label: 'repo' } },
  { id: 'pkg', type: 'package', position: { x: 0, y: 0 }, data: { label: 'react' } },
  { id: 'app', type: 'file', position: { x: 0, y: 0 }, data: { label: 'App.tsx', path: 'src/App.tsx', extension: 'tsx' } },
];

const edges: GraphEdge[] = [
  { id: 'e1', source: 'app', target: 'pkg', type: 'depends_on' },
];

// Regression coverage for the homepage sample graph: workspace filters must
// not leak into the readOnly demo (its footer counts the full demo graph,
// so a filtered render would disagree with the displayed counts).
// Root cause was a two-layer filter chain where only the first layer
// (useNodeFiltering) respected readOnly; this layer did not.

describe('buildForceGraphData readOnly', () => {
  test('applies node type filters when not readOnly', () => {
    const result = buildForceGraphData(nodes, edges, {
      nodeTypeFilters: new Set<NodeType>(['repo', 'file']),
      fileTypeFilters: new Set<string>(),
    });
    expect(result.nodes.map((n) => n.id).sort()).toEqual(['app', 'repo']);
    expect(result.links).toEqual([]);
  });

  test('applies file type filters when not readOnly', () => {
    const result = buildForceGraphData(nodes, edges, {
      nodeTypeFilters: new Set<NodeType>(['repo', 'package', 'folder', 'file']),
      fileTypeFilters: new Set<string>(['.ts']),
    });
    expect(result.nodes.map((n) => n.id).sort()).toEqual(['pkg', 'repo']);
  });

  test('readOnly bypasses workspace filters so the demo renders in full', () => {
    const result = buildForceGraphData(nodes, edges, {
      nodeTypeFilters: new Set<NodeType>(['repo', 'file']),
      fileTypeFilters: new Set<string>(['.ts']),
      readOnly: true,
    });
    expect(result.nodes.map((n) => n.id).sort()).toEqual(['app', 'pkg', 'repo']);
    expect(result.links).toEqual([{ source: 'app', target: 'pkg', type: 'depends_on' }]);
  });
});
