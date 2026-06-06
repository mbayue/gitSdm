import { describe, it, expect } from 'bun:test';
import { applyDagreLayout } from './layout';
import { getNodeCircleColor, getNodeCircleSize } from './node-colors';
import type { GraphNode, GraphEdge } from '../../src/types';

describe('graph layout and visualization utilities', () => {
  describe('applyDagreLayout', () => {
    it('sets coordinates for nodes in TB layout', () => {
      const nodes: GraphNode[] = [
        { id: 'nodeA', type: 'file', position: { x: 0, y: 0 }, data: { label: 'A' } },
        { id: 'nodeB', type: 'file', position: { x: 0, y: 0 }, data: { label: 'B' } },
      ];
      const edges: GraphEdge[] = [
        { id: 'e1', source: 'nodeA', target: 'nodeB' },
      ];

      const laidOut = applyDagreLayout(nodes, edges, 'TB');
      expect(laidOut[0].position.x).toBeDefined();
      expect(laidOut[0].position.y).toBeDefined();
      
      // B should be lower than A in top-to-bottom layout
      expect(laidOut[1].position.y).toBeGreaterThan(laidOut[0].position.y);
    });

    it('sets coordinates for nodes in LR layout', () => {
      const nodes: GraphNode[] = [
        { id: 'nodeA', type: 'file', position: { x: 0, y: 0 }, data: { label: 'A' } },
        { id: 'nodeB', type: 'file', position: { x: 0, y: 0 }, data: { label: 'B' } },
      ];
      const edges: GraphEdge[] = [
        { id: 'e1', source: 'nodeA', target: 'nodeB' },
      ];

      const laidOut = applyDagreLayout(nodes, edges, 'LR');
      // B should be further right than A in left-to-right layout
      expect(laidOut[1].position.x).toBeGreaterThan(laidOut[0].position.x);
    });

    it('gracefully handles empty nodes list', () => {
      const laidOut = applyDagreLayout([], [], 'TB');
      expect(laidOut).toEqual([]);
    });
  });

  describe('node-colors', () => {
    it('assigns correct colors to standard node types', () => {
      expect(getNodeCircleColor('repo', 'my-repo')).toBe('#a78bfa');
      expect(getNodeCircleColor('folder', 'src')).toBe('#fbbf24');
    });

    it('assigns correct colors to files based on extension', () => {
      expect(getNodeCircleColor('file', 'index.ts', 'ts')).toBe('#3b82f6');
      expect(getNodeCircleColor('file', 'App.jsx')).toBe('#facc15'); // falls back to extension from name
      expect(getNodeCircleColor('file', 'unknown.xyz')).toBe('#9ca3af'); // falls back to grey
    });

    it('returns correct sizes for node types', () => {
      expect(getNodeCircleSize('repo')).toBe(14);
      expect(getNodeCircleSize('folder')).toBe(12);
      expect(getNodeCircleSize('file')).toBe(8);
    });
  });
});
