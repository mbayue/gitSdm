import { SiteFooter } from '@/components/layout/SiteFooter';
import { prefersReducedMotion } from '@/lib/motion-preference';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsStrip } from '@/components/home/StatsStrip';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Trending } from '@/components/home/Trending';
import { CapabilityGroups } from '@/components/home/CapabilityGroups';
import { LAST_REPO_KEY } from '@/lib/utils';

export function HomePage() {
  const [repoUrl] = useState(() =>
    typeof localStorage === 'undefined' ? '' : (localStorage.getItem(LAST_REPO_KEY) ?? ''),
  );

  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (!sectionId) return;

    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'instant' : 'smooth',
        block: 'start',
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
      <SiteFooter />
    </div>
  );
}
