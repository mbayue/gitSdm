import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsStrip } from "@/components/home/StatsStrip";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Trending } from "@/components/home/Trending";
import { CapabilityGroups } from "@/components/home/CapabilityGroups";
import { LAST_REPO_KEY } from "@/lib/utils";

export function HomePage() {
  const [repoUrl] = useState(() => localStorage.getItem(LAST_REPO_KEY) ?? "");

  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (!sectionId) return;

    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="home-page min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection initialUrl={repoUrl} />
        <StatsStrip />
        <Trending />
        <CapabilityGroups />
        <HowItWorks />
      </main>
      <footer className="mt-auto border-t border-border py-8 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-foreground">
              gitSdm
            </span>
            <span className="text-xs text-muted-foreground">© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/mbayue/gitSdm"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/mbayue/gitSdm/wiki"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/mbayue/gitSdm/issues"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Issues
            </a>
            <a
              href="https://github.com/mbayue/gitSdm/blob/master/LICENSE"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              MIT License
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
