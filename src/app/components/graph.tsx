'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';

interface GraphProps {
  data: any[];
}

export default function Graph({ data }: GraphProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const gridColor  = isDark ? '#1f2937' : '#f0f0f0';
  const tickColor  = isDark ? '#6b7280' : '#9ca3af';
  const tooltipBg  = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tickColor, fontSize: 12 }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '8px',
              color: isDark ? '#f9fafb' : '#111827',
              fontSize: '12px',
            }}
            cursor={{ stroke: isDark ? '#374151' : '#e5e7eb', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#10b981', stroke: isDark ? '#111827' : '#ffffff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}