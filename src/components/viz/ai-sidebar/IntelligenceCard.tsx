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
    <div className="bg-[#0d1117] border border-[rgba(240,246,252,0.1)] rounded-md p-4 relative overflow-hidden transition-all duration-300">

      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(240,246,252,0.1)]">
        <div className="flex flex-col min-w-0">
          <h3 className="text-xs font-bold text-[#e6edf3] uppercase tracking-widest leading-none">
            {title}
          </h3>
          <span className="text-[10px] text-[#8b949e] font-medium mt-1 truncate">
            {subtitle}
          </span>
        </div>

        {headerAction}

        {badgeLabel && onBadgeToggle && (
          <button
            type="button"
            onClick={onBadgeToggle}
            className={cn(
              "flex items-center gap-1.5 h-6 px-2.5 rounded-sm text-[9px] font-bold transition-all border select-none shrink-0",
              badgeActive
                ? "bg-[#1c2128] text-[#e6edf3] border-[rgba(240,246,252,0.1)]"
                : "bg-transparent text-[#8b949e] border-[rgba(240,246,252,0.1)] hover:bg-[#161b22] hover:text-[#e6edf3]"
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              badgeActive ? "bg-[#58a6ff] scale-110" : "bg-[#8b949e]"
            )} />
            {badgeLabel}
          </button>
        )}
      </div>

      {/* Card Body */}
      {isLoading ? (
        <div className="space-y-3 py-1">
          <div className="h-2 w-full bg-[rgba(240,246,252,0.1)] animate-pulse rounded" />
          <div className="h-2 w-11/12 bg-[rgba(240,246,252,0.05)] animate-pulse rounded" />
          <div className="h-16 w-full bg-[rgba(240,246,252,0.05)] animate-pulse rounded-md" />
          <div className="h-2 w-4/5 bg-[rgba(240,246,252,0.1)] animate-pulse rounded" />
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
            <div className="text-xs text-[#e6edf3] leading-relaxed font-sans pr-1">
              {children}
            </div>
            
            {/* Fade Overlay when collapsed */}
            {!expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/85 to-transparent pointer-events-none" />
            )}
          </div>

          {/* Expand/Collapse Button */}
          <div className="flex justify-center mt-3 pt-2 border-t border-[rgba(240,246,252,0.1)]">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#e6edf3] font-semibold transition-colors"
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
