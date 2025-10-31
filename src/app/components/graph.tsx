'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', desktop: 2400, mobile: 1800 },
  { month: 'Feb', desktop: 1398, mobile: 2200 },
  { month: 'Mar', desktop: 4000, mobile: 2800 },
  { month: 'Apr', desktop: 3908, mobile: 1900 },
  { month: 'May', desktop: 4800, mobile: 3200 },
  { month: 'Jun', desktop: 3800, mobile: 2100 },
  { month: 'Jul', desktop: 4300, mobile: 2900 },
];

export default function Graph() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#f0f0f0"
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis hide />
          <Line
            type="monotone"
            dataKey="desktop"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#10b981' }}
          />
          <Line
            type="monotone"
            dataKey="mobile"
            stroke="#06b6d4"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#06b6d4' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}