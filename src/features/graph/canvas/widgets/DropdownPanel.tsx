import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

const dropdownPanelClass =
  'graph-menu absolute left-0 z-50 mt-2 rounded-md border border-border bg-popover p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 max-h-[calc(100vh-3rem)] overflow-y-auto';

interface DropdownPanelProps {
  width: string;
  /** Extra alignment overrides, e.g. `sm:left-auto sm:right-0` for a
   *  trailing trigger. The measured clamp below still applies. */
  className?: string;
  children: ReactNode;
}

/**
 * Toolbar dropdown panel anchored below its trigger and clamped inside the
 * toolbar (canvas) bounds. Per-trigger `left-0` anchoring plus a viewport
 * `max-width` cannot know where the trigger sits: in narrow
 * workspace/split views a right-side trigger's panel would overflow the
 * canvas's right edge and get clipped. Measuring both rects and shifting
 * covers every trigger position and viewport.
 */
export function DropdownPanel({ width, className = '', children }: DropdownPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const clamp = () => {
      const toolbar = panel.closest('.graph-toolbar');
      if (!toolbar) return;
      const panelRect = panel.getBoundingClientRect();
      const toolbarRect = toolbar.getBoundingClientRect();
      const margin = 8;
      let shift = 0;
      if (panelRect.right > toolbarRect.right - margin) {
        shift = toolbarRect.right - margin - panelRect.right;
      } else if (panelRect.left < toolbarRect.left + margin) {
        shift = toolbarRect.left + margin - panelRect.left;
      }
      panel.style.transform = shift ? `translateX(${shift}px)` : '';
    };
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  });

  return (
    <div ref={ref} className={`${dropdownPanelClass} ${width} ${className}`}>
      {children}
    </div>
  );
}
