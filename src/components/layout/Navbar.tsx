import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { SettingsPopover } from '@/components/viz/SettingsPopover';
// import { useVizStore } from '@/stores/vizStore';

export function Navbar() {
  // const { theme, toggleTheme } = useVizStore();
  const location = useLocation();
  const navigate = useNavigate();

  const goToSection = (sectionId: string) => {
    const scrollToSection = () => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };

    if (location.pathname !== '/') {
      navigate({ pathname: '/', hash: `#${sectionId}` });
      window.setTimeout(scrollToSection, 80);
      return;
    }

    if (location.hash !== `#${sectionId}`) {
      navigate({ pathname: '/', hash: `#${sectionId}` }, { replace: true });
    }
    scrollToSection();
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-zinc-950/60 shadow-[0_8px_18px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="logo-bg flex h-8 w-8 items-center justify-center rounded-lg">
            <GitBranch className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">
            git<span className="gradient-text">Sdm</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Theme toggle disabled/hidden for now
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          */}
          <SettingsPopover />
          <GlowButton
            type="button"
            variant="ghost"
            className="h-8 !py-0 !px-3 text-xs"
            onClick={() => goToSection('analyze')}
          >
            Analyze
          </GlowButton>
        </div>
      </div>
    </nav>
  );
}
