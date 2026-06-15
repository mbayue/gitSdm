import { motion } from 'framer-motion';

const stats = [
  { value: '318', label: 'Files parsed' },
  { value: '742', label: 'Imports resolved' },
  { value: '41', label: 'Modules detected' },
  { value: 'force / dagre', label: 'Layout engines' },
  { value: 'PNG / PDF / Mermaid', label: 'Export formats' },
];

export function StatsStrip() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-b border-[rgba(240,246,252,0.1)] bg-[#0d1117] py-4"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-6 overflow-x-auto no-scrollbar">
          {stats.map((s, idx) => (
            <div key={s.label} className="flex items-center gap-6">
              <div className="flex flex-col gap-0.5 min-w-fit">
                <div className="text-[11px] font-mono font-bold text-[#e6edf3] whitespace-nowrap">{s.value}</div>
                <div className="text-[10px] text-[#8b949e] uppercase tracking-wider whitespace-nowrap">{s.label}</div>
              </div>
              {idx < stats.length - 1 && (
                <div className="h-6 w-[1px] bg-[rgba(240,246,252,0.1)] hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
