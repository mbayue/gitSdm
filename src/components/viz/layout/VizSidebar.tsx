import { ReactNode, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VizSidebarProps {
  side: "left" | "right";
  isOpen: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onClose?: () => void;
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

  const shadowClass = "";

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-[50] backdrop-blur-sm lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onClose?.()}
      />

      <div
        style={{ width: isOpen ? width : "40px" }}
        className={cn(
          "z-40 shrink-0 h-full transition-all flex flex-col",
          "max-lg:!w-[85vw] sm:max-lg:!w-[360px] max-lg:fixed max-lg:top-0 max-lg:bottom-0 max-lg:bg-[#0d1117] max-lg:shadow-2xl max-lg:z-[60]",
          isLeft ? "max-lg:left-0 lg:left-0 lg:relative max-lg:border-r max-lg:border-[rgba(240,246,252,0.1)]" : "max-lg:right-0 lg:right-0 lg:relative max-lg:border-l max-lg:border-[rgba(240,246,252,0.1)]",
          !isOpen && (isLeft ? "max-lg:-translate-x-full" : "max-lg:translate-x-full"),
          !isOpen && "max-lg:!w-0 max-lg:opacity-0 max-lg:hidden",
          shadowClass,
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
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#58a6ff]/50 bg-transparent transition-colors z-50 select-none hidden lg:block",
            isLeft ? "right-0" : "left-0"
          )}
        />
      )}
      </div>
    </>
  );
}
