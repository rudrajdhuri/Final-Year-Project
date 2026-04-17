'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import MetricCard from './MetricCard';
import Graph from './graph';
import { apiFetch } from "@/lib/api";

export default function DashboardContent() {
  const [selectedPeriod, setSelectedPeriod] = useState("Month");
  const [botData, setBotData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBotData = async () => {
    try {
      setError(null);
      const botRes = await apiFetch("/api/bots");
      if (!botRes.ok) throw new Error("Bot API not OK");
      const botJson = await botRes.json();
      setBotData(Array.isArray(botJson) ? botJson[0] : botJson);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchBotData();
    const id = setInterval(fetchBotData, 5000);
    return () => clearInterval(id);
  }, []);

  if (!botData && !error) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-400 transition-colors duration-200">
        Loading real-time data...
      </div>
    );
  }

  const metrics = [
    {
      title: botData?.soil_moisture ? `${botData.soil_moisture}%` : "N/A",
      subtitle: "Soil Moisture",
      change: botData?.soil_moisture_change ?? "",
      color: "bg-gradient-to-br from-blue-500 to-blue-700",
      trend: "up" as const,
    },
    {
      title: botData?.temperature ? `${botData.temperature}°C` : "N/A",
      subtitle: "Temperature",
      change: botData?.temperature_change ?? "",
      color: "bg-gradient-to-br from-cyan-400 to-cyan-600",
      trend: "down" as const,
    },
    {
      title: botData?.status ?? "N/A",
      subtitle: "Bot Status",
      change: `Lat: ${botData?.latitude ?? "—"}, Lon: ${botData?.longitude ?? "—"}`,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-700",
      trend: "down" as const,
    },
  ];

  return (
    <div className="min-h-full bg-gray-50 p-4 transition-colors duration-200 dark:bg-gray-950 sm:p-6">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Error fetching data: {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, i) => <MetricCard key={i} {...metric} />)}
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white shadow-sm transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-5 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Agricultural Data</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">January - July 2025</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                {["Day", "Month", "Year"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <button
                onClick={() => alert("Export function placeholder")}
                className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-5">
          <Graph data={botData?.graphData || []} />
        </div>
      </div>
    </div>
  );
}
