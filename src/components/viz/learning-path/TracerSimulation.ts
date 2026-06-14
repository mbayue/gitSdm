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
  focusedFilePath,
  setSelectedNodeId,
  setHighlightedNodeIds,
  setFocusedFilePath,
}: {
  analysis: RepoAnalysis;
  executionSteps: ExecutionStep[];
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
    (path: string): GraphNode | undefined =>
      analysis.graph.nodes.find(
        (n) => n.type === 'file' && (n.data.path === path || (n.data.path && n.data.path.endsWith(path)))
      ),
    [analysis.graph.nodes]
  );

  const focusFilePath = useCallback(
    (path: string) => {
      const node = findFileNode(path);
      const nodeId = node?.id ?? `file:${path}`;
      setSelectedNodeId(nodeId);
      setHighlightedNodeIds(new Set(connectedNodeIdsByNodeId.get(nodeId) ?? [nodeId]));
      setFocusedFilePath(node?.data.path ?? path);
    },
    [connectedNodeIdsByNodeId, findFileNode, setFocusedFilePath, setHighlightedNodeIds, setSelectedNodeId]
  );

  const resolveStepPath = useCallback(
    (step: ExecutionStep): string => {
      if (!step) return '';
      const extractFiles = (text: string) => {
        const matches = text.match(/[\w/.-]+\.[a-zA-Z0-9]+/g) || [];
        return matches.map((m) => m.trim()).filter(Boolean);
      };

      const toFiles = extractFiles(step.to);
      for (const f of toFiles) {
        const match = analysis.graph.nodes.find(
          (n) => n.data.path === f || (n.data.path && n.data.path.endsWith(f))
        );
        if (match?.data.path) return match.data.path;
      }

      const fromFiles = extractFiles(step.from);
      for (const f of fromFiles) {
        const match = analysis.graph.nodes.find(
          (n) => n.data.path === f || (n.data.path && n.data.path.endsWith(f))
        );
        if (match?.data.path) return match.data.path;
      }

      return step.to.split('(')[0].trim();
    },
    [analysis.graph.nodes]
  );

  useEffect(() => {
    if (isPlaying && executionSteps.length > 0) {
      const currentStep = executionSteps[activeStep];
      if (currentStep) {
        const path = resolveStepPath(currentStep);
        focusFilePath(path);
      }

      timerRef.current = setInterval(() => {
        setActiveStep((prev) => {
          const next = (prev + 1) % executionSteps.length;
          const nextStep = executionSteps[next];
          if (nextStep) {
            const path = resolveStepPath(nextStep);
            focusFilePath(path);
          }
          return next;
        });
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
  }, [isPlaying, executionSteps, activeStep, focusFilePath, resolveStepPath]);

  useEffect(() => {
    if (!focusedFilePath || !executionSteps.length || isPlaying) return;
    const index = executionSteps.findIndex((step) => resolveStepPath(step) === focusedFilePath);
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
