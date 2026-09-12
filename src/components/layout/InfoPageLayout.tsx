import { SiteFooter } from '@/components/layout/SiteFooter';
import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

export function InfoPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="home-page flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="home-container w-full flex-1 py-12 sm:py-16">{children}</main>
      <SiteFooter />
    </div>
  );
}
