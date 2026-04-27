'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Droplets, ShieldAlert, Thermometer, Wind } from 'lucide-react';

import MetricCard from './MetricCard';
import Graph from './graph';
import { apiFetch } from '@/lib/api';

type HistoryEntry = {
  id: string;
  moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  ph: number | null;
  obstacle: boolean;
  timestamp?: string | null;
};

type BotSummary = {
  soil_moisture?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  status?: string;
  task?: string;
  obstacle?: boolean;
  graphData?: Array<Record<string, any>>;
  history?: HistoryEntry[];
};

export default function DashboardContent() {
  const [botData, setBotData] = useState<BotSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Waiting for live sensor data');

  useEffect(() => {
    let active = true;

    const fetchBotData = async () => {
      try {
        setError(null);
        const response = await apiFetch('/api/bots');
        if (!response.ok) {
          throw new Error('Bot data could not be loaded');
        }

        const payload = await response.json();
        const nextBot = Array.isArray(payload) ? payload[0] : payload;

        if (!active) return;
        setBotData(nextBot);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err: any) {
        if (!active) return;
        setError(err.message || 'Unable to fetch dashboard data');
      }
    };

    fetchBotData();
    const timer = window.setInterval(fetchBotData, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const chartData = botData?.graphData || [];
  const isObstacle = Boolean(botData?.obstacle);

  const metrics = useMemo(
    () => [
      {
        title: typeof botData?.soil_moisture === 'number' ? `${botData.soil_moisture}%` : 'N/A',
        subtitle: 'Soil Moisture',
        change: 'Live from ESP32 soil sensor',
        color: 'bg-gradient-to-br from-blue-500 to-blue-700',
        trend: 'up' as const,
      },
      {
        title: typeof botData?.temperature === 'number' ? `${botData.temperature}°C` : 'N/A',
        subtitle: 'Temperature',
        change: 'DHT real-time temperature',
        color: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
        trend: 'up' as const,
      },
      {
        title: typeof botData?.humidity === 'number' ? `${botData.humidity}%` : 'N/A',
        subtitle: 'Humidity',
        change: 'DHT real-time humidity',
        color: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
        trend: 'up' as const,
      },
      {
        title: botData?.status || 'Waiting',
        subtitle: 'Bot Status',
        change: isObstacle ? 'Obstacle detected by ultrasonic sensor' : botData?.task || 'Monitoring',
        color: isObstacle
          ? 'bg-gradient-to-br from-rose-500 to-red-700'
          : 'bg-gradient-to-br from-violet-500 to-indigo-700',
        trend: isObstacle ? ('down' as const) : ('up' as const),
      },
    ],
    [botData, isObstacle]
  );

  return (
    <div className="min-h-full bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          Error fetching dashboard data: {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Live Farm Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Real-time sensor readings from the ESP32 hotspot and Pi backend.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-emerald-900/40 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Activity className="h-4 w-4" />
            <span className="font-semibold">Live sync active</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Updated at {lastUpdated}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Sensor Trend Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                Last 10 live readings stored in the local MongoDB collection.
              </p>
            </div>
          </div>

          <Graph
            data={chartData}
            xKey="time"
            showYAxis
            series={[
              { key: 'moisture', label: 'Moisture', color: '#2563eb' },
              { key: 'temperature', label: 'Temperature', color: '#f97316' },
              { key: 'humidity', label: 'Humidity', color: '#10b981' },
            ]}
            height={340}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Moisture Watch</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {typeof botData?.soil_moisture === 'number'
                    ? botData.soil_moisture <= 30
                      ? 'Irrigation attention is recommended now.'
                      : 'Moisture is within a stable working range.'
                    : 'Waiting for moisture data from the arm sensor.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-orange-50 p-3 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                <Thermometer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Temperature Watch</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {typeof botData?.temperature === 'number'
                    ? botData.temperature >= 38
                      ? 'Heat is high around the crop area. Monitor stress closely.'
                      : 'Temperature remains in a workable range.'
                    : 'Waiting for DHT temperature data.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-2xl p-3 ${
                  isObstacle
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                }`}
              >
                {isObstacle ? <ShieldAlert className="h-5 w-5" /> : <Wind className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Obstacle Safety</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isObstacle
                    ? 'Ultrasonic sensor sees an obstacle inside the stop range.'
                    : 'No obstacle is currently being reported by the ultrasonic sensor.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Last 10 Stored Readings
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Local MongoDB keeps only the most recent 10 ESP32 readings for offline Pi use.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {(botData?.history || []).slice().reverse().map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-950/50"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'No time'}
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Moisture {typeof entry.moisture === 'number' ? `${entry.moisture}%` : 'N/A'}
              </p>
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                Temp {typeof entry.temperature === 'number' ? `${entry.temperature}°C` : 'N/A'}
              </p>
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                Humidity {typeof entry.humidity === 'number' ? `${entry.humidity}%` : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
