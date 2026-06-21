import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface ActionButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glow: string;
  onClick: () => void;
  compact?: boolean;
}

export function ActionButton({
  label,
  icon: Icon,
  color,
  glow,
  onClick,
  compact = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1] rounded-2xl transition-all duration-300 active:scale-[0.98] overflow-hidden w-full",
        compact ? "p-3 flex-col items-start gap-3" : "p-4 justify-between"
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10 bg-gradient-to-br from-white/[0.02] to-transparent",
        glow
      )} />

      <div className={cn("flex items-center", compact ? "gap-2.5" : "gap-4")}>
        <div className={cn(
          "flex items-center justify-center rounded-xl bg-black/40 border border-white/[0.05] shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
          compact ? "h-9 w-9" : "h-11 w-11"
        )}>
          <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5", color)} />
        </div>
        <div className="flex flex-col items-start text-left">
          <span className={cn(
            "font-semibold text-zinc-200 group-hover:text-white transition-colors leading-tight",
            compact ? "text-[11px]" : "text-[13px]"
          )}>
            {label}
          </span>
          {compact && (
            <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Run Tool</span>
          )}
        </div>
      </div>

      {!compact && (
        <div className="flex items-center gap-3">
          <div className="h-6 w-px bg-white/[0.04]" />
          <Sparkles className="h-4 w-4 text-zinc-700 group-hover:text-ui-active-text-green group-hover:animate-pulse transition-colors" />
        </div>
      )}
    </button>
  );
}
