import { ArrowRight } from 'lucide-react';

const pipeline = [
  { step: '01', title: 'GitHub URL', description: 'Paste any public repository URL.' },
  { step: '02', title: 'Fetch tree', description: 'Retrieve file structure and metadata.' },
  { step: '03', title: 'Parse manifests', description: 'Identify dependencies and workspaces.' },
  { step: '04', title: 'Resolve imports', description: 'Trace connections across all files.' },
  { step: '05', title: 'Build graph', description: 'Generate interactive dependency map.' },
  { step: '06', title: 'Explore', description: 'Inspect architecture and notes.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 py-12 sm:py-20 border-b border-[rgba(240,246,252,0.1)]">
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#e6edf3] mb-2">Analysis pipeline</h2>
        <p className="text-sm text-[#8b949e]">From URL to full understanding in seconds.</p>
      </div>

      <div className="relative grid gap-8 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
        <div className="hidden lg:block absolute top-2.5 left-6 right-6 h-[1px] bg-[rgba(240,246,252,0.1)] z-0" />
        {pipeline.map((item) => (
          <div key={item.step} className="relative z-10">
            {/* Step number */}
            <div className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-[#0d1117] text-[10px] font-bold text-[#e6edf3] border border-[rgba(240,246,252,0.2)] mb-4 tracking-widest relative">
              {item.step}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#e6edf3]">{item.title}</h3>
              <p className="text-xs text-[#8b949e] leading-relaxed pr-2">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
