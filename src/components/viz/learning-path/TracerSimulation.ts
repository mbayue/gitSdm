import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GraphNode, RepoAnalysis } from '@/types';

export interface ExecutionStep {
  from: string;
  to: string;
  description: string;
}

export function useTracerSimulation({
  analysis,
  executionSteps,
  visualSteps,
  focusedFilePath,
  setSelectedNodeId,
  setHighlightedNodeIds,
  setFocusedFilePath,
}: {
  analysis: RepoAnalysis;
  executionSteps: ExecutionStep[];
  visualSteps?: string[];
  focusedFilePath: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setHighlightedNodeIds: (ids: Set<string>) => void;
  setFocusedFilePath: (path: string | null) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connectedNodeIdsByNodeId = useMemo(() => {
    const lookup = new Map<string, Set<string>>();
    for (const edge of analysis.graph.edges) {
      if (!lookup.has(edge.source)) lookup.set(edge.source, new Set([edge.source]));
      if (!lookup.has(edge.target)) lookup.set(edge.target, new Set([edge.target]));
      lookup.get(edge.source)?.add(edge.target);
      lookup.get(edge.target)?.add(edge.source);
    }
    return lookup;
  }, [analysis.graph.edges]);

  const findFileNode = useCallback(
    (path: string): GraphNode | undefined => {
      const exactMatch = analysis.graph.nodes.find((n) => n.type === 'file' && n.data.path === path);
      if (exactMatch) return exactMatch;

      const endsWithMatches = analysis.graph.nodes.filter(
        (n) => n.type === 'file' && n.data.path && n.data.path.endsWith(path)
      );
      if (endsWithMatches.length === 1) return endsWithMatches[0];

      return endsWithMatches.find((n) => n.data.path === `/${path}` || n.data.path === `./${path}`);
    },
    [analysis.graph.nodes]
  );

  const focusFilePath = useCallback(
    (path: string) => {
      const node = findFileNode(path);
      if (!node) return;
      const nodeId = node.id;
      setSelectedNodeId(nodeId);
      setHighlightedNodeIds(new Set(connectedNodeIdsByNodeId.get(nodeId) ?? [nodeId]));
      setFocusedFilePath(node.data.path ?? path);
    },
    [connectedNodeIdsByNodeId, findFileNode, setFocusedFilePath, setHighlightedNodeIds, setSelectedNodeId]
  );

  const resolveStepPath = useCallback(
    (step: ExecutionStep, stepIndex: number): string => {
      if (!step) return '';

      if (visualSteps && visualSteps[stepIndex]) {
        const visualPath = visualSteps[stepIndex];
        const node = findFileNode(visualPath);
        if (node?.data.path) return node.data.path;
      }

      const extractFiles = (text: string) => {
        const matches = text.match(/[\w/.-]+\.[a-zA-Z0-9]+/g) || [];
        return matches.map((m) => m.trim()).filter(Boolean);
      };

      const toFiles = extractFiles(step.to);
      for (const f of toFiles) {
        const node = findFileNode(f);
        if (node?.data.path) return node.data.path;
      }

      const fromFiles = extractFiles(step.from);
      for (const f of fromFiles) {
        const node = findFileNode(f);
        if (node?.data.path) return node.data.path;
      }

      return step.to.split('(')[0].trim();
    },
    [visualSteps, findFileNode]
  );

  useEffect(() => {
    if (isPlaying && executionSteps.length > 0) {
      timerRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % executionSteps.length);
      }, 3500);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, executionSteps.length]);

  useEffect(() => {
    if (isPlaying && executionSteps.length > 0) {
      const currentStep = executionSteps[activeStep];
      if (currentStep) {
        const path = resolveStepPath(currentStep, activeStep);
        focusFilePath(path);
      }
    }
  }, [activeStep, isPlaying, executionSteps, focusFilePath, resolveStepPath]);

  useEffect(() => {
    if (!focusedFilePath || !executionSteps.length || isPlaying) return;
    const index = executionSteps.findIndex((step, idx) => resolveStepPath(step, idx) === focusedFilePath);
    if (index !== -1) {
      setActiveStep(index);
    }
  }, [focusedFilePath, executionSteps, isPlaying, resolveStepPath]);

  return {
    isPlaying,
    setIsPlaying,
    activeStep,
    setActiveStep,
    focusFilePath,
    resolveStepPath,
  };
}
