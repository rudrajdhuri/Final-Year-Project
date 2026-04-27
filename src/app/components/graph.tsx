'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type SeriesConfig = {
  key: string;
  label: string;
  color: string;
};

interface GraphProps {
  data: Record<string, any>[];
  xKey?: string;
  series?: SeriesConfig[];
  height?: number;
  showYAxis?: boolean;
}

const defaultSeries: SeriesConfig[] = [
  { key: 'value', label: 'Value', color: '#10b981' },
];

export default function Graph({
  data,
  xKey = 'label',
  series = defaultSeries,
  height = 320,
  showYAxis = false,
}: GraphProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const palette = useMemo(
    () => ({
      grid: isDark ? '#243041' : '#e8edf4',
      tick: isDark ? '#94a3b8' : '#64748b',
      tooltipBg: isDark ? '#111827' : '#ffffff',
      tooltipBorder: isDark ? '#334155' : '#dbe4ee',
      axis: isDark ? '#1f2937' : '#e2e8f0',
    }),
    [isDark]
  );

  const domain = useMemo(() => {
    const values = data.flatMap((row) =>
      series
        .map((item) => Number(row[item.key]))
        .filter((value) => Number.isFinite(value))
    );

    if (!values.length) return [0, 100];

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      const pad = Math.max(1, Math.abs(min) * 0.15);
      return [Math.max(0, min - pad), max + pad];
    }

    const padding = Math.max(1, (max - min) * 0.18);
    return [Math.max(0, min - padding), max + padding];
  }, [data, series]);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={palette.grid} vertical={false} />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: palette.tick, fontSize: 12 }}
            dy={10}
          />
          <YAxis
            hide={!showYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fill: palette.tick, fontSize: 12 }}
            domain={domain as [number, number]}
            width={44}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: palette.tooltipBg,
              border: `1px solid ${palette.tooltipBorder}`,
              borderRadius: '14px',
              color: isDark ? '#f8fafc' : '#0f172a',
              fontSize: '12px',
              boxShadow: '0 18px 44px rgba(15,23,42,0.14)',
            }}
            cursor={{ stroke: palette.axis, strokeWidth: 1 }}
          />
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                fill: item.color,
                stroke: isDark ? '#020617' : '#ffffff',
                strokeWidth: 2,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
