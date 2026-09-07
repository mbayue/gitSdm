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
        "group relative flex items-center bg-secondary border border-border hover:bg-secondary hover:border-ring/50 rounded-2xl transition-all duration-300 active:scale-[0.98] overflow-hidden w-full",
        compact ? "p-3 flex-col items-start gap-3" : "p-4 justify-between"
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10 bg-gradient-to-br from-foreground/[0.02] to-transparent",
        glow
      )} />

      <div className={cn("flex items-center", compact ? "gap-2.5" : "gap-4")}>
        <div className={cn(
          "flex items-center justify-center rounded-xl bg-background border border-border shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
          compact ? "h-9 w-9" : "h-11 w-11"
        )}>
          <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5", color)} />
        </div>
        <div className="flex flex-col items-start text-left">
          <span className={cn(
            "font-semibold text-foreground group-hover:text-foreground transition-colors leading-tight",
            compact ? "text-xs" : "text-[13px]"
          )}>
            {label}
          </span>
          {compact && (
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Run Tool</span>
          )}
        </div>
      </div>

      {!compact && (
        <div className="flex items-center gap-3">
          <div className="h-6 w-px bg-secondary" />
          <Sparkles className="h-4 w-4 text-muted-foreground group-hover:text-ui-active-text-green group-hover:animate-pulse transition-colors" />
        </div>
      )}
    </button>
  );
}
