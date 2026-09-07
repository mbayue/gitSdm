import { TooltipHint } from '@/components/ui/tooltip';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, GitBranch, Moon, Sun } from "lucide-react";
import { useVizStore } from "@/stores/vizStore";

export function Navbar() {
  const theme = useVizStore((state) => state.theme);
  const setTheme = useVizStore((state) => state.setTheme);
  const location = useLocation();
  const navigate = useNavigate();

  // Smooth-scroll to a homepage section. Plain `href="/#id"` anchors cause a
  // full route navigation (losing SPA state) and are a no-op on reclick;
  // intercepting keeps the href fallback while scrolling smoothly instead.
  const handleSectionClick = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const scrollNow = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (location.pathname !== "/") {
      void navigate("/");
      // Let the home page mount before scrolling to the section.
      window.setTimeout(scrollNow, 150);
      return;
    }
    window.history.replaceState(null, "", `/#${id}`);
    scrollNow();
  };
  return (
    <nav
      className="site-nav sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="home-container flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-3"
          aria-label="gitSdm home"
        >
          <span className="brand-mark">
            <GitBranch className="h-5 w-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            gitSdm<span className="text-accent">.</span>
          </span>
          <span className="hidden border-l border-border pl-4 font-mono text-xs text-muted-foreground lg:inline">
            CODEBASE EXPLORER
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#features" onClick={handleSectionClick("features")} className="hover:text-foreground">
            Features
          </a>
          <a href="/#examples" onClick={handleSectionClick("examples")} className="hover:text-foreground">
            Repositories
          </a>
          <a href="/#how-it-works" onClick={handleSectionClick("how-it-works")} className="hover:text-foreground">
            How it works
          </a>
        </div>
        <div className="flex items-center gap-3">
          <TooltipHint content={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}><button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="icon-button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button></TooltipHint>
          <a
            href="https://github.com/mbayue/gitSdm"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
          >
            GitHub <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}
