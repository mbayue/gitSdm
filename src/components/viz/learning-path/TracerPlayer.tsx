import { cn } from '@/lib/utils';
import { Play, Pause, Zap } from 'lucide-react';
import type { ExecutionStep } from './TracerSimulation';

interface TracerPlayerProps {
  executionSteps: ExecutionStep[];
  activeStep: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  handleStepClick: (index: number) => void;
}

export function TracerPlayer({
  executionSteps,
  activeStep,
  isPlaying,
  setIsPlaying,
  handleStepClick,
}: TracerPlayerProps) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-zinc-950/40 p-4">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Runtime Execution Trace
          </h4>
        </div>
        <button
          type="button"
          onClick={() => {
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
      <div className="relative border-l border-white/[0.06] ml-2.5 pl-4 space-y-4 text-left">
        {executionSteps.map((step, sIdx) => {
          const isActive = activeStep === sIdx;
          return (
            <button
              type="button"
              key={sIdx}
              onClick={() => handleStepClick(sIdx)}
              className="relative group/step cursor-pointer w-full text-left"
            >
              <span
                className={cn(
                  "absolute -left-[21.5px] top-0.5 h-2.5 w-2.5 rounded-full border transition-all duration-150",
                  isActive
                    ? "bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-110"
                    : "bg-zinc-950 border-white/20 group-hover/step:border-white/50"
                )}
              />
              <span className="min-w-0 block">
                <span
                  className={cn(
                    "text-[10px] font-mono leading-none transition-colors block",
                    isActive ? "text-amber-400 font-bold" : "text-zinc-400 group-hover/step:text-zinc-200"
                  )}
                >
                  {step.from} → {step.to}
                </span>
                <span className="text-[10px] text-zinc-500 mt-1 leading-relaxed block">
                  {step.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
