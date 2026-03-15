'use client';

import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  subtitle: string;
  change: string;
  color: string;
  trend: 'up' | 'down';
}

export default function MetricCard({ title, subtitle, change, color, trend }: MetricCardProps) {
  const isPositive = trend === 'up';

  return (
    <div className={`${color} rounded-xl p-6 text-white relative overflow-hidden shadow-md`}>
      {/* Decorative background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-black/10 translate-y-6 -translate-x-6" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/75 text-xs font-medium uppercase tracking-wider mb-1">{subtitle}</p>
            <h3 className="text-3xl font-bold tracking-tight">{title}</h3>
          </div>
          <button className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className={`p-1 rounded-full ${isPositive ? 'bg-white/20' : 'bg-white/20'}`}>
            {isPositive
              ? <TrendingUp className="h-3.5 w-3.5 text-white" />
              : <TrendingDown className="h-3.5 w-3.5 text-white" />}
          </div>
          <span className="text-sm font-medium text-white/90">{change}</span>
        </div>
      </div>
    </div>
  );
}