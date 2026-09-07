import { useNavigate } from "react-router-dom";
import { Search, Sun, Moon } from "lucide-react";
import type { RepoMeta, RepoAnalysis } from "@/types";
import { RepoIdentity } from "./RepoIdentity";
import { BranchSwitcher } from "./BranchSwitcher";
import { WorkspaceModeSelector } from "./WorkspaceModeSelector";
import { HeaderStats } from "./HeaderStats";
import { HeaderActionMenu } from "./HeaderActionMenu";
import { VIEW_TABS } from "./viewTabs";
import { useVizStore } from "@/stores/vizStore";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TopNavProps {
  analysis?: RepoAnalysis;
  meta?: RepoMeta;
  owner?: string;
  repo?: string;
}

export function TopNav({
  analysis,
  meta: propsMeta,
  owner: fallbackOwner = "",
  repo: fallbackRepo = "",
}: TopNavProps) {
  const {
    activeView,
    setActiveView,
    theme,
    toggleTheme,
  } = useVizStore();
  const navigate = useNavigate();
  const meta = propsMeta ?? analysis?.meta;
  const owner = meta ? meta.fullName.split("/")[0] : fallbackOwner;
  const repoName = meta ? meta.fullName.split("/")[1] : fallbackRepo;

  return (
    <header className="relative z-[80] w-full shrink-0 border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-4">
          <RepoIdentity owner={owner} repoName={repoName} />
          <div className="hidden border-l border-border pl-4 sm:block">
            <BranchSwitcher
              owner={owner}
              repo={repoName}
              defaultBranch={meta?.defaultBranch || "main"}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden lg:block">
            <HeaderStats analysis={analysis} meta={meta} />
          </div>
          <Tooltip>
          <TooltipTrigger
            type="button"
            onClick={() => navigate(`/${owner}/${repoName}/search`)}
            className="icon-button header-action"
            aria-label="Search repository"
          >
            <Search className="h-4 w-4" />
            <span className="hidden xl:inline">Search repository</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Search repository</TooltipContent>
          </Tooltip>
          <Tooltip>
          <TooltipTrigger
            type="button"
            onClick={toggleTheme}
            className="icon-button header-action"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </TooltipTrigger>
          <TooltipContent side="bottom">{theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}</TooltipContent>
          </Tooltip>
          <HeaderActionMenu
            owner={owner}
            repo={repoName}
            analysis={analysis}
            meta={meta}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 sm:px-5">
        <nav
          aria-label="Repository views"
          className="workspace-tabs flex min-w-0 items-center gap-1 overflow-x-auto"
        >
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={activeView === tab.id ? "page" : undefined}
              onClick={() => setActiveView(tab.id)}
              className={cn(
                "workspace-view flex h-11 shrink-0 items-center gap-2 border-b-2 px-2.5 text-sm font-medium sm:px-3",
                activeView === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <div className="hidden sm:block">
            <WorkspaceModeSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
