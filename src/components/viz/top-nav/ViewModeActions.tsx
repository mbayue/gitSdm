import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VIEW_TABS, type ViewTab } from './viewTabs';
import { WORKSPACE_MODES, type WorkspaceModeId } from './workspaceModes';

interface ViewModeActionsProps {
  activeView: ViewTab['id'];
  workspaceMode: WorkspaceModeId;
  onViewChange: (viewId: ViewTab['id']) => void;
  onWorkspaceModeChange: (modeId: WorkspaceModeId) => void;
  onClose: () => void;
}

export function ViewModeActions({ activeView, workspaceMode, onViewChange, onWorkspaceModeChange, onClose }: ViewModeActionsProps) {
  return (
    <>
      <div className="px-2.5 py-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono select-none">
        View mode
      </div>
      {VIEW_TABS.map((item) => {
        const isSelected = activeView === item.id;
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => { onViewChange(item.id); onClose(); }}
            className={cn(
              'flex w-full cursor-pointer items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors',
              isSelected ? 'bg-[#1c2128] text-[#e6edf3] font-medium' : 'text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]',
            )}
          >
            <div className="flex items-center gap-2">
              <item.icon className={cn('h-3.5 w-3.5', isSelected ? 'text-[#e6edf3]' : 'text-[#8b949e]')} />
              <span>{item.label}</span>
            </div>
            {isSelected && <Check className="h-3.5 w-3.5 text-[#e6edf3]" />}
          </button>
        );
      })}

      <div className="my-1.5 h-px bg-[rgba(240,246,252,0.1)]" />
      <div className="px-2.5 py-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono select-none">
        Workspace Layout
      </div>
      {WORKSPACE_MODES.map((item) => {
        const isSelected = workspaceMode === item.id;
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => { onWorkspaceModeChange(item.id); onClose(); }}
            className={cn(
              'flex w-full cursor-pointer items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors',
              isSelected ? 'bg-[#1c2128] text-[#e6edf3] font-medium' : 'text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]',
            )}
          >
            <div className="flex items-center gap-2">
              <item.icon className={cn('h-3.5 w-3.5', isSelected ? 'text-[#e6edf3]' : 'text-[#8b949e]')} />
              <span>{item.label}</span>
            </div>
            {isSelected && <Check className="h-3.5 w-3.5 text-[#e6edf3]" />}
          </button>
        );
      })}
    </>
  );
}
