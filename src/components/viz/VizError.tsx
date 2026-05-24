import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlassCard } from '@/components/ui/GlassCard';

interface VizErrorProps {
  message: string;
}

export function VizError({ message }: VizErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center mesh-bg p-4">
      <GlassCard className="max-w-md text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <h2 className="mt-4 text-lg font-semibold text-white">Analysis failed</h2>
        <p className="mt-2 text-sm text-zinc-400">{message}</p>
        <Link to="/" className="mt-6 inline-block">
          <GlowButton>Back to home</GlowButton>
        </Link>
      </GlassCard>
    </div>
  );
}
