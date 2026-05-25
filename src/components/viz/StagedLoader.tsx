import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, GitBranch, Brain, Layers, Zap, Map } from 'lucide-react';

interface Stage {
  id: number;
  label: string;
  sublabel: string;
  icon: typeof Brain;
  duration: number;
}

const STAGES: Stage[] = [
  { id: 1, label: 'Connecting to GitHub', sublabel: 'Authenticating & fetching repository metadata', icon: GitBranch, duration: 1000 },
  { id: 2, label: 'Ingesting file tree', sublabel: 'Mapping directories, files & module boundaries', icon: Layers, duration: 1200 },
  { id: 3, label: 'Resolving dependencies', sublabel: 'Parsing manifests across detected ecosystems', icon: Zap, duration: 1100 },
  { id: 4, label: 'Building architecture graph', sublabel: 'Computing node positions & dependency chains', icon: Map, duration: 1100 },
  { id: 5, label: 'Synthesizing AI onboarding roadmap', sublabel: 'Generating recommended reading paths & execution flows', icon: Brain, duration: 99999 },
];

interface StagedLoaderProps {
  owner: string;
  repo: string;
}

export function StagedLoader({ owner, repo }: StagedLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const runStages = (index: number) => {
      if (index >= STAGES.length - 1) return;
      timer = setTimeout(() => {
        setCurrentStageIndex(index + 1);
        runStages(index + 1);
      }, STAGES[index].duration);
    };
    runStages(0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return prev;
        const remaining = 100 - prev;
        return prev + Math.max(0.2, remaining * 0.04);
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const currentStage = STAGES[currentStageIndex];
  const StageIcon = currentStage.icon;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 p-6">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-80 w-80 rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[420px]"
      >
        {/* Glow border */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/20 via-transparent to-cyan-500/20 blur-sm" />

        <div className="relative rounded-2xl border border-white/[0.07] bg-zinc-900/70 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold tracking-widest text-violet-400 uppercase">
                AI Analysis Pipeline
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{Math.floor(progress)}%</span>
            </div>

            <h3 className="text-base font-semibold text-white truncate">
              Analyzing{' '}
              <span className="text-violet-300 font-mono">{owner}/{repo}</span>
            </h3>

            {/* Progress bar */}
            <div className="mt-3 h-1 w-full rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Active stage callout */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mb-5 flex items-center gap-3 rounded-xl border border-violet-500/15 bg-violet-500/8 px-3.5 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                <StageIcon className="h-4 w-4 text-violet-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">{currentStage.label}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{currentStage.sublabel}</p>
              </div>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400 ml-auto" />
            </motion.div>
          </AnimatePresence>

          {/* Stage list */}
          <div className="space-y-2.5">
            {STAGES.map((stage, i) => {
              const isDone = i < currentStageIndex;
              const isActive = i === currentStageIndex;
              const Icon = stage.icon;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                    isActive ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  <div className="shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isActive ? (
                      <div className="h-4 w-4 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4 text-zinc-700" />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${
                    isDone ? 'text-zinc-600 line-through decoration-zinc-700'
                      : isActive ? 'text-white'
                      : 'text-zinc-700'
                  }`}>
                    {stage.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
