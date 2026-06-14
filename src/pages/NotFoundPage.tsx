import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4" style={{ background: '#050509' }}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#8b5cf6]/6 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#22d3ee]/4 rounded-full blur-[120px]" />
      </div>

      {/* Faint grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[#272233] bg-[#0f0f17]/80 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl text-center"
      >
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2 mb-6 text-[#a1a1aa]">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-semibold text-[#f8fafc]">gitSdm</span>
        </div>

        {/* 404 */}
        <div className="relative mb-5">
          <h1 className="text-8xl font-extrabold tracking-tight bg-gradient-to-b from-[#8b5cf6] to-[#8b5cf6]/40 bg-clip-text text-transparent select-none">
            404
          </h1>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-extrabold tracking-tight text-[#f8fafc] mb-2">Page not found</h2>
        <p className="text-sm text-[#a1a1aa] leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <Button
            onClick={() => navigate('/')}
            className="w-full h-11 bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:from-[#7c3aed] hover:to-[#a78bfa] text-white font-medium border-0 shadow-[0_4px_20px_rgba(139,92,246,0.25)] gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full h-11 border-[#272233] bg-transparent text-[#f8fafc] hover:bg-[#161622] gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Helper text */}
        <p className="mt-7 text-xs text-[#a1a1aa]/70">
          Can't find what you need? Try checking our{' '}
          <a href="https://github.com/bayue48/gitSdm" target="_blank" rel="noopener noreferrer" className="text-[#8b5cf6] hover:underline">
            documentation
          </a>.
        </p>
      </motion.div>
    </div>
  );
}
