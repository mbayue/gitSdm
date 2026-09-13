import { expect, test } from 'bun:test';
import { reconcileGraph } from './reconcileGraph';
import { buildForceGraphData } from './buildForceGraphData';
import type { GraphNode } from '@/types';
test('metadata updates preserve simulation identity and coordinates', () => {
  const node: GraphNode = {
    id: 'a',
    type: 'file',
    position: { x: 0, y: 0 },
    data: { label: 'a' },
  };
  const options = {
    nodeTypeFilters: new Set<GraphNode['type']>(['file']),
    fileTypeFilters: new Set<string>(),
  };
  const edge = { id: 'a->b', source: 'a', target: 'b' };
  const other: GraphNode = { id: 'b', type: 'file', position: { x: 1, y: 1 }, data: { label: 'b' } };
  const first = buildForceGraphData([node, other], [edge], options);
  first.nodes[0].x = 125;
  first.nodes[0].y = 80;
  const next = buildForceGraphData(
    [{ ...node, data: { ...node.data, churnScore: 0.7 } }, other],
    [edge],
    options,
  );
  const reconciled = reconcileGraph(first, next);
  expect(reconciled).not.toBe(first);
  expect(reconciled.nodes[0]).toBe(first.nodes[0]);
  expect(reconciled.links[0]).toBe(first.links[0]);
  expect(first.nodes[0].x).toBe(125);
  expect(first.nodes[0].churnScore).toBe(0.7);
  expect(reconcileGraph(first, { nodes: [], links: [] })).not.toBe(first);
});
