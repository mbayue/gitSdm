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
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center bg-background border border-border hover:bg-card hover:border-ring/50 rounded-md transition-all duration-300 active:scale-[0.98] w-full text-left overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed select-none",
        compact ? "p-2.5 flex-col items-start gap-1 min-h-[72px]" : "p-3 justify-between min-h-[56px]",
        active && "border-accent/40 bg-popover"
      )}
    >
      <div className={cn("flex items-center w-full", compact ? "flex-col items-start gap-2" : "gap-3")}>
        <div className="flex items-center gap-3 w-full">
          <div className={cn(
            "flex items-center justify-center rounded bg-card border border-border transition-all duration-300 group-hover:scale-105 group-hover:bg-popover",
            compact ? "h-6 w-6" : "h-7 w-7"
          )}>
            <Icon className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5", color)} />
          </div>
          
          {!compact && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs text-foreground transition-colors truncate">
                {label}
              </span>
              {subtitle && (
                <span className="text-xs text-muted-foreground mt-0.5 truncate font-normal">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        {compact && (
          <div className="flex flex-col min-w-0 mt-0.5">
            <span className="font-semibold text-xs text-foreground transition-colors truncate">
              {label}
            </span>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 font-mono">
              Run Tool
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
        </div>
      )}
    </button>
  );
}
