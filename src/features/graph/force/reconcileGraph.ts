import type { ForceGraphNode, ForceGraphLink } from './forceGraphConstants';

type Data = { nodes: ForceGraphNode[]; links: ForceGraphLink[] };
/** Keep simulation objects for metric-only updates; topology changes get fresh data. */
export function reconcileGraph(previous: Data | undefined, next: Data): Data {
  if (!previous || previous.nodes.length !== next.nodes.length || previous.links.length !== next.links.length)
    return next;
  const id = (value: ForceGraphLink['source']) => (typeof value === 'object' ? value.id : value);
  if (
    next.nodes.some((node, i) => node.id !== previous.nodes[i].id) ||
    next.links.some((link, i) => {
      const old = previous.links[i];
      return id(link.source) !== id(old.source) || id(link.target) !== id(old.target) || link.type !== old.type;
    })
  )
    return next;
  next.nodes.forEach((node, i) => Object.assign(previous.nodes[i], node));
  // New wrapper identity makes ForceGraph2D re-digest and repaint metadata,
  // while the same node/link objects keep their simulation coordinates.
  return { nodes: [...previous.nodes], links: [...previous.links] };
}
