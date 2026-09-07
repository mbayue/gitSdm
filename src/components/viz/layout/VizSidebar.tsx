import { ReactNode, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { TooltipHint } from "@/components/ui/tooltip";

interface VizSidebarProps {
  side: "left" | "right";
  isOpen: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onClose?: () => void;
  onOpen: () => void;
  children: ReactNode;
}

export function VizSidebar({
  side,
  isOpen,
  width,
  onWidthChange,
  minWidth = 200,
  maxWidth = 600,
  className,
  onClose,
  onOpen,
  children,
}: VizSidebarProps) {
  const isLeft = side === "left";
  
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const mouseUpHandlerRef = useRef<(() => void) | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        let newWidth;
        if (isLeft) {
          newWidth = moveEvent.clientX;
        } else {
          newWidth = window.innerWidth - moveEvent.clientX;
        }
        onWidthChange(Math.max(minWidth, Math.min(maxWidth, newWidth)));
      };
      
      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("mouseup", handleMouseUp);
        mouseMoveHandlerRef.current = null;
        mouseUpHandlerRef.current = null;
      };

      mouseMoveHandlerRef.current = handleMouseMove;
      mouseUpHandlerRef.current = handleMouseUp;

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [isLeft, minWidth, maxWidth, onWidthChange]
  );

  useEffect(() => {
    return () => {
      if (mouseMoveHandlerRef.current) {
        document.removeEventListener("mousemove", mouseMoveHandlerRef.current);
      }
      if (mouseUpHandlerRef.current) {
        document.removeEventListener("mouseup", mouseUpHandlerRef.current);
        window.removeEventListener("mouseup", mouseUpHandlerRef.current);
      }
    };
  }, []);

  const label = isLeft ? "Open file explorer" : "Open repository insights";

  const openButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevIsOpenRef = useRef(isOpen);

  // Keep focus inside the workspace when panels toggle: move focus into the
  // panel's collapse button on open, restore to the minibar opener on close.
  useEffect(() => {
    const prev = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;
    if (prev === isOpen) return;
    if (isOpen) {
      const closeButton = panelRef.current?.querySelector<HTMLElement>(
        '[aria-label="Collapse file explorer"], [aria-label="Collapse repository insights"]',
      );
      const fallback = closeButton
        ?? panelRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
      fallback?.focus();
    } else {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (isDesktop) {
        // Minibar is desktop-only (hidden lg:flex); only restore when visible.
        const opener = openButtonRef.current;
        if (opener && opener.getClientRects().length > 0) {
          opener.focus();
        }
      } else {
        // Mobile: minibar is hidden, so restore to the visible mobile menu
        // trigger (or another visible workspace control) instead of leaving
        // focus on the unmounted collapse button.
        const mobileMenuTrigger = document.querySelector<HTMLElement>(
          'button[aria-label="Open menu"]',
        );
        if (mobileMenuTrigger && mobileMenuTrigger.getClientRects().length > 0) {
          mobileMenuTrigger.focus();
        }
      }
    }
  }, [isOpen]);

  return (
    <>
      {!isOpen && (
      <aside
        aria-label={isLeft ? "File explorer minibar" : "Repository insights minibar"}
        className={cn(
          "hidden h-full w-10 shrink-0 flex-col items-center bg-card pt-2 lg:flex",
          isLeft ? "border-r border-border" : "border-l border-border",
        )}
      >
        <TooltipHint content={label} side={isLeft ? "right" : "left"}>
          <button ref={openButtonRef} type="button" aria-label={label} aria-expanded={false} onClick={onOpen}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-accent hover:bg-secondary hover:text-foreground">
            {isLeft ? <PanelLeftOpen className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
        </TooltipHint>
      </aside>
      )}
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-x-0 top-[110px] bottom-8 bg-black/60 z-[50] backdrop-blur-sm lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onClose?.()}
      />

      <div
        ref={panelRef}
        style={{ width: isOpen ? width : 0 }}
        className={cn(
          "z-40 shrink-0 h-full transition-all flex flex-col",
          "max-lg:!w-[85vw] sm:max-lg:!w-[360px] max-lg:fixed max-lg:top-[110px] max-lg:bottom-8 max-lg:!h-auto max-lg:bg-background max-lg:shadow-2xl max-lg:z-[60]",
          isLeft ? "max-lg:left-0 lg:left-0 lg:relative max-lg:border-r max-lg:border-border" : "max-lg:right-0 lg:right-0 lg:relative max-lg:border-l max-lg:border-border",
          !isOpen && (isLeft ? "max-lg:-translate-x-full" : "max-lg:translate-x-full"),
          !isOpen && "!w-0 opacity-0 hidden",
          className
        )}
      >
      {/* Content wrapper */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col relative">
        {children}
      </div>

      {/* Resize handle */}
      {isOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={isLeft ? 'Resize file explorer' : 'Resize repository insights'}
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
          aria-valuenow={width}
          tabIndex={0}
          onKeyDown={(event) => {
            const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (!direction) return;
            event.preventDefault();
            onWidthChange(Math.max(minWidth, Math.min(maxWidth, width + direction * (isLeft ? 20 : -20))));
          }}
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/50 focus-visible:bg-accent focus-visible:outline-none bg-transparent transition-colors z-50 select-none hidden lg:block",
            isLeft ? "right-0" : "left-0"
          )}
        />
      )}
      </div>
    </>
  );
}
