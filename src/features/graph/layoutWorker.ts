/// <reference lib="webworker" />
import { getLayoutedElements } from './layoutClient';
import type { Node, Edge } from '@xyflow/react';

self.onmessage = (e: MessageEvent) => {
  const { nodes, edges, layoutType, reqId } = e.data as {
    nodes: Node[];
    edges: Edge[];
    layoutType: 'force' | 'network';
    reqId: number;
  };
  
  try {
    const result = getLayoutedElements(nodes, edges, layoutType);
    self.postMessage({ type: 'SUCCESS', reqId, result });
  } catch (error) {
    self.postMessage({ type: 'ERROR', reqId, error: String(error) });
  }
};
