import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const PALETTE = {
  high: '#ef4444',   // rose-500
  medium: '#f59e0b', // amber-500
  low: '#10b981',    // emerald-500
};

/**
 * PointsDistributionChart — donut showing how earned points split across HIGH / MEDIUM / LOW priority tasks.
 * Dynamically adapts tooltip, text, and legend contrast for Light and Dark themes.
 */
export function PointsDistributionChart({
  data,
  height = 220,
}: {
  data: { high: number; medium: number; low: number };
  height?: number;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const rows = [
    { key: 'HIGH', label: 'High priority', value: data.high, color: PALETTE.high },
    { key: 'MED', label: 'Medium priority', value: data.medium, color: PALETTE.medium },
    { key: 'LOW', label: 'Low priority', value: data.low, color: PALETTE.low },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (total === 0) {
    return (
      <div
        className="grid place-items-center text-sm text-slate-500 dark:text-gray-400 italic"
        style={{ height }}
      >
        Complete a task to see your points breakdown.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-baseline gap-4 mb-2">
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{total}</div>
        <div className="text-xs text-slate-500 dark:text-gray-400">total points earned</div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="label"
              innerRadius="50%"
              outerRadius="75%"
              paddingAngle={3}
              strokeWidth={0}
            >
              {rows.map((r) => (
                <Cell key={r.key} fill={r.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const p = payload[0];
                const label =
                  (p.payload as { label?: string } | undefined)?.label ??
                  (p.name as string) ??
                  '';
                const value = (p.value as number) ?? 0;
                const color =
                  (p.payload as { color?: string } | undefined)?.color ?? '#fff';
                return (
                  <div
                    style={{
                      background: isDark ? 'rgba(22, 31, 48, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                      border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(226, 232, 240, 0.9)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
                      color: isDark ? '#F9FAFB' : '#0F172A',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 9999,
                          background: color,
                          display: 'inline-block',
                        }}
                      />
                      {label}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        marginTop: 4,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {value} pts
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Custom legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-700 dark:text-gray-300">
        {rows.map((r) => (
          <span key={r.key} className="inline-flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{ width: 9, height: 9, background: r.color }}
            />
            {r.label}
            <span className="text-slate-500 dark:text-gray-500 tabular-nums">{r.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}