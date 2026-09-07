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
    <div className="bg-background border border-border rounded-md p-4 relative overflow-hidden transition-all duration-300">

      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex flex-col min-w-0">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-widest leading-none">
            {title}
          </h3>
          <span className="text-xs text-muted-foreground font-medium mt-1 truncate">
            {subtitle}
          </span>
        </div>

        {headerAction}

        {badgeLabel && onBadgeToggle && (
          <button
            type="button"
            onClick={onBadgeToggle}
            className={cn(
              "flex items-center gap-1.5 h-6 px-2.5 rounded-sm text-xs font-bold transition-all border select-none shrink-0",
              badgeActive
                ? "bg-popover text-foreground border-border"
                : "bg-transparent text-muted-foreground border-border hover:bg-card hover:text-foreground"
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              badgeActive ? "bg-accent scale-110" : "bg-muted-foreground"
            )} />
            {badgeLabel}
          </button>
        )}
      </div>

      {/* Card Body */}
      {isLoading ? (
        <div className="space-y-3 py-1">
          <div className="h-2 w-full bg-secondary animate-pulse rounded" />
          <div className="h-2 w-11/12 bg-secondary animate-pulse rounded" />
          <div className="h-16 w-full bg-secondary animate-pulse rounded-md" />
          <div className="h-2 w-4/5 bg-secondary animate-pulse rounded" />
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
            <div className="text-xs text-foreground leading-relaxed font-sans pr-1">
              {children}
            </div>
            
            {/* Fade Overlay when collapsed */}
            {!expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background via-background/85 to-transparent pointer-events-none" />
            )}
          </div>

          {/* Expand/Collapse Button */}
          <div className="flex justify-center mt-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
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
