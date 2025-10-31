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
          {title.includes('Users') && (
            <path
              d="M 0,60 Q 25,50 50,55 T 100,45 Q 125,40 150,50 T 200,45"
              stroke="white"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          )}
          {title.includes('$') && (
            <path
              d="M 0,70 Q 30,60 60,65 Q 90,70 120,60 Q 150,50 180,55 L 200,50"
              stroke="white"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          )}
          {title.includes('%') && (
            <path
              d="M 0,80 Q 40,60 80,65 Q 120,70 160,50 L 200,45"
              stroke="white"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          )}
          {title.includes('44K') && (
            <>
              {/* Bar chart for Sessions */}
              <rect x="20" y="70" width="8" height="20" fill="white" opacity="0.3" />
              <rect x="35" y="60" width="8" height="30" fill="white" opacity="0.3" />
              <rect x="50" y="55" width="8" height="35" fill="white" opacity="0.3" />
              <rect x="65" y="65" width="8" height="25" fill="white" opacity="0.3" />
              <rect x="80" y="50" width="8" height="40" fill="white" opacity="0.3" />
              <rect x="95" y="70" width="8" height="20" fill="white" opacity="0.3" />
              <rect x="110" y="45" width="8" height="45" fill="white" opacity="0.3" />
              <rect x="125" y="75" width="8" height="15" fill="white" opacity="0.3" />
              <rect x="140" y="60" width="8" height="30" fill="white" opacity="0.3" />
              <rect x="155" y="55" width="8" height="35" fill="white" opacity="0.3" />
              <rect x="170" y="80" width="8" height="10" fill="white" opacity="0.3" />
            </>
          )}
        </svg>
      </div>
      
      {/* Content */}
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
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
    </div>
  );
}