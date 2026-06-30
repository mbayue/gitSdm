import type { ForceGraphNode } from '../../force/forceGraphConstants';
import { getForceNodeRadius } from '../../force/forceGraphUtils';
import { DIFF_STATUS_COLORS } from '../../force/forceGraphConstants';

interface NodePaintProps {
  node: ForceGraphNode;
  ctx: CanvasRenderingContext2D;
  globalScale: number;
  selectedNodeId: string | null;
  highlightedNodeIds: Set<string>;
  blastRadiusActive: boolean;
  compareBranch: boolean;
  hoveredForceNode: ForceGraphNode | null;
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
}: NodePaintProps) {
  const isSelected = node.id === selectedNodeId;
  const isNeighbor = highlightedNodeIds.has(node.id);
  const isDimmed = selectedNodeId && !isSelected && !isNeighbor;
  const radius = getForceNodeRadius(node);
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const diffColor =
    compareBranch && node.diffStatus
      ? DIFF_STATUS_COLORS[node.diffStatus]
      : undefined;

  ctx.globalAlpha = isDimmed ? (blastRadiusActive ? 0.08 : 0.22) : 1;

  const amberRadius = diffColor ? radius + 5.5 : radius + 2.5;

  if (node.hasOutdatedDeps) {
    ctx.beginPath();
    ctx.arc(x, y, amberRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8 / globalScale;
    ctx.globalAlpha = isDimmed ? 0.15 : 0.85;
    ctx.stroke();
    ctx.globalAlpha = isDimmed ? (blastRadiusActive ? 0.08 : 0.22) : 1;
  }

  if (diffColor) {
    ctx.beginPath();
    ctx.arc(x, y, radius + 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = diffColor;
    ctx.lineWidth = 2.5 / globalScale;
    ctx.globalAlpha = isDimmed ? 0.15 : 0.85;
    ctx.stroke();
    ctx.globalAlpha = isDimmed
      ? blastRadiusActive
        ? 0.08
        : 0.22
      : 1;
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = node.color;
  
  if (blastRadiusActive) {
    ctx.shadowColor = isSelected ? "#22d3ee" : isNeighbor ? "#0891b2" : "transparent";
    ctx.shadowBlur = isSelected ? 18 : isNeighbor ? 12 : 0;
  } else {
    // Match the Legend (Selected/Focus Node uses Violet glow, Neighbor Connections use subtle Violet/Purple)
    ctx.shadowColor = isSelected ? "#a78bfa" : isNeighbor ? "rgba(139, 92, 246, 0.35)" : "transparent";
    ctx.shadowBlur = isSelected ? 18 : isNeighbor ? 8 : 0;
  }
  
  ctx.fill();
  ctx.shadowBlur = 0;

  if (isSelected || hoveredForceNode?.id === node.id || (!blastRadiusActive && isNeighbor)) {
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    
    if (blastRadiusActive) {
      ctx.strokeStyle = isSelected ? "#22d3ee" : isNeighbor ? "#0891b2" : "#ffffff";
    } else {
      ctx.strokeStyle = isSelected 
        ? "#a78bfa" // Violet-400 (Legend Selected)
        : isNeighbor 
          ? "rgba(139, 92, 246, 0.4)" // Violet-500/40 (Legend Neighbor)
          : "#ffffff"; // Hover default
    }
    
    ctx.lineWidth = isSelected ? 1.8 / globalScale : 1.2 / globalScale;
    ctx.stroke();
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
) {
  const radius = getForceNodeRadius(node) + 3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
  ctx.fill();
}
