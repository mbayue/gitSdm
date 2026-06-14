import { useEffect } from 'react';
import { useLearningPath } from '@/features/ai/useAiTasks';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import {
  Compass, RefreshCw, ShieldAlert, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

import { AIErrorCard } from './AIErrorCard';

// Decoupled subcomponents
import { useTracerSimulation } from './learning-path/TracerSimulation';
import { FocusLayers } from './learning-path/FocusLayers';
import { TracerPlayer } from './learning-path/TracerPlayer';

export function LearningPathTab({ analysis }: { analysis: RepoAnalysis }) {
  const { owner, repo } = analysis.meta;
  const selectedBranch = useVizStore((s) => s.selectedBranch);
  const activeFocusLayer = useVizStore((s) => s.activeFocusLayer);
  const setActiveFocusLayer = useVizStore((s) => s.setActiveFocusLayer);
  const focusedFilePath = useVizStore((s) => s.focusedFilePath);
  const setFocusedFilePath = useVizStore((s) => s.setFocusedFilePath);
  const setSelectedNodeId = useVizStore((s) => s.setSelectedNodeId);
  const setHighlightedNodeIds = useVizStore((s) => s.setHighlightedNodeIds);

  const lp = useLearningPath(owner, repo, selectedBranch);

  const data = lp.data;
  const executionSteps = data?.executionFlow?.steps ?? [];

  const {
    isPlaying,
    setIsPlaying,
    activeStep,
    setActiveStep,
    focusFilePath,
    resolveStepPath,
  } = useTracerSimulation({
    analysis,
    executionSteps,
    focusedFilePath,
    setSelectedNodeId,
    setHighlightedNodeIds,
    setFocusedFilePath,
  });

  // Reset simulation state when repo or branch changes
  useEffect(() => {
    setIsPlaying(false);
    setActiveStep(0);
  }, [owner, repo, selectedBranch, setIsPlaying, setActiveStep]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    const step = executionSteps[index];
    if (step) {
      const path = resolveStepPath(step);
      focusFilePath(path);
    }
  };

  const handleFileClick = (path: string) => {
    focusFilePath(path);
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

  return (
    <div className="space-y-5 select-none">
      {/* Mental Model Section */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium bg-black/20 border border-white/[0.03] rounded-md px-2.5 py-1 w-fit">
          <Compass className="h-3 w-3 text-violet-400" />
          <span>{data.mentalModel?.type || 'Repository Architecture'}</span>
        </div>
        <h3 className="mt-3 text-[16px] font-semibold text-zinc-100 leading-tight text-left">
          {data.mentalModel?.concept || 'Ingestion Pipeline'}
        </h3>
        <p className="mt-2 text-[11px] text-zinc-500 leading-relaxed text-left">
          {data.mentalModel?.description}
        </p>
      </div>

      {/* Smart Focus Filters */}
      <FocusLayers activeFocusLayer={activeFocusLayer} setActiveFocusLayer={setActiveFocusLayer} />

      {/* Recommended Learning Path */}
      <div>
        <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
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
              className="group flex gap-3.5 items-start rounded-xl border border-white/[0.04] bg-black/20 hover:bg-white/[0.03] hover:border-white/[0.08] p-3.5 cursor-pointer transition-all duration-200"
            >
              {/* Index & score circle */}
              <div className="relative shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-black/20 border border-white/[0.04] text-xs font-mono text-zinc-400 group-hover:border-violet-500/25 group-hover:text-violet-300 transition-colors">
                {idx + 1}
                <div
                  className="absolute inset-0 rounded-lg border-2 border-violet-500/20"
                  style={{
                    clipPath: `inset(${(100 - item.importance)}% 0px 0px 0px)`
                  }}
                />
              </div>

              {/* Path and details */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-zinc-200 group-hover:text-white truncate">
                    {item.path.split('/').pop()}
                  </span>
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-black/20 border border-white/[0.03] text-zinc-500 font-mono">
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
        <TracerPlayer
          executionSteps={executionSteps}
          activeStep={activeStep}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          setActiveStep={setActiveStep}
          handleStepClick={handleStepClick}
        />
      )}

      {/* Developer Insights, Risks & Suggestions */}
      <div className="space-y-3.5 text-left">
        <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2.5">
            Architecture Insights
          </h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed border-l-2 border-violet-500/20 pl-3">
            {data.insights?.architecture}
          </p>
        </div>

        {data.insights?.risks?.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-400/90 mb-2">
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
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-400/90 mb-2">
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
