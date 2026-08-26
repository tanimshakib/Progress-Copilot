import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ContributionCell } from '../../lib/types';
import { useTheme } from '../../context/ThemeContext';

/**
 * TaskCompletionTrendChart — 30-day completion area chart for My Progress & Reports.
 * Dynamically adapts grid lines, tick labels, tooltip backgrounds, and colors
 * based on active Light / Dark theme.
 */
export function TaskCompletionTrendChart({
  data,
  height = 220,
}: {
  data: ContributionCell[];
  height?: number;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = data.map((d, i) => ({
    label: `${i + 1}`,
    count: d.count,
    date: d.date,
    tick: i % 5 === 0,
  }));
  const total = data.reduce((s, d) => s + d.count, 0);
  const avg = data.length ? (total / data.length).toFixed(1) : '0';

  const tickColor = isDark ? '#9CA3AF' : '#475569';
  const gridStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <div className="w-full">
      <div className="flex items-baseline gap-4 mb-2">
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{total}</div>
        <div className="text-xs text-slate-500 dark:text-gray-400">
          tasks in last {data.length} days · avg {avg}/day
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#a855f7' : '#7c3aed'} stopOpacity={0.55} />
                <stop offset="100%" stopColor={isDark ? '#a855f7' : '#7c3aed'} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: tickColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value, index) =>
                chartData[index]?.tick ? value : ''
              }
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: tickColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? 'rgba(22, 31, 48, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(226, 232, 240, 0.9)',
                borderRadius: 8,
                fontSize: 12,
                color: isDark ? '#F9FAFB' : '#0F172A',
                boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
              }}
              labelFormatter={(_label, payload) => {
                const item = payload?.[0]?.payload as
                  | { date?: string }
                  | undefined;
                return item?.date ?? '';
              }}
              formatter={(value: number) => [`${value} tasks`, 'Completed']}
              cursor={{ stroke: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={isDark ? '#a855f7' : '#7c3aed'}
              strokeWidth={2}
              fill="url(#trendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}