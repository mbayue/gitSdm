import { useState } from 'react';
import { useLearningPath } from '@/features/ai/useAiTasks';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import {
  RefreshCw, ShieldAlert, Sparkles, Brain, FileText, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

import { AIErrorCard } from './AIErrorCard';

// Decoupled subcomponents

export function LearningPathTab({ analysis }: { analysis: RepoAnalysis }) {
  const { owner, repo } = analysis.meta;
  const selectedBranch = useVizStore((s) => s.selectedBranch);
  const activeFocusLayer = useVizStore((s) => s.activeFocusLayer);
  const setFocusedFilePath = useVizStore((s) => s.setFocusedFilePath);
  const selectedNodeId = useVizStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useVizStore((s) => s.setSelectedNodeId);
  const setSidebarTab = useVizStore((s) => s.setSidebarTab);
  const triggerGraphAction = useVizStore((s) => s.triggerGraphAction);

  const [showAllPaths, setShowAllPaths] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [submittedGoal, setSubmittedGoal] = useState('');

  const lp = useLearningPath(owner, repo, selectedBranch, true, submittedGoal || undefined);

  const data = lp.data;

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
          Try clicking retry to generate onboarding paths for this repository.
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
    <div className="space-y-5 select-none pb-8">
      {/* Personalized Goal Input */}
      <div className="rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-3 space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] flex items-center gap-1.5">
          <Target className="h-3 w-3 text-[#58a6ff]" />
          Learning Goal
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSubmittedGoal(goalInput.trim()); }}
            placeholder="e.g. understand auth flow, fix search bugs..."
            className="flex-1 min-w-0 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#161b22] px-2.5 py-1.5 text-[11px] text-[#e6edf3] placeholder:text-[#8b949e] focus:outline-none focus:border-[#58a6ff]/40 transition-colors"
          />
          <button
            onClick={() => setSubmittedGoal(goalInput.trim())}
            disabled={!goalInput.trim()}
            className="shrink-0 rounded-md bg-[#58a6ff]/10 border border-[#58a6ff]/30 px-3 py-1.5 text-[10px] font-semibold text-[#58a6ff] hover:bg-[#58a6ff]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Start Tour
          </button>
        </div>
        {submittedGoal && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#58a6ff]">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="truncate">Customizing path for: <strong className="text-[#e6edf3]">{submittedGoal}</strong></span>
            <button
              onClick={() => { setSubmittedGoal(''); setGoalInput(''); }}
              className="ml-auto shrink-0 text-[#8b949e] hover:text-[#e6edf3] underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Recommended Learning Path */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">
            Guided Codebase Tour
          </h4>
          <span className="text-[10px] text-ui-active-text-green font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {data.recommendedPath ? `Learning path · ${data.recommendedPath.length} steps` : 'Step-by-Step'}
          </span>
        </div>
        
        <p className="text-[10px] text-[#8b949e] mb-4 italic border-l-2 border-[#58a6ff]/30 pl-2">
          {activeFocusLayer === 'api' ? 'API / Routes focus' : 
           activeFocusLayer === 'ui' ? 'UI / Components focus' :
           activeFocusLayer === 'core' ? 'Core Services focus' :
           activeFocusLayer === 'config' ? 'Configuration focus' : 
           'Full architecture focus'} — showing roadmap files and related dependencies.
        </p>

        <div className="space-y-2.5">
          {(showAllPaths ? data.recommendedPath : data.recommendedPath?.slice(0, 5))?.map((item, idx) => {
            const isActive = selectedNodeId === item.path || selectedNodeId === `file:${item.path}` || selectedNodeId === `folder:${item.path}`;
            return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                const targetId = analysis.graph.nodes.find(n => n.id === `file:${item.path}` || n.id === `folder:${item.path}` || n.id === item.path)?.id || item.path;
                setSelectedNodeId(targetId);
                setFocusedFilePath(item.path);
                triggerGraphAction('focusGraph');
              }}
              className={`group flex gap-3 items-start rounded-md border p-3 transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'border-[#58a6ff]/50 bg-[#58a6ff]/10 shadow-[0_0_10px_rgba(88,166,255,0.1)]' 
                  : 'border-[rgba(240,246,252,0.1)] bg-[#0d1117] hover:bg-[#161b22] hover:border-[rgba(240,246,252,0.3)]'
              }`}
            >
              {/* Index & score circle */}
              <div className={`shrink-0 flex items-center justify-center h-6 w-6 rounded-md border text-[10px] font-mono transition-colors mt-0.5 ${
                isActive
                  ? 'bg-[#58a6ff]/20 border-[#58a6ff]/50 text-[#e6edf3]'
                  : 'bg-[#161b22] border-[rgba(240,246,252,0.1)] text-[#8b949e] group-hover:border-[#58a6ff]/40 group-hover:text-[#e6edf3]'
              }`}>
                {idx + 1}
              </div>

              {/* Path and details */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-[#e6edf3] truncate block">
                      {item.path.split('/').pop()}
                    </span>
                    <p className="text-[9px] text-[#8b949e] font-mono truncate mt-0.5">
                      {item.path}
                    </p>
                  </div>
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-[#161b22] border border-[rgba(240,246,252,0.1)] text-ui-active-text-green font-mono">
                    {item.role}
                  </span>
                </div>
                
                <p className="text-[11px] text-[#8b949e] mt-2 leading-relaxed font-sans">
                  {item.reason}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[rgba(240,246,252,0.05)]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setFocusedFilePath(item.path); }}
                    className="flex items-center gap-1.5 text-[9px] font-bold text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] px-2 py-1 rounded transition-colors"
                  >
                    <FileText className="h-3 w-3" /> OPEN
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetId = analysis.graph.nodes.find(n => n.id === `file:${item.path}` || n.id === `folder:${item.path}` || n.id === item.path)?.id || item.path;
                      setSelectedNodeId(targetId);
                      setSidebarTab('ai');
                    }}
                    className="flex items-center gap-1.5 text-[9px] font-bold text-[#8b949e] hover:text-[#e6edf3] hover:bg-[rgba(240,246,252,0.1)] px-2 py-1 rounded transition-colors ml-auto"
                  >
                    <Brain className="h-3 w-3" /> EXPLAIN
                  </button>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>

        {data.recommendedPath && data.recommendedPath.length > 5 && !showAllPaths && (
          <button
            onClick={() => setShowAllPaths(true)}
            className="w-full mt-3 py-2 text-[10px] font-medium text-[#58a6ff] hover:text-[#79c0ff] hover:bg-[#58a6ff]/10 rounded transition-colors"
          >
            View full roadmap ({data.recommendedPath.length - 5} more)
          </button>
        )}
      </div>
    </div>
  );
}
