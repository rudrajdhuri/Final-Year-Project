'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Leaf, ShieldAlert, Sprout, Waves } from 'lucide-react';

import MetricCard from './MetricCard';
import { apiFetch } from '@/lib/api';

type BotSummary = {
  soil_moisture?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  status?: string;
  task?: string;
  obstacle?: boolean;
  arm_active?: boolean;
  bot_running?: boolean;
};

export default function DashboardContent() {
  const [botData, setBotData] = useState<BotSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Waiting for verified arm reading');

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
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

  const isObstacle = Boolean(botData?.obstacle);
  const metrics = useMemo(
    () => [
      {
        title: typeof botData?.soil_moisture === 'number' ? `${botData.soil_moisture}%` : 'N/A',
        subtitle: 'Soil Moisture',
        change: botData?.arm_active ? 'Latest arm-down soil reading' : 'Waiting for next arm-down reading',
        color: 'bg-gradient-to-br from-blue-500 to-blue-700',
        trend: 'up' as const,
      },
      {
        title: typeof botData?.temperature === 'number' ? `${botData.temperature}°C` : 'N/A',
        subtitle: 'Temperature',
        change: botData?.arm_active ? 'Latest verified crop-zone reading' : 'Shows only arm-down readings',
        color: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
        trend: 'up' as const,
      },
      {
        title: typeof botData?.humidity === 'number' ? `${botData.humidity}%` : 'N/A',
        subtitle: 'Humidity',
        change: botData?.arm_active ? 'Latest verified humidity reading' : 'Waiting for next valid reading',
        color: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
        trend: 'up' as const,
      },
      {
        title: botData?.status || 'Waiting',
        subtitle: 'Bot Status',
        change: isObstacle ? 'Bot paused because something is ahead' : botData?.task || 'Monitoring',
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
            Real-time overview for offline bot monitoring, threat detection, and crop support.
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

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_28%)] px-6 py-7 sm:px-8 sm:py-9">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Leaf className="h-4 w-4" />
                Offline Smart Agriculture
              </div>
              <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl">
                Agri Bot helps farmers monitor crop health, soil condition, and field safety from one local dashboard.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-400 sm:text-base">
                Built for Raspberry Pi and ESP32 hotspot use, the platform keeps working without internet and focuses on practical field support: clear readings, simple warnings, and bot controls that are easy to use in real farm conditions.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Built for the field</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400 sm:text-base">
                  Manual and autonomous control stay connected to the same offline Pi backend, so the user always sees the bot’s real state.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                <Waves className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sensor readings that matter</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400 sm:text-base">
                  Soil, temperature, and humidity are shown only from valid arm-down sensing moments, so the operator sees useful values instead of noise.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Simple crop awareness</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400 sm:text-base">
                  The app combines model detections, moisture warnings, temperature hints, and obstacle events in language that is easier for users to act on quickly.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="flex items-start gap-3">
              <div
                className={`rounded-2xl p-3 ${
                  isObstacle
                    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    : 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live safety watch</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400 sm:text-base">
                  {isObstacle
                    ? 'An obstacle is currently being reported while the bot is moving.'
                    : 'The ultrasonic safety system is ready to warn only during active bot movement.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
