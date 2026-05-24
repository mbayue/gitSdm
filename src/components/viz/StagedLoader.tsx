import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

interface Stage {
  id: number;
  label: string;
  duration: number; // in milliseconds
}

const STAGES: Stage[] = [
  { id: 1, label: 'Connecting to GitHub API & verifying authorization', duration: 1100 },
  { id: 2, label: 'Ingesting repository directory structure', duration: 1300 },
  { id: 3, label: 'Parsing package manifests and configuration files', duration: 1200 },
  { id: 4, label: 'Resolving multi-ecosystem dependency networks', duration: 1000 },
  { id: 5, label: 'Calculating Graph positions & layout constraints', duration: 1100 },
  { id: 6, label: 'Generating AI architecture outlines and metrics', duration: 99999 }, // stays active until finished
];

interface StagedLoaderProps {
  owner: string;
  repo: string;
}

export function StagedLoader({ owner, repo }: StagedLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
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
    // Increment the overall progress bar slowly towards 99%
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return prev;
        const remaining = 100 - prev;
        return prev + Math.max(0.3, remaining * 0.05);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 p-6">
      <div className="relative w-full max-w-md rounded-2xl border border-white/5 bg-zinc-900/40 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="absolute -inset-0.5 -z-10 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 opacity-70 blur-xl" />
        
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="text-[10px] font-bold tracking-widest text-violet-400 uppercase">
            AI Analyzer Pipeline
          </span>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Ingesting {owner}/{repo}
          </h3>
          
          {/* Progress Bar */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
          <div className="mt-1.5 text-right text-[10px] font-mono text-zinc-500">
            {Math.floor(progress)}% compiled
          </div>
        </div>

        {/* Stage List */}
        <div className="space-y-4">
          {STAGES.map((stage, i) => {
            const isDone = i < currentStageIndex;
            const isActive = i === currentStageIndex;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors ${
                  isActive ? 'bg-violet-500/5 ring-1 ring-violet-500/10' : ''
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-zinc-700" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p
                    className={`text-xs font-medium leading-normal transition-colors ${
                      isDone
                        ? 'text-zinc-400 line-through decoration-zinc-700'
                        : isActive
                        ? 'text-white'
                        : 'text-zinc-600'
                    }`}
                  >
                    {stage.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
