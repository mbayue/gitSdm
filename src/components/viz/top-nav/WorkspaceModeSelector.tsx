import { Monitor, BookOpen, ActivitySquare, LayoutPanelLeft, Check, ChevronDown } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface WorkspaceModeOption {
  id: 'focus' | 'analysis' | 'learning' | 'full';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const MODES: WorkspaceModeOption[] = [
  {
    id: 'full',
    label: 'Full Workspace',
    description: 'All panels, file explorer, and inspector visible',
    icon: LayoutPanelLeft,
    color: 'text-[#e6edf3]',
    bgColor: 'bg-white/5 border-white/10 text-[#e6edf3]',
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    description: 'Minimizes sidebars to focus purely on the canvas',
    icon: Monitor,
    color: 'text-[#e6edf3]',
    bgColor: 'bg-white/5 border-white/10 text-[#e6edf3]',
  },
  {
    id: 'analysis',
    label: 'Analysis Mode',
    description: 'Focuses sidebar on AI analysis and insights',
    icon: ActivitySquare,
    color: 'text-[#e6edf3]',
    bgColor: 'bg-white/5 border-white/10 text-[#e6edf3]',
  },
  {
    id: 'learning',
    label: 'Learning Mode',
    description: 'Walk through codebase concepts with timelines',
    icon: BookOpen,
    color: 'text-[#e6edf3]',
    bgColor: 'bg-white/5 border-white/10 text-[#e6edf3]',
  },
];

export function WorkspaceModeSelector() {
  const {
    workspaceMode,
    setWorkspaceMode,
    setAiSidebarOpen,
    setSidebarTab,
    setExplorerOpen,
    setInspectorOpen,
  } = useVizStore();

  const currentMode = MODES.find((m) => m.id === workspaceMode) || MODES[0];

  const handleModeChange = (mode: 'focus' | 'analysis' | 'learning' | 'full') => {
    setWorkspaceMode(mode);
    setExplorerOpen(true);

    if (mode === 'focus') {
      setAiSidebarOpen(false);
      setInspectorOpen(false);
    } else if (mode === 'analysis') {
      setAiSidebarOpen(true);
      setSidebarTab('analysis');
      setInspectorOpen(false);
    } else if (mode === 'learning') {
      setAiSidebarOpen(true);
      setSidebarTab('learning');
      setInspectorOpen(false);
    } else if (mode === 'full') {
      setAiSidebarOpen(true);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-1.5 h-7 pl-2 pr-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all duration-200 select-none outline-none cursor-pointer">
        <currentMode.icon className="h-3.5 w-3.5 shrink-0 transition-colors text-[#8b949e] group-hover:text-[#e6edf3]" />
        {/* On tablet/desktop show label, on mobile show compact */}
        <span className="hidden sm:inline font-sans truncate max-w-[110px]">{currentMode.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" sideOffset={6} className="w-72 bg-[#161b22] border-[rgba(240,246,252,0.1)] shadow-2xl z-[100] p-1.5 rounded-md">
        <div className="px-2.5 py-1.5 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider select-none font-mono">
          Workspace Layout
        </div>
        <div className="space-y-0.5">
          {MODES.map((mode) => {
            const isSelected = workspaceMode === mode.id;
            return (
              <DropdownMenuItem
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={cn(
                  'flex items-start gap-3 cursor-pointer p-2.5 focus:bg-[rgba(240,246,252,0.1)] focus:text-[#e6edf3] rounded-sm text-xs transition-colors',
                  isSelected ? 'bg-[#1c2128] text-[#e6edf3]' : 'text-[#8b949e]'
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[rgba(240,246,252,0.1)]',
                  isSelected ? 'bg-[#161b22]' : 'bg-[#0d1117]'
                )}>
                  <mode.icon className={cn("h-3.5 w-3.5", isSelected ? mode.color : "text-[#8b949e]")} />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className={cn('font-medium', isSelected ? 'text-[#e6edf3]' : 'text-[#e6edf3]')}>
                      {mode.label}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#e6edf3] shrink-0" />}
                  </div>
                  <span className="text-[10px] leading-relaxed text-[#8b949e] font-sans font-normal">
                    {mode.description}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
