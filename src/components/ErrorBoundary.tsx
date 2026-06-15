import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-96 w-96 rounded-full bg-red-500/5 blur-[100px]" />
          </div>

          <div className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-900/60 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 border border-white/5">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Something Went Wrong</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-2">
              An unexpected error occurred while loading the page.
            </p>

            {this.state.error && (
              <div className="mt-4 rounded-lg bg-zinc-800/60 border border-white/5 p-3 text-left">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">
                  Error details
                </span>
                <p className="text-xs text-zinc-500 font-mono leading-relaxed break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-center">
              <Link to="/">
                <GlowButton variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </GlowButton>
              </Link>
              <GlowButton onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </GlowButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
