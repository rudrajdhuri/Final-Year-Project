'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import MetricCard from './MetricCard';
import Graph from './graph';

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function DashboardContent() {
  const [selectedPeriod, setSelectedPeriod] = useState("Month");
  const [botData, setBotData] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBotAndNews = async () => {
    try {
      setError(null);
      const botRes = await fetch(`${API}/api/bots`);
      if (!botRes.ok) throw new Error("Bot API not OK");
      const botJson = await botRes.json();
      setBotData(Array.isArray(botJson) ? botJson[0] : botJson);

      const newsRes = await fetch(`${API}/api/agri-news`);
      if (!newsRes.ok) throw new Error("News API not OK");
      setNews(await newsRes.json());
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchBotAndNews();
    const id = setInterval(fetchBotAndNews, 5000);
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
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 min-h-full transition-colors duration-200">

      {error && (
        <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
          Error fetching data: {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metrics.map((metric, i) => <MetricCard key={i} {...metric} />)}
      </div>

      {/* Graph Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200 mb-5">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Agricultural Data</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">January - July 2025</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {["Day", "Month", "Year"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      selectedPeriod === period
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <button
                onClick={() => alert("Export function placeholder")}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
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

      {/* News Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Latest Agriculture News</h3>
        {news.length > 0 ? (
          <ul className="space-y-2">
            {news.map((n, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">{n.title}</strong>{" "}
                — <span className="text-gray-500 dark:text-gray-500">{n.source}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-500">No news available</p>
        )}
      </div>

    </div>
  );
}