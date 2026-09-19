import { LayoutPanelLeft, PanelLeft, PanelRight, Monitor } from 'lucide-react';

export interface WorkspaceMode {
  id: 'full' | 'explorer' | 'insights' | 'focus';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export const WORKSPACE_MODES: WorkspaceMode[] = [
  {
    id: 'full',
    label: 'Full Workspace',
    description: 'Show the file explorer and repository insights',
    icon: LayoutPanelLeft,
    color: 'text-foreground',
    bgColor: 'bg-secondary border-border text-foreground',
  },
  {
    id: 'explorer',
    label: 'Explorer Only',
    description: 'Show the file explorer with maximized canvas space',
    icon: PanelLeft,
    color: 'text-foreground',
    bgColor: 'bg-secondary border-border text-foreground',
  },
  {
    id: 'insights',
    label: 'Insights Only',
    description: 'Show repository insights without the file tree',
    icon: PanelRight,
    color: 'text-foreground',
    bgColor: 'bg-secondary border-border text-foreground',
  },
  {
    id: 'focus',
    label: 'Focus Mode',
    description: 'Minimizes sidebars to focus purely on the canvas',
    icon: Monitor,
    color: 'text-foreground',
    bgColor: 'bg-secondary border-border text-foreground',
  },
];

export const LAYOUT_MODE_IDS = ['full', 'explorer', 'insights', 'focus'] as const;
export type WorkspaceModeId = (typeof LAYOUT_MODE_IDS)[number];
