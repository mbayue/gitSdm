import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useVizStore } from '@/stores/viz-store';
import type { TimelineWeek } from '@/types';

interface RepoTimelineProps {
  timeline: TimelineWeek[];
  height?: number | string;
}

export function RepoTimeline({ timeline, height = 112 }: RepoTimelineProps) {
  const theme = useVizStore((s) => s.theme);
  const isDark = theme === 'dark';
  const data = timeline.map((w) => ({
    week: w.week.slice(5),
    commits: w.count,
  }));

  if (!data.length) {
    return <p className="text-xs text-zinc-500">No recent commit activity</p>;
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -20, bottom: 4 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#71717a', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: isDark ? 'rgba(9,9,11,0.95)' : 'rgba(255,255,255,0.96)',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(24,24,27,0.12)',
              borderRadius: 8,
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(24,24,27,0.12)',
              color: isDark ? '#e4e4e7' : '#18181b',
              fontSize: 11,
              backdropFilter: 'blur(8px)',
            }}
            labelStyle={{ color: isDark ? '#a1a1aa' : '#52525b', fontWeight: 'bold' }}
            itemStyle={{ color: '#a78bfa' }}
          />
          <Area
            type="monotone"
            dataKey="commits"
            stroke="#a78bfa"
            fill="url(#areaGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
