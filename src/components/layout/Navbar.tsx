import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GitBranch, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'trending', label: 'Trending' },
  { id: 'how-it-works', label: 'Demo' },
];

export function Navbar() {
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
    <nav className="fixed top-0 z-50 w-full border-b border-[#272233] bg-[#050509]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-[#f8fafc]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#22d3ee]">
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">
            git<span className="bg-gradient-to-r from-[#8b5cf6] to-[#22d3ee] bg-clip-text text-transparent">Sdm</span>
          </span>
        </Link>

        {/* Center nav links - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => goToSection(link.id)}
              className="px-3 py-1.5 text-sm text-[#a1a1aa] hover:text-[#f8fafc] transition-colors rounded-md hover:bg-white/5 cursor-pointer"
            >
              {link.label}
            </button>
          ))}
          <a
            href="https://github.com/bayue48/gitSdm"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm text-[#a1a1aa] hover:text-[#f8fafc] transition-colors rounded-md hover:bg-white/5"
          >
            GitHub
          </a>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Separator orientation="vertical" className="h-5 hidden md:block bg-[#272233]" />
          <Button
            variant="default"
            size="sm"
            onClick={() => goToSection('analyze')}
            className="gap-1.5 bg-gradient-to-r from-[#8b5cf6] to-[#22d3ee] text-white border-0 hover:opacity-90 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Analyze
          </Button>
        </div>
      </div>
    </nav>
  );
}
