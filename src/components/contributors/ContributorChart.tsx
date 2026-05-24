import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Contributor } from '@/types';

interface ContributorChartProps {
  contributors: Contributor[];
}

export function ContributorChart({ contributors }: ContributorChartProps) {
  const data = contributors.map((c) => ({
    name: c.login,
    contributions: c.contributions,
  }));

  if (!data.length) {
    return <p className="text-xs text-zinc-500">No contributor data</p>;
  }

  const rowHeight = 24; // px per contributor row
  const maxHeight = 320; // cap height for the chart
  const height = Math.min(Math.max(rowHeight * data.length, 80), maxHeight);

  return (
    <div className="w-full bg-transparent" style={{ height, minHeight: 80 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }} style={{ background: 'transparent' }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={72}
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(24,24,27,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Bar dataKey="contributions" fill="url(#barGradient)" radius={[0, 4, 4, 0]} />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
