import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface ToolCardProps {
  label: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
  compact?: boolean;
  disabled?: boolean;
  active?: boolean;
}

export function ToolCard({
  label,
  subtitle,
  icon: Icon,
  color,
  onClick,
  compact = false,
  disabled = false,
  active = false,
}: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center bg-zinc-950/40 border border-white/[0.04] hover:bg-zinc-900/60 hover:border-white/[0.08] hover:-translate-y-[1px] rounded-xl transition-all duration-300 active:scale-[0.98] w-full text-left overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed select-none",
        compact ? "p-3 flex-col items-start gap-2 min-h-[92px]" : "p-4 justify-between min-h-[64px]",
        active && "border-violet-500/20 bg-violet-600/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
      )}
    >
      <div className={cn("flex items-center w-full", compact ? "flex-col items-start gap-2" : "gap-3")}>
        <div className="flex items-center gap-3 w-full">
          <div className={cn(
            "flex items-center justify-center rounded-lg bg-zinc-900/80 border border-white/[0.05] transition-all duration-300 group-hover:scale-105 group-hover:bg-zinc-800",
            compact ? "h-8 w-8" : "h-9 w-9"
          )}>
            <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", color)} />
          </div>
          
          {!compact && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs text-zinc-200 group-hover:text-white transition-colors truncate">
                {label}
              </span>
              {subtitle && (
                <span className="text-[10px] text-zinc-500 mt-0.5 truncate font-normal">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        {compact && (
          <div className="flex flex-col min-w-0 mt-0.5">
            <span className="font-semibold text-[11px] text-zinc-200 group-hover:text-white transition-colors truncate">
              {label}
            </span>
            <span className="text-[8px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5 font-mono">
              Run Tool
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-zinc-700 group-hover:text-violet-400 transition-colors shrink-0" />
        </div>
      )}
    </button>
  );
}
