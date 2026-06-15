import { GitBranch, Network, Users, History } from 'lucide-react';

export const VIEW_TABS = [
  { id: 'graph' as const, label: 'Dependency Graph', icon: GitBranch },
  { id: 'architecture' as const, label: 'Architecture', icon: Network },
  { id: 'contributors' as const, label: 'Contributors', icon: Users },
  { id: 'commits' as const, label: 'Commits', icon: History },
];

export type ViewTab = typeof VIEW_TABS[number];
