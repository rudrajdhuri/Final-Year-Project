'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import MetricCard from './MetricCard';
import Graph from './graph';

export default function DashboardContent() {
  const [selectedPeriod, setSelectedPeriod] = useState('Month');

  const metrics = [
    {
      title: '65%',
      subtitle: 'Soil Moisture',
      change: '-12.4% ↓',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: 'down' as const
    },
    {
      title: '33°C',
      subtitle: 'Temperature',
      change: '+2°C ↑',
      color: 'bg-gradient-to-br from-cyan-400 to-cyan-500',
      trend: 'up' as const
    },
    {
      title: '84.7%',
      subtitle: 'Battery',
      change: '84.7%',
      color: 'bg-gradient-to-br from-amber-400 to-orange-500',
      trend: 'up' as const
    },
    {
      title: 'Sunny',
      subtitle: 'Weather Today',
      change: '12 km/h NW Wind',
      color: 'bg-gradient-to-br from-red-500 to-pink-600',
      trend: 'up' as const
    }
  ];

  return (
    <div className="p-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Agricultural Data Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Agricultural Data</h2>
              <p className="text-sm text-gray-500">January - July 2025</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['Day', 'Month', 'Year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      selectedPeriod === period
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Graph />
        </div>
      </div>
    </div>
  );
}