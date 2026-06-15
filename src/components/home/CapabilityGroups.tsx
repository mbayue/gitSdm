
const groups = [
  {
    title: 'Map the codebase',
    description: 'Trace imports, entry points, and dependency direction across files.',
  },
  {
    title: 'Inspect relationships',
    description: 'Select a node to view dependents, imports, file metadata, and related modules.',
  },
  {
    title: 'Explain modules',
    description: 'Generate architecture notes from selected files, modules, or the whole repository.',
  },
  {
    title: 'Compare changes',
    description: 'Review branch differences and identify architecture-impacting changes.',
  },
  {
    title: 'Export documentation',
    description: 'Export graph snapshots, Mermaid diagrams, or PDF architecture notes.',
  },
];

export function CapabilityGroups() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6 py-12 sm:py-20 border-b border-[rgba(240,246,252,0.1)]">
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#e6edf3] mb-2">Capabilities</h2>
        <p className="text-sm text-[#8b949e]">Built for developer velocity and architectural clarity.</p>
      </div>

      <div className="grid gap-px bg-[rgba(240,246,252,0.1)] border border-[rgba(240,246,252,0.1)] rounded-lg overflow-hidden grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
        {groups.map((group, idx) => (
          <div key={group.title} className={`bg-[#161b22] p-6 flex flex-col gap-2 sm:col-span-1 ${idx < 3 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <h3 className="text-sm font-bold text-[#e6edf3]">{group.title}</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">{group.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
