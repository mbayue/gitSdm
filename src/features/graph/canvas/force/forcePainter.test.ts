import { describe, expect, it, mock } from 'bun:test';
import { drawForceNode } from './forcePainter';
import type { ForceGraphNode } from '../../force/forceGraphConstants';

const node: ForceGraphNode = {
  id: 'entry', label: 'index.ts', community: 'src', communityName: 'src',
  fileType: 'ts', nodeType: 'file', degree: 1, color: '#3b82f6', x: 0, y: 0,
};

function paint(theme: 'light' | 'dark', churnScore?: number, globalScale = 2, nodeCount = 500) {
  const labels: string[] = [];
  const fills: string[] = [];
  const context = {
    fillStyle: '', strokeStyle: '', globalAlpha: 1,
    beginPath: mock(), arc: mock(), stroke: mock(),
    fill() { fills.push(this.fillStyle); },
    fillText() { labels.push(this.fillStyle); },
  };
  drawForceNode({
    node: { ...node, churnScore }, ctx: context as unknown as CanvasRenderingContext2D,
    theme, globalScale, nodeCount, selectedNodeId: null, highlightedNodeIds: new Set(),
    blastRadiusActive: false, compareBranch: false, hoveredForceNode: null,
    colorMode: churnScore === undefined ? 'default' : 'churn',
  });
  return { labels, fills, context };
}

describe('graph canvas theme', () => {
  it('keeps a small repository readable at fitted and default zoom levels', () => {
    for (const scale of [0.7, 1, 1.15]) {
      expect(paint('dark', undefined, scale, 28).labels).toHaveLength(1);
    }
  });

  it('avoids labeling every node in a large zoomed-out graph', () => {
    expect(paint('dark', undefined, 0.7, 500).labels).toHaveLength(0);
  });
  it('paints dark labels on light canvases without changing category colors', () => {
    const { labels, fills } = paint('light');
    expect(labels).toEqual(['#333333']);
    expect(fills).toEqual([node.color]);
  });

  it('keeps light labels on dark canvases', () => {
    expect(paint('dark').labels).toEqual(['rgba(245,245,255,0.92)']);
  });

  it('outlines white heatmap nodes so they remain visible in light mode', () => {
    const { fills, context } = paint('light', 0);
    expect(fills).toEqual(['#ffffff']);
    expect(context.stroke).toHaveBeenCalledTimes(1);
    expect(context.strokeStyle).toBe('rgba(0,0,0,0.3)');
  });
});
