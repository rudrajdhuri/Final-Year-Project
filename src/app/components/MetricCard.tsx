"use client";

import { MoreHorizontal, TrendingDown, TrendingUp } from "lucide-react";

interface MetricCardProps {
  title: string;
  subtitle: string;
  change: string;
  color: string;
  trend: "up" | "down";
}

export default function MetricCard({ title, subtitle, change, color, trend }: MetricCardProps) {
  const isPositive = trend === "up";

  return (
    <div className={`${color} relative overflow-hidden rounded-3xl p-6 text-white shadow-md sm:p-7`}>
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 h-20 w-20 -translate-x-6 translate-y-6 rounded-full bg-black/10" />

      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-white/75">
              {subtitle}
            </p>
            <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h3>
          </div>
          <button className="rounded-lg p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="rounded-full bg-white/20 p-1">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-white" />
            )}
          </div>
          <span className="text-sm font-medium text-white/90 sm:text-base">{change}</span>
        </div>
      </div>
    </div>
  );
}
