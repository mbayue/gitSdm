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
        "group relative flex items-center bg-[#0d1117] border border-[rgba(240,246,252,0.1)] hover:bg-[#161b22] hover:border-[rgba(240,246,252,0.3)] rounded-md transition-all duration-300 active:scale-[0.98] w-full text-left overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed select-none",
        compact ? "p-2.5 flex-col items-start gap-1 min-h-[72px]" : "p-3 justify-between min-h-[56px]",
        active && "border-[#58a6ff]/40 bg-[#1c2128]"
      )}
    >
      <div className={cn("flex items-center w-full", compact ? "flex-col items-start gap-2" : "gap-3")}>
        <div className="flex items-center gap-3 w-full">
          <div className={cn(
            "flex items-center justify-center rounded bg-[#161b22] border border-[rgba(240,246,252,0.1)] transition-all duration-300 group-hover:scale-105 group-hover:bg-[#1c2128]",
            compact ? "h-6 w-6" : "h-7 w-7"
          )}>
            <Icon className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5", color)} />
          </div>
          
          {!compact && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs text-[#e6edf3] transition-colors truncate">
                {label}
              </span>
              {subtitle && (
                <span className="text-[10px] text-[#8b949e] mt-0.5 truncate font-normal">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        {compact && (
          <div className="flex flex-col min-w-0 mt-0.5">
            <span className="font-semibold text-[11px] text-[#e6edf3] transition-colors truncate">
              {label}
            </span>
            <span className="text-[8px] text-[#8b949e] font-semibold uppercase tracking-wider mt-0.5 font-mono">
              Run Tool
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-[#8b949e] group-hover:text-[#58a6ff] transition-colors shrink-0" />
        </div>
      )}
    </button>
  );
}
