import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TimelineWeek } from '@/types';

interface RepoTimelineProps {
  timeline: TimelineWeek[];
  height?: number | string;
}

export function RepoTimeline({ timeline, height = 112 }: RepoTimelineProps) {
  const data = timeline.map((w) => ({
    week: w.week.slice(5),
    commits: w.count,
  }));

  if (!data.length) {
    return <p className="text-xs text-muted-foreground">No recent commit activity</p>;
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -20, bottom: 4 }}>
	          <defs>
	            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
	              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
	              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
	            </linearGradient>
	          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 10px 30px var(--surface-shadow)',
              color: 'var(--popover-foreground)',
              fontSize: 11,
              backdropFilter: 'blur(8px)',
            }}
            labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 'bold' }}
	            itemStyle={{ color: 'var(--accent)' }}
          />
          <Area
            type="monotone"
            dataKey="commits"
	            stroke="var(--accent)"
            fill="url(#areaGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
