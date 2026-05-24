import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useVizStore } from '@/stores/viz-store';
import type { TimelineWeek } from '@/types';

interface RepoTimelineProps {
  timeline: TimelineWeek[];
}

export function RepoTimeline({ timeline }: RepoTimelineProps) {
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
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="week"
            tick={{ fill: '#71717a', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: isDark ? 'rgba(24,24,27,0.95)' : 'rgba(255,255,255,0.96)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(24,24,27,0.12)',
              borderRadius: 8,
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 10px 30px rgba(24,24,27,0.12)',
              color: isDark ? '#e4e4e7' : '#18181b',
              fontSize: 11,
            }}
            labelStyle={{ color: isDark ? '#a1a1aa' : '#52525b' }}
            itemStyle={{ color: '#8b5cf6' }}
          />
          <Area
            type="monotone"
            dataKey="commits"
            stroke="#8b5cf6"
            fill="url(#areaGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
