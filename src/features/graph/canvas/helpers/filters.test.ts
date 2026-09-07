import { expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useNodeFiltering } from './filters';
import type { GraphData } from '@/types';

const graph: GraphData = {
  layout: 'force',
  nodes: [
    { id: 'root', type: 'repo', position: { x: 0, y: 0 }, data: { label: 'repo' } },
    { id: 'app', type: 'file', position: { x: 0, y: 0 }, data: { label: 'App', path: 'src/App.tsx', fileClass: 'entry' } },
    { id: 'docs', type: 'file', position: { x: 0, y: 0 }, data: { label: 'README', path: 'README.md', fileClass: 'doc' } },
    { id: 'config', type: 'file', position: { x: 0, y: 0 }, data: { label: 'Config', path: 'package.json', fileClass: 'config' } },
  ],
  edges: [{ id: 'edge', source: 'root', target: 'app', type: 'contains' }],
};

function filter(content: string[], readOnly = false, graphScope = 'full') {
  let result: Pick<GraphData, 'nodes' | 'edges'> = graph;
  function Probe() {
    result = useNodeFiltering({ graph, readOnly, searchQuery: '', nodeTypeFilters: new Set(['repo', 'file']),
      diffStatusFilters: new Set(), fileTypeFilters: new Set(), activeFocusLayer: 'all', contentFilters: new Set(content), graphScope });
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return result;
}

test('content filters distinguish source, root documentation, and config files', () => {
  expect(filter(['source', 'config']).nodes.map((node) => node.id)).toEqual(['root', 'app', 'config']);
  expect(filter(['docs']).nodes.map((node) => node.id)).toEqual(['root', 'docs']);
});
test('disabling source removes its nodes and dangling edges', () => {
  expect(filter(['config']).nodes.map((node) => node.id)).toEqual(['root', 'config']);
  expect(filter(['config']).edges).toEqual([]);
});
test('the homepage sample ignores workspace content filters', () => {
  expect(filter([], true)).toBe(graph);
});
test('the Source toggle is honored in the important scope', () => {
  expect(filter(['source', 'config'], false, 'important').nodes.map((node) => node.id)).toEqual(['root', 'app']);
  expect(filter(['config'], false, 'important').nodes.map((node) => node.id)).toEqual(['root']);
  expect(filter(['config'], false, 'important').edges).toEqual([]);
});
