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
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    description: 'Minimizes sidebars to focus purely on the canvas',
    icon: Monitor,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  },
  {
    id: 'analysis',
    label: 'Analysis Mode',
    description: 'Focuses sidebar on AI analysis and insights',
    icon: ActivitySquare,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
  },
  {
    id: 'learning',
    label: 'Learning Mode',
    description: 'Walk through codebase concepts with timelines',
    icon: BookOpen,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
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
      <DropdownMenuTrigger className="group flex items-center gap-2 h-7 pl-2.5 pr-2 rounded-full border border-white/[0.06] bg-zinc-900 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:border-white/[0.12] transition-all duration-200 select-none outline-none cursor-pointer">
        <currentMode.icon className={cn('h-3.5 w-3.5 shrink-0 transition-colors', currentMode.color)} />
        {/* On tablet/desktop show label, on mobile show compact */}
        <span className="hidden sm:inline font-sans truncate max-w-[110px]">{currentMode.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" sideOffset={6} className="w-72 bg-zinc-950 border-white/10 shadow-2xl z-[100] p-1.5 rounded-xl">
        <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider select-none font-sans">
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
                  'flex items-start gap-3 cursor-pointer p-2.5 focus:bg-white/5 focus:text-white rounded-lg text-xs transition-all duration-150',
                  isSelected ? 'bg-violet-600/10 text-violet-300' : 'text-zinc-400'
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                  isSelected ? mode.bgColor : 'bg-zinc-900 border-white/[0.04] text-zinc-400'
                )}>
                  <mode.icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className={cn('font-semibold font-sans', isSelected ? 'text-zinc-100' : 'text-zinc-350')}>
                      {mode.label}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] leading-relaxed text-zinc-500 font-sans font-normal">
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
