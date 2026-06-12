import type { GraphData } from '@/types';

export const demoGraph: GraphData = {
  layout: 'dagre',
  nodes: [
    { id: 'repo:demo', type: 'repo', position: { x: 250, y: 0 }, data: { label: 'demo-app' } },
    { id: 'folder:src', type: 'folder', position: { x: 100, y: 120 }, data: { label: 'src', path: 'src' } },
    { id: 'folder:api', type: 'folder', position: { x: 400, y: 120 }, data: { label: 'api', path: 'api' } },
    { id: 'file:src/index.ts', type: 'file', position: { x: 50, y: 240 }, data: { label: 'index.ts', path: 'src/index.ts', extension: 'ts', fileClass: 'entry' } },
    { id: 'file:api/handler.ts', type: 'file', position: { x: 350, y: 240 }, data: { label: 'handler.ts', path: 'api/handler.ts', extension: 'ts', fileClass: 'source' } },
    { id: 'pkg:npm:react', type: 'package', position: { x: 550, y: 120 }, data: { label: 'react', ecosystem: 'npm', version: '^19' } },
    { id: 'pkg:npm:vite', type: 'package', position: { x: 550, y: 220 }, data: { label: 'vite', ecosystem: 'npm', version: '^6' } },
    { id: 'contrib:demo', type: 'contributor', position: { x: 250, y: 360 }, data: { label: 'dev', commits: 42 } },
  ],
  edges: [
    { id: 'e1', source: 'repo:demo', target: 'folder:src', type: 'contains' },
    { id: 'e2', source: 'repo:demo', target: 'folder:api', type: 'contains' },
    { id: 'e3', source: 'folder:src', target: 'file:src/index.ts', type: 'contains' },
    { id: 'e4', source: 'folder:api', target: 'file:api/handler.ts', type: 'contains' },
    { id: 'e5', source: 'repo:demo', target: 'pkg:npm:react', type: 'depends_on', animated: true },
    { id: 'e6', source: 'repo:demo', target: 'pkg:npm:vite', type: 'depends_on', animated: true },
    { id: 'e7', source: 'repo:demo', target: 'contrib:demo', type: 'contains' },
  ],
};
