'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import MetricCard from './MetricCard';
import Graph from './graph';

export default function DashboardContent() {
  const [selectedPeriod, setSelectedPeriod] = useState("Month");
  const [botData, setBotData] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBotAndNews = async () => {
    try {
      setError(null);

      const botRes = await fetch('http://127.0.0.1:5000/api/bots');
      if (!botRes.ok) throw new Error("Bot API not OK");
      const botJson = await botRes.json();
      setBotData(botJson);

      const newsRes = await fetch('http://127.0.0.1:5000/api/agri-news');
      if (!newsRes.ok) throw new Error("News API not OK");
      const newsJson = await newsRes.json();
      setNews(newsJson);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchBotAndNews();
    const id = setInterval(fetchBotAndNews, 5000);
    return () => clearInterval(id);
  }, []);

  if (!botData && !error) {
    return <div className="p-6 text-gray-600">Loading real-time data...</div>;
  }

  // --- FIXED TREND RETURN TYPE ---
  const getTrend = (value: number | string | undefined): "up" | "down" => {
    if (!value) return "up";
    return String(value).includes("-") ? "down" : "up";
  };

  // --- FIXED METRICS ---
  const metrics = [
    {
      title: botData?.soil_moisture ? `${botData.soil_moisture}%` : "N/A",
      subtitle: "Soil Moisture",
      change: botData?.soil_moisture_change ?? "",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      trend: "up" as const
    },
    {
      title: botData?.temperature ? `${botData.temperature}°C` : "N/A",
      subtitle: "Temperature",
      change: botData?.temperature_change ?? "",
      color: "bg-gradient-to-br from-cyan-400 to-cyan-500",
      trend: "down" as const
    },
    {
      title: botData?.battery ? `${botData.battery}%` : "N/A",
      subtitle: "Battery Level",
      change: "",
      color: "bg-gradient-to-br from-amber-400 to-orange-500",
      trend: "up" as const
    },
    {
      title: botData?.status ?? "N/A",
      subtitle: "Bot Status",
      change: `Lat: ${botData?.latitude}, Lon: ${botData?.longitude}`,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      trend: "down" as const
    }
  ];

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 text-red-600">Error fetching data: {error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Agricultural Data
              </h2>
              <p className="text-sm text-gray-500">January - July 2025</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {["Day", "Month", "Year"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      selectedPeriod === period
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              <button
                onClick={() => alert("Export function placeholder")}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Graph data={botData?.graphData || []} />
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-3">Latest Agriculture News</h3>

        {news.length > 0 ? (
          <ul className="space-y-2">
            {news.map((n, i) => (
              <li key={i} className="text-sm">
                <strong>{n.title}</strong> —{" "}
                <span className="text-gray-500">{n.source}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No news available</p>
        )}
      </div>
    </div>
  );
}
