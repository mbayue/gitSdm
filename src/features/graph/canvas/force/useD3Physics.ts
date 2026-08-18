import { useEffect } from 'react';
import { forceCollide, forceCenter, forceX, forceY } from 'd3-force';
import { stratify, tree } from 'd3-hierarchy';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { ForceGraphNode, ForceGraphLink } from '../../force/forceGraphConstants';
import { getForceNodeRadius } from '../../force/forceGraphUtils';
import type { LayoutType } from '@/stores/vizStore';

interface D3PhysicsProps {
  forceGraphRef: React.MutableRefObject<ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined>;
  nodes: ForceGraphNode[];
  layoutType: LayoutType;
}

export function useD3Physics({ forceGraphRef, nodes, layoutType }: D3PhysicsProps) {
  const nodeCount = nodes.length;

  useEffect(() => {
    const ref = forceGraphRef.current;
    if (!ref) return;

    const linkForce = ref.d3Force("link");
    const links = linkForce ? (linkForce.links() as ForceGraphLink[]) : [];

    const isD3Tree = layoutType === 'd3-tree-horiz' || layoutType === 'd3-tree-vert';

    if (isD3Tree) {
      const visibleNodeIds = new Set(nodes.map(n => n.id));
      const parentMap = new Map<string, string>();
      for (const link of links) {
        if (link.type !== 'contains') continue;
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId)) {
          parentMap.set(targetId, sourceId);
        }
      }

      const virtualRootId = '__virtual_root__';
      const stratifyData = [
        { id: virtualRootId, parentId: undefined },
        ...nodes.map(n => {
          const parentId = parentMap.get(n.id);
          return {
            id: n.id,
            parentId: parentId ?? virtualRootId,
          };
        })
      ];

      try {
        const rootHierarchy = stratify<typeof stratifyData[0]>()
          .id(d => d.id)
          .parentId(d => d.parentId)(stratifyData);

        const isVert = layoutType === 'd3-tree-vert';
        const layout = tree<typeof stratifyData[0]>().nodeSize(isVert ? [35, 95] : [16, 95]);
        layout(rootHierarchy);

        const coords = new Map<string, { x: number, y: number }>();
        rootHierarchy.descendants().forEach(d => {
          if (d.id === virtualRootId) return;
          coords.set(d.id!, {
            x: isVert ? (d.x ?? 0) : (d.y ?? 0),
            y: isVert ? (d.y ?? 0) : (d.x ?? 0)
          });
        });

        for (const node of nodes) {
          const pos = coords.get(node.id);
          if (pos) {
            node.fx = pos.x;
            node.fy = pos.y;
            node.packedRadius = undefined;
          } else {
            node.fx = undefined;
            node.fy = undefined;
            node.packedRadius = undefined;
          }
        }
      } catch (err) {
        console.error('Failed to compute D3 tree layout:', err);
      }
    } else {
      for (const node of nodes) {
        node.fx = undefined;
        node.fy = undefined;
        node.packedRadius = undefined;
      }

      const chargeStrength = Math.max(-400, -180 - Math.sqrt(nodeCount) * 20);
      ref.d3Force("charge")?.strength(chargeStrength);

      if (linkForce) {
        linkForce
          .distance((link: unknown) => {
            const l = link as ForceGraphLink;
            if (l.type === 'contains') return 40;
            return 115;
          })
          .strength((link: unknown) => {
            const l = link as ForceGraphLink;
            if (l.type === 'contains') return 1.0;
            return 0.15;
          });
      }

      ref.d3Force("center", forceCenter(0, 0));
      ref.d3Force("forceX", forceX(0).strength(0.04));
      ref.d3Force("forceY", forceY(0).strength(0.04));
      ref.d3Force("radial", null);
    }

    ref.d3ReheatSimulation();
  }, [nodeCount, layoutType, forceGraphRef, nodes]);

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
