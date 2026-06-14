import { ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

interface VizSidebarProps {
  side: "left" | "right";
  isOpen: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
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
  children,
}: VizSidebarProps) {
  const isLeft = side === "left";
  
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
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
      };
      
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isLeft, minWidth, maxWidth, onWidthChange]
  );

  const shadowClass = isLeft 
    ? "shadow-[4px_0_24px_rgba(0,0,0,0.5)] lg:shadow-none" 
    : "shadow-[-4px_0_24px_rgba(0,0,0,0.5)] lg:shadow-none";

  return (
    <div
      style={{ width: isOpen ? width : "40px" }}
      className={cn(
        "absolute lg:relative z-40 shrink-0 flex h-full transition-all",
        isLeft ? "left-0" : "right-0",
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
            "absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500/50 bg-transparent transition-colors z-50 select-none hidden lg:block",
            isLeft ? "right-0" : "left-0"
          )}
        />
      )}
    </div>
  );
}
