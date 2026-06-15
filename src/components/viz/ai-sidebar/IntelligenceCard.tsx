import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface IntelligenceCardProps {
  title: string;
  subtitle: string;
  badgeLabel?: string;
  badgeActive?: boolean;
  onBadgeToggle?: () => void;
  headerAction?: React.ReactNode;
  isLoading?: boolean;
  expandedMaxHeight?: string;
  children: React.ReactNode;
}

export function IntelligenceCard({
  title,
  subtitle,
  badgeLabel,
  badgeActive = false,
  onBadgeToggle,
  headerAction,
  isLoading = false,
  expandedMaxHeight,
  children,
}: IntelligenceCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-violet-950/10 via-zinc-950/60 to-zinc-950/30 border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-lg transition-all duration-300">
      {/* Soft background glow */}
      <div className="absolute -right-10 -top-10 -z-10 h-32 w-32 rounded-full bg-violet-500/[0.03] blur-[40px] pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
        <div className="flex flex-col min-w-0">
          <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest leading-none">
            {title}
          </h3>
          <span className="text-[10px] text-zinc-500 font-medium mt-1 truncate">
            {subtitle}
          </span>
        </div>

        {headerAction}

        {badgeLabel && onBadgeToggle && (
          <button
            type="button"
            onClick={onBadgeToggle}
            className={cn(
              "flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[9px] font-bold transition-all border select-none shrink-0",
              badgeActive
                ? "bg-violet-500/15 text-violet-300 border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                : "bg-zinc-900/60 text-zinc-500 border-white/[0.04] hover:border-white/10 hover:text-zinc-400"
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full transition-all shadow-[0_0_6px_currentColor]",
              badgeActive ? "bg-violet-400 scale-110" : "bg-zinc-600"
            )} />
            {badgeLabel}
          </button>
        )}
      </div>

      {/* Card Body */}
      {isLoading ? (
        <div className="space-y-3 py-1">
          <div className="h-2 w-full bg-violet-400/10 animate-pulse rounded" />
          <div className="h-2 w-11/12 bg-violet-400/10 animate-pulse rounded" />
          <div className="h-16 w-full bg-violet-400/5 animate-pulse rounded-xl" />
          <div className="h-2 w-4/5 bg-violet-400/10 animate-pulse rounded" />
        </div>
      ) : (
        <div className="relative">
          <div
            className={cn(
              "transition-all duration-500 overflow-hidden relative",
              !expanded && "max-h-[280px]",
              expanded && expandedMaxHeight && "overflow-y-auto scrollbar-thin pr-1"
            )}
            style={expanded && expandedMaxHeight ? { maxHeight: expandedMaxHeight } : undefined}
          >
            <div className="text-xs text-zinc-300 leading-relaxed font-sans pr-1">
              {children}
            </div>
            
            {/* Fade Overlay when collapsed */}
            {!expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#09080d] via-[#09080d]/85 to-transparent pointer-events-none" />
            )}
          </div>

          {/* Expand/Collapse Button */}
          <div className="flex justify-center mt-3 pt-2 border-t border-white/[0.02]">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white font-semibold transition-colors"
            >
              {expanded ? (
                <>
                  <span>Collapse analysis</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Expand full analysis</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
