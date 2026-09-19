import { Link } from 'react-router-dom';
import { ArrowRight, FileQuestion, GitBranch } from 'lucide-react';
import { InfoPageLayout } from '@/components/layout/InfoPageLayout';

export function NotFoundPage() {
  return (
    <InfoPageLayout>
      <div className="mx-auto max-w-3xl py-8 sm:py-16">
        <p className="eyebrow mb-4">404 / Page not found</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">This path ends here.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">The page may have moved, or the address may be incorrect. Return home to open a repository and keep exploring.</p>
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4 text-sm font-medium">
            <FileQuestion aria-hidden="true" className="h-5 w-5 text-accent" /> Page unavailable
          </div>
          <div className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-medium">Find your next codebase</p><p className="mt-1 text-sm text-muted-foreground">Open a GitHub link or try the sample project.</p></div>
            <Link to="/" className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Go to homepage <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
        </div>
        <Link to="/mock/todo-app" className="mt-6 inline-flex items-center gap-2 text-sm text-accent underline-offset-4 hover:underline"><GitBranch aria-hidden="true" className="h-4 w-4" /> Explore the demo repository</Link>
      </div>
    </InfoPageLayout>
  );
}
