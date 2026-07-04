import { useEffect, useMemo } from 'react';
import { forceCollide, forceRadial, forceCenter } from 'd3-force';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { ForceGraphNode, ForceGraphLink } from '../../force/forceGraphConstants';
import { getForceNodeRadius } from '../../force/forceGraphUtils';

interface D3PhysicsProps {
  forceGraphRef: React.MutableRefObject<ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined>;
  nodes: ForceGraphNode[];
}

export function useD3Physics({ forceGraphRef, nodes }: D3PhysicsProps) {
  const nodeCount = nodes.length;
  const maxDegree = useMemo(
    () => Math.max(1, ...nodes.map((n) => n.degree)),
    [nodes],
  );

  useEffect(() => {
    const ref = forceGraphRef.current;
    if (!ref) return;
    const radius = Math.max(80, Math.sqrt(nodeCount) * 25);

    ref.d3Force("charge")?.strength(-150);
    ref.d3Force("link")?.distance(45).strength(0.8);
    ref.d3Force("center", forceCenter(0, 0));

    ref.d3Force(
      "radial",
      forceRadial(
        (node: unknown) => {
          const d = (node as ForceGraphNode).degree;
          const normalized = 1 - d / maxDegree;
          return radius * 0.2 + radius * 0.8 * normalized;
        },
        0,
        0
      ).strength(0.35),
    );

    ref.d3ReheatSimulation();
  }, [nodeCount, maxDegree, forceGraphRef]);

  useEffect(() => {
    if (!forceGraphRef.current) return;
    const timeout = window.setTimeout(() => {
      const g = forceGraphRef.current;
      if (!g) return;
      g.d3Force(
        "collide",
        forceCollide()
          .radius(
            (node: unknown) => getForceNodeRadius(node as ForceGraphNode) + 6,
          )
          .strength(0.5),
      );
      g.d3ReheatSimulation();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [nodes.length, forceGraphRef]);
}
