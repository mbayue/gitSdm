import type { Node } from '@xyflow/react';
import type { GraphNode } from '@/types';

export function getNodeClassName(
  node: GraphNode | Node,
  selectedId: string | null,
  highlighted: Set<string>,
  blastRadiusActive: boolean,
): string {
  if (!selectedId) return "";
  if (node.id === selectedId)
    return blastRadiusActive ? "selected epicenter-pulse" : "selected";
  if (highlighted.has(node.id))
    return blastRadiusActive ? "affected-highlight" : "highlighted-neighbor";
  return "dimmed";
}

export function getEdgeStyle(
  edge: { source: string; target: string; type?: string },
  selectedId: string | null,
  highlighted: Set<string>,
  nodes: Map<string, Node>,
  theme: "dark" | "light",
  blastRadiusActive: boolean,
): React.CSSProperties {
  const targetNode = nodes.get(edge.target);
  const sourceNode = nodes.get(edge.source);
  const isDeleted =
    targetNode?.data?.diffStatus === "deleted" ||
    sourceNode?.data?.diffStatus === "deleted";

  if (isDeleted) {
    return {
      stroke:
        theme === "dark"
          ? "rgba(239, 68, 68, 0.35)"
          : "rgba(239, 68, 68, 0.25)",
      strokeWidth: 1.2,
      strokeDasharray: "3,3",
    };
  }

  if (blastRadiusActive) {
    if (
      edge.type === "imports" &&
      highlighted.has(edge.source) &&
      highlighted.has(edge.target)
    ) {
      return {
        stroke: edge.target === selectedId ? "#22d3ee" : "#0891b2",
        strokeWidth: 2,
        opacity: 1,
        transition: "stroke 0.2s, stroke-width 0.2s",
      };
    }
    return {
      stroke:
        theme === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
      strokeWidth: 1,
      opacity: 0.12,
      transition: "stroke 0.2s, stroke-width 0.2s",
    };
  }

  const defaultColor = sourceNode?.data?.nodeColor as string || (theme === "dark" ? "rgba(255, 255, 255, 0.24)" : "rgba(0, 0, 0, 0.15)");
  const defaultStyle = {
    stroke: defaultColor,
    strokeWidth: theme === "dark" ? 1.35 : 1.2,
    opacity: selectedId ? 0.12 : 0.42, // slightly transparent when idle, 12% transparent when another node is selected
    transition: "stroke 0.2s, stroke-width 0.2s, opacity 0.2s",
  };
  if (!selectedId) return defaultStyle;

  const isConnected = edge.source === selectedId || edge.target === selectedId;
  if (isConnected) {
    return {
      stroke: (sourceNode?.data?.nodeColor as string) || (targetNode?.data?.nodeColor as string) || "#fbbf24",
      strokeWidth: 2,
      opacity: 1,
      transition: "stroke 0.2s, stroke-width 0.2s",
    };
  }

  if (highlighted.has(edge.source) && highlighted.has(edge.target)) {
    return {
      stroke:
        theme === "dark" ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.35)",
      strokeWidth: theme === "dark" ? 1.45 : 1.2,
      opacity: 0.8,
      transition: "stroke 0.2s, stroke-width 0.2s",
    };
  }

  return {
    stroke:
      theme === "dark" ? "rgba(255, 255, 255, 0.11)" : "rgba(0, 0, 0, 0.05)",
    strokeWidth: 1,
    opacity: 0.12,
    transition: "stroke 0.2s, stroke-width 0.2s",
  };
}
