import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';

export function InfoPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="home-page flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="home-container w-full flex-1 py-12 sm:py-16">{children}</main>
      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 text-xs text-muted-foreground">
          <span>gitSdm · Repository explorer</span>
          <nav aria-label="Footer navigation" className="flex gap-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <a href="https://github.com/mbayue/gitSdm" className="hover:text-foreground">GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
