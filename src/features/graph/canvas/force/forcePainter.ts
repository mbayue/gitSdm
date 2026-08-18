import type { ForceGraphNode } from '../../force/forceGraphConstants';
import { getForceNodeRadius } from '../../force/forceGraphUtils';
import {
  DIFF_STATUS_COLORS,
  GRAPH_NODE_LAYER_OFFSETS,
  GRAPH_NODE_PALETTES,
} from '../../force/forceGraphConstants';
import type { ColorMode, SizeMode } from '@/stores/vizStore';

interface NodePaintProps {
  node: ForceGraphNode;
  ctx: CanvasRenderingContext2D;
  globalScale: number;
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string>;
  blastRadiusActive: boolean;
  compareBranch: boolean;
  hoveredForceNode: ForceGraphNode | null;
  colorMode?: ColorMode;
  sizeMode?: SizeMode;
}

/** Map a 0-1 score to a color from the given 5-stop gradient */
function heatmapColor(score: number, stops: readonly string[]): string {
  if (score <= 0) return stops[0];
  if (score >= 1) return stops[stops.length - 1];
  const pos = score * (stops.length - 1);
  const i = Math.floor(pos);
  const t = pos - i;
  const a = i >= stops.length - 1 ? stops[stops.length - 1] : stops[i];
  const b = i >= stops.length - 1 ? stops[stops.length - 1] : stops[i + 1];
  return lerpColor(a, b, t);
}

function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b_ = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${b_})`;
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  strokeStyle: string,
  lineWidth: number,
  globalScale: number,
  alpha: number,
  dash?: number[],
): void {
  const prevAlpha = ctx.globalAlpha;
  const prevDash = ctx.getLineDash();
  ctx.globalAlpha = alpha;
  ctx.setLineDash(dash ?? []);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth / globalScale;
  ctx.stroke();
  ctx.setLineDash(prevDash);
  ctx.globalAlpha = prevAlpha;
}

/** Resolve node fill color based on current overlay mode */
function resolveNodeColor(node: ForceGraphNode, colorMode: ColorMode): string {
  if (colorMode === 'churn' && node.churnScore != null) {
    return heatmapColor(node.churnScore, GRAPH_NODE_PALETTES.churn);
  }
  if (colorMode === 'complexity' && node.complexityScore != null) {
    return heatmapColor(node.complexityScore, GRAPH_NODE_PALETTES.complexity);
  }
  return node.color;
}

export function drawForceNode({
  node,
  ctx,
  globalScale,
  selectedNodeId,
  highlightedNodeIds,
  blastRadiusActive,
  compareBranch,
  hoveredForceNode,
  colorMode = 'default',
  sizeMode = 'default',
}: NodePaintProps) {
  const isSelected = node.id === selectedNodeId;
  const isNeighbor = highlightedNodeIds.has(node.id);
  const isDimmed = selectedNodeId && !isSelected && !isNeighbor;
  const radius = getForceNodeRadius(node, sizeMode);
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const diffColor =
    compareBranch && node.diffStatus
      ? DIFF_STATUS_COLORS[node.diffStatus]
      : undefined;
  const compareRingRadius = radius + GRAPH_NODE_LAYER_OFFSETS.compareRing;
  const multiAuthorRadius = radius + GRAPH_NODE_LAYER_OFFSETS.multiAuthor;
  const selectionRingRadius = radius + GRAPH_NODE_LAYER_OFFSETS.selection;

  ctx.globalAlpha = isDimmed ? (blastRadiusActive ? 0.08 : 0.22) : 1;

  if (diffColor) {
    drawRing(
      ctx,
      x,
      y,
      compareRingRadius,
      diffColor,
      2.5,
      globalScale,
      isDimmed ? 0.15 : 0.85,
    );
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = resolveNodeColor(node, colorMode);
  
  if (blastRadiusActive) {
    ctx.shadowColor = isSelected ? "#22d3ee" : isNeighbor ? "#0891b2" : "transparent";
    ctx.shadowBlur = isSelected ? 18 : isNeighbor ? 12 : 0;
  } else {
    ctx.shadowColor = isSelected ? "#a78bfa" : isNeighbor ? "rgba(139, 92, 246, 0.35)" : "transparent";
    ctx.shadowBlur = isSelected ? 18 : isNeighbor ? 8 : 0;
  }
  
  ctx.fill();
  ctx.shadowBlur = 0;

  if (colorMode === 'churn' && node.authorCount != null && node.authorCount >= 3) {
    if (globalScale >= 0.75) {
      drawRing(
        ctx,
        x,
        y,
        multiAuthorRadius,
        GRAPH_NODE_PALETTES.multiAuthor,
        2.2,
        globalScale,
        isDimmed ? 0.35 : 0.85,
        [5, 3],
      );
    }
  }

  if (isSelected || hoveredForceNode?.id === node.id || (!blastRadiusActive && isNeighbor)) {
    const strokeStyle = blastRadiusActive
      ? isSelected
        ? GRAPH_NODE_PALETTES.blastSelection
        : isNeighbor
          ? 'rgba(8,145,178,0.95)'
          : '#ffffff'
      : isSelected
        ? GRAPH_NODE_PALETTES.standardSelection
        : isNeighbor
          ? 'rgba(139,92,246,0.4)'
          : '#ffffff';

    drawRing(
      ctx,
      x,
      y,
      selectionRingRadius,
      strokeStyle,
      isSelected ? 1.8 : 1.2,
      globalScale,
      1,
    );
  }

  if (
    isSelected ||
    hoveredForceNode?.id === node.id ||
    globalScale > 1.15
  ) {
    const fontSize = Math.max(10 / globalScale, 3.8);
    ctx.font = `${fontSize}px Inter, ui-sans-serif, system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(245,245,255,0.92)";
    ctx.fillText(node.label, x, y + radius + 3 / globalScale);
  }

  if (node.hasOutdatedDeps && globalScale > 0.4) {
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = isDimmed ? 0.85 : 1.0;

    const badgeRadius = Math.max(4.5 / globalScale, 2.5);
    const bx = x + radius * 0.75;
    const by = y - radius * 0.75;
    ctx.beginPath();
    ctx.arc(bx, by, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(7 / globalScale, 4.5)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', bx, by);

    ctx.globalAlpha = prevAlpha;
  }

  ctx.globalAlpha = 1;
}

export function drawForcePointerArea(
  node: ForceGraphNode,
  color: string,
  ctx: CanvasRenderingContext2D,
  sizeMode?: SizeMode,
) {
  const radius = getForceNodeRadius(node, sizeMode) + 3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
  ctx.fill();
}
