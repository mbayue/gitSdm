import { useEffect } from 'react';
import { forceCollide, forceRadial } from 'd3-force';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { ForceGraphNode, ForceGraphLink } from '../../force/forceGraphConstants';
import { getForceNodeRadius } from '../../force/forceGraphUtils';

interface D3PhysicsProps {
  layoutType: string;
  forceGraphRef: React.MutableRefObject<ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined>;
  nodes: ForceGraphNode[];
}

export function useD3Physics({ layoutType, forceGraphRef, nodes }: D3PhysicsProps) {
  useEffect(() => {
    if (layoutType !== "network") return;
    const ref = forceGraphRef.current;
    if (!ref) return;
    const nodeCount = nodes.length;
    const radius = Math.max(80, Math.sqrt(nodeCount) * 18);

    ref.d3Force("charge")?.strength(-100);
    ref.d3Force("link")?.distance(30).strength(0.8);

    const maxDegree = Math.max(1, ...nodes.map((n) => n.degree));
    ref.d3Force(
      "radial",
      forceRadial(
        (node: unknown) => {
          const d = (node as ForceGraphNode).degree;
          const normalized = 1 - d / maxDegree;
          return radius * 0.2 + radius * 0.8 * normalized;
        },
        0,
        0,
      ).strength(0.3),
    );

    ref.d3ReheatSimulation();
  }, [layoutType, nodes, forceGraphRef]);

  useEffect(() => {
    if (layoutType !== "network" || !forceGraphRef.current) return;
    const timeout = window.setTimeout(() => {
      const g = forceGraphRef.current;
      if (!g) return;
      g.d3Force(
        "collide",
        forceCollide()
          .radius(
            (node: unknown) => getForceNodeRadius(node as ForceGraphNode) + 4,
          )
          .strength(0.35),
      );
      g.d3ReheatSimulation();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [layoutType, nodes.length, forceGraphRef]);
}
