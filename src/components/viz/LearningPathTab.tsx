import { useEffect, useState, useRef } from 'react';
import { useLearningPath } from '@/features/ai/useAI';
import { useVizStore } from '@/stores/viz-store';
import type { RepoAnalysis } from '@/types';
import {
  Play, Pause, Compass, Brain,
  RefreshCw, Zap, ShieldAlert, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { AIErrorCard } from './AIErrorCard';

export function LearningPathTab({ analysis }: { analysis: RepoAnalysis }) {
  const { owner, repo } = analysis.meta;
  const selectedBranch = useVizStore((s) => s.selectedBranch);
  const activeFocusLayer = useVizStore((s) => s.activeFocusLayer);
  const setActiveFocusLayer = useVizStore((s) => s.setActiveFocusLayer);
  const focusedFilePath = useVizStore((s) => s.focusedFilePath);
  const setFocusedFilePath = useVizStore((s) => s.setFocusedFilePath);
  const setInspectorOpen = useVizStore((s) => s.setInspectorOpen);

  const lp = useLearningPath(owner, repo, selectedBranch);

  // Execution flow simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset simulation state when repo or branch changes
  useEffect(() => {
    setIsPlaying(false);
    setActiveStep(0);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [owner, repo, selectedBranch]);

  const data = lp.data;
  const executionSteps = data?.executionFlow?.steps ?? [];

  // Play/Pause execution tracer simulation
  useEffect(() => {
    if (isPlaying && executionSteps.length > 0) {
      // Focus first step immediately
      const currentStep = executionSteps[activeStep];
      if (currentStep) {
        const toPath = currentStep.to.split('(')[0].trim();
        const fromPath = currentStep.from.split('(')[0].trim();
        const path = analysis.graph.nodes.some(n => n.data.path === toPath) ? toPath : fromPath;
        setFocusedFilePath(path);
        setInspectorOpen(true);
      }

      timerRef.current = setInterval(() => {
        setActiveStep((prev) => {
          const next = (prev + 1) % executionSteps.length;
          const nextStep = executionSteps[next];
          if (nextStep) {
            const toPath = nextStep.to.split('(')[0].trim();
            const fromPath = nextStep.from.split('(')[0].trim();
            const path = analysis.graph.nodes.some(n => n.data.path === toPath) ? toPath : fromPath;
            setFocusedFilePath(path);
            setInspectorOpen(true);
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
  }, [isPlaying, executionSteps, activeStep, setFocusedFilePath, setInspectorOpen, analysis.graph.nodes]);

  // Sync activeStep with focusedFilePath when focusedFilePath changes
  useEffect(() => {
    if (!focusedFilePath || !executionSteps.length || isPlaying) return;
    const index = executionSteps.findIndex((step) => {
      const toPath = step.to.split('(')[0].trim();
      const fromPath = step.from.split('(')[0].trim();
      return toPath === focusedFilePath || fromPath === focusedFilePath;
    });
    setActiveStep(index);
  }, [focusedFilePath, executionSteps, isPlaying]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    const step = executionSteps[index];
    if (step) {
      const toPath = step.to.split('(')[0].trim();
      const fromPath = step.from.split('(')[0].trim();
      const path = analysis.graph.nodes.some(n => n.data.path === toPath) ? toPath : fromPath;
      setFocusedFilePath(path);
      setInspectorOpen(true);
    }
  };

  const handleFileClick = (path: string) => {
    setFocusedFilePath(path);
    setInspectorOpen(true);
  };

  const handleRefresh = () => {
    lp.refetch();
  };

  if (lp.isPending) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-zinc-800 animate-pulse" />
          <div className="h-20 w-full rounded-xl bg-zinc-800 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-36 rounded bg-zinc-800 animate-pulse" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-3 items-center">
              <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-2/3 rounded bg-zinc-800 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-zinc-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (lp.isError) {
    return (
      <div className="p-4">
        <AIErrorCard
          title="Failed to build learning path"
          message={lp.error instanceof Error ? lp.error.message : String(lp.error)}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-red-500/80 mb-3" />
        <h4 className="text-sm font-medium text-white mb-1">No learning path data available</h4>
        <p className="text-xs text-zinc-500 max-w-[240px] mb-4">
          Try clicking retry to generate AI onboarding paths for this repository.
        </p>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Generate Path
        </button>
      </div>
    );
  }

  const focusLayers = [
    { id: 'all' as const, label: 'All Files' },
    { id: 'api' as const, label: 'API / Routes' },
    { id: 'ui' as const, label: 'UI / Components' },
    { id: 'core' as const, label: 'Core Services' },
    { id: 'config' as const, label: 'Configuration' }
  ];

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto max-h-full pb-20 select-none">
      {/* Mental Model Section */}
      <div className="relative rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4 backdrop-blur-md">
        <div className="absolute top-0 right-0 p-2 opacity-30">
          <Brain className="h-12 w-12 text-violet-400" />
        </div>
        <span className="inline-flex items-center gap-1 rounded bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400 border border-violet-500/20">
          <Compass className="h-3 w-3" />
          {data.mentalModel?.type || 'Repository Architecture'}
        </span>
        <h3 className="text-sm font-semibold text-white mt-2 font-mono">
          {data.mentalModel?.concept || 'Ingestion Pipeline'}
        </h3>
        <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
          {data.mentalModel?.description}
        </p>
      </div>

      {/* Smart Focus Filters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Smart Focus Layers
          </h4>
          <span className="text-[10px] text-zinc-400 font-mono">Isolates graph modules</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {focusLayers.map((layer) => {
            const isActive = activeFocusLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveFocusLayer(layer.id)}
                className={cn(
                  'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'border-violet-500/35 bg-violet-500/12 text-violet-300'
                    : 'border-white/[0.05] bg-zinc-950/30 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
                )}
              >
                {layer.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended Learning Path */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recommended learning order
          </h4>
          <span className="text-[10px] text-violet-400 font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Roadmap
          </span>
        </div>

        <div className="space-y-2.5">
          {data.recommendedPath?.map((item, idx) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleFileClick(item.path)}
              className="group flex gap-3.5 items-start rounded-xl border border-white/[0.04] bg-zinc-950/20 hover:bg-zinc-900/40 hover:border-white/10 p-3.5 cursor-pointer transition-all duration-200"
            >
              {/* Index & score circle */}
              <div className="relative shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs font-mono text-zinc-400 group-hover:border-violet-500/30 group-hover:text-violet-300 transition-colors">
                {idx + 1}
                <div
                  className="absolute inset-0 rounded-lg border-2 border-violet-500/20"
                  style={{
                    clipPath: `inset(${(100 - item.importance)}% 0px 0px 0px)`
                  }}
                />
              </div>

              {/* Path and details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-zinc-200 group-hover:text-white truncate">
                    {item.path.split('/').pop()}
                  </span>
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {item.role}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                  {item.path}
                </p>
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed font-sans line-clamp-3">
                  {item.reason}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Execution Flow simulation tracer */}
      {executionSteps.length > 0 && (
        <div className="rounded-xl border border-white/[0.05] bg-zinc-950/40 p-4">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Runtime Execution Trace
              </h4>
            </div>
            <button
              onClick={() => {
                if (!isPlaying && activeStep === -1) {
                  setActiveStep(0);
                }
                setIsPlaying(!isPlaying);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold tracking-wide transition-all shadow-sm",
                isPlaying
                  ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                  : "bg-white text-zinc-950 hover:bg-zinc-100"
              )}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3 fill-current" /> Pause Trace
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" /> Trace Flow
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
            Animates the active runtime pipeline path on the graph canvas and steps through key component files.
          </p>

          {/* Timeline steps */}
          <div className="relative border-l border-white/[0.06] ml-2.5 pl-4 space-y-4">
            {data.executionFlow?.steps?.map((step, sIdx) => {
              const isActive = activeStep === sIdx;
              return (
                <div
                  key={sIdx}
                  onClick={() => handleStepClick(sIdx)}
                  className="relative group/step cursor-pointer"
                >
                  {/* Step node indicator */}
                  <div
                    className={cn(
                      "absolute -left-[21.5px] top-0.5 h-2.5 w-2.5 rounded-full border transition-all duration-150",
                      isActive
                        ? "bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-110"
                        : "bg-zinc-950 border-white/20 group-hover/step:border-white/50"
                    )}
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[10px] font-mono leading-none transition-colors",
                        isActive ? "text-amber-400 font-bold" : "text-zinc-400 group-hover/step:text-zinc-200"
                      )}
                    >
                      {step.from} → {step.to}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Developer Insights, Risks & Suggestions */}
      <div className="space-y-3.5">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
            Architecture Insights
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed border-l-2 border-violet-500/30 pl-3">
            {data.insights?.architecture}
          </p>
        </div>

        {data.insights?.risks?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400/90 mb-2">
              Detected Architecture Risks
            </h4>
            <ul className="space-y-1.5 pl-1.5">
              {data.insights.risks.map((risk, rIdx) => (
                <li key={rIdx} className="flex gap-2 items-start text-xs text-zinc-400">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-500/70 shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.insights?.suggestions?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-400/90 mb-2">
              Onboarding Suggestions
            </h4>
            <ul className="space-y-1.5 pl-1.5">
              {data.insights.suggestions.map((suggestion, sIdx) => (
                <li key={sIdx} className="flex gap-2 items-start text-xs text-zinc-400">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500/70 shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
