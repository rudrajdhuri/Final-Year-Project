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
    <div className={`${color} rounded-xl p-6 text-white relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
          {title.includes('%') && (
            <path
              d="M 0,80 Q 40,60 80,65 Q 120,70 160,50 L 200,45"
              stroke="white"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          )}
        </svg>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">{title}</h3>
            <p className="text-white/80 text-sm">{subtitle}</p>
          </div>
          <button className="text-white/60 hover:text-white transition-colors">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-white/80" />
          ) : (
            <TrendingDown className="h-4 w-4 text-white/80" />
          )}
          <span className="text-sm font-medium text-white/90">{change}</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
