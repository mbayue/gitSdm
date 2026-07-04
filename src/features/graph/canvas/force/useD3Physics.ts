import { useEffect } from 'react';
import { forceCollide, forceCenter, forceX, forceY } from 'd3-force';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { ForceGraphNode, ForceGraphLink } from '../../force/forceGraphConstants';
import { getForceNodeRadius } from '../../force/forceGraphUtils';

interface D3PhysicsProps {
  forceGraphRef: React.MutableRefObject<ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined>;
  nodes: ForceGraphNode[];
}

export function useD3Physics({ forceGraphRef, nodes }: D3PhysicsProps) {
  const nodeCount = nodes.length;

  useEffect(() => {
    const ref = forceGraphRef.current;
    if (!ref) return;

    const chargeStrength = Math.max(-200, -80 - Math.sqrt(nodeCount) * 10);
    ref.d3Force("charge")?.strength(chargeStrength);

    const linkForce = ref.d3Force("link");
    if (linkForce) {
      linkForce
        .distance((link: unknown) => {
          const l = link as ForceGraphLink;
          if (l.type === 'contains') return 12;
          return 75;
        })
        .strength((link: unknown) => {
          const l = link as ForceGraphLink;
          if (l.type === 'contains') return 1.0;
          return 0.15;
        });
    }

    ref.d3Force("center", forceCenter(0, 0));

    ref.d3Force("forceX", forceX(0).strength(0.06));
    ref.d3Force("forceY", forceY(0).strength(0.06));

    ref.d3Force("radial", null);

    ref.d3ReheatSimulation();
  }, [nodeCount, forceGraphRef]);

  useEffect(() => {
    if (!forceGraphRef.current) return;
    const timeout = window.setTimeout(() => {
      const g = forceGraphRef.current;
      if (!g) return;
      g.d3Force(
        "collide",
        forceCollide()
          .radius(
            (node: unknown) => getForceNodeRadius(node as ForceGraphNode) + 5,
          )
          .strength(0.7),
      );
      g.d3ReheatSimulation();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [nodes.length, forceGraphRef]);
}
