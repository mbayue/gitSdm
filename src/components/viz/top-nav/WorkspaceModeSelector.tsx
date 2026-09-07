import { Check, ChevronDown } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { WORKSPACE_MODES } from './workspaceModes';

export function WorkspaceModeSelector() {
  const {
    workspaceMode,
    setWorkspaceMode,
  } = useVizStore();

  const currentMode = WORKSPACE_MODES.find((m) => m.id === workspaceMode) || WORKSPACE_MODES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={currentMode.label} className="group flex items-center gap-1.5 h-7 pl-2 pr-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 select-none outline-none cursor-pointer">
        <currentMode.icon className="h-3.5 w-3.5 shrink-0 transition-colors text-muted-foreground group-hover:text-foreground" />
        {/* Show label on lg+, icon-only on tablet */}
        <span className="hidden lg:inline font-sans truncate max-w-[110px]">{currentMode.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" sideOffset={6} className="w-72 bg-card border-border shadow-2xl z-[100] p-1.5 rounded-md">
        <div className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none font-mono">
          Workspace Layout
        </div>
        <div className="space-y-0.5">
          {WORKSPACE_MODES.map((mode) => {
            const isSelected = workspaceMode === mode.id;
            return (
              <DropdownMenuItem
                key={mode.id}
                onClick={() => setWorkspaceMode(mode.id)}
                className={cn(
                  'flex items-start gap-3 cursor-pointer p-2.5 focus:bg-secondary focus:text-foreground rounded-sm text-xs transition-colors',
                  isSelected ? 'bg-popover text-foreground' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border',
                  isSelected ? 'bg-card' : 'bg-background'
                )}>
                  <mode.icon className={cn("h-3.5 w-3.5", isSelected ? mode.color : "text-muted-foreground")} />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className={cn('font-medium', isSelected ? 'text-foreground' : 'text-foreground')}>
                      {mode.label}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-foreground shrink-0" />}
                  </div>
                  <span className="text-xs leading-relaxed text-muted-foreground font-sans font-normal">
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
