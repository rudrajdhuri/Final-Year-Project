"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Droplets, FlaskConical, Thermometer, Waves } from "lucide-react";

import Graph from "../components/graph";
import { apiFetch } from "@/lib/api";

type SoilHistoryRow = {
  id: string;
  moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  ph: number | null;
  obstacle: boolean;
  timestamp?: string | null;
};

type SoilPayload = {
  moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  ph: number | null;
  connected: boolean;
  obstacle: boolean;
  timestamp?: string | null;
  history: SoilHistoryRow[];
};

function formatValue(value: number | null | undefined, suffix = "") {
  return typeof value === "number" ? `${value}${suffix}` : "Not available";
}

export default function SoilSensorPage() {
  const [data, setData] = useState<SoilPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await apiFetch("/api/soil/readings");
        if (!response.ok) throw new Error("Soil readings could not be loaded");

        const payload = await response.json();
        if (!active) return;
        setData(payload);
        setError(null);
      } catch (err: any) {
        if (!active) return;
        setError(err.message || "Unable to load soil readings");
      }
    };

    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const metrics = useMemo(
    () => [
      {
        icon: Droplets,
        label: "Moisture",
        value: formatValue(data?.moisture, "%"),
        tone: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-500/10",
      },
      {
        icon: Thermometer,
        label: "Temperature",
        value: formatValue(data?.temperature, "°C"),
        tone: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-500/10",
      },
      {
        icon: Waves,
        label: "Humidity",
        value: formatValue(data?.humidity, "%"),
        tone: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
      },
      {
        icon: FlaskConical,
        label: "pH",
        value: formatValue(data?.ph),
        tone: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-500/10",
      },
    ],
    [data]
  );

  const chartData = useMemo(
    () =>
      (data?.history || []).map((row) => ({
        time: row.timestamp
          ? new Date(row.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "--:--",
        moisture: row.moisture,
        temperature: row.temperature,
        humidity: row.humidity,
        ph: row.ph,
      })),
    [data]
  );

  return (
    <div className="min-h-full bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Soil Sensor Readings
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Live arm-sensor values from the ESP32 stream and the last 10 MongoDB readings.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm dark:border-emerald-500/20 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {data?.connected ? "Sensor bridge live" : "Waiting for ESP32 stream"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {data?.timestamp ? new Date(data.timestamp).toLocaleString() : "No live timestamp yet"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl p-3 ${metric.bg}`}>
                    <Icon className={`h-6 w-6 ${metric.tone}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 sm:text-base">
                      {metric.label}
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                      {metric.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Dynamic Reading Chart
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                Auto-scaled graph so even small value changes stay visible.
              </p>
            </div>

            <Graph
              data={chartData}
              xKey="time"
              showYAxis
              height={360}
              series={[
                { key: "moisture", label: "Moisture", color: "#2563eb" },
                { key: "temperature", label: "Temperature", color: "#f97316" },
                { key: "humidity", label: "Humidity", color: "#10b981" },
                { key: "ph", label: "pH", color: "#8b5cf6" },
              ]}
            />
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Recent History
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Latest 10 readings stored locally in MongoDB.
            </p>

            <div className="mt-5 space-y-3">
              {(data?.history || []).slice().reverse().map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : "No time"}
                    </p>
                    {row.obstacle && (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        Obstacle
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                    Moisture {formatValue(row.moisture, "%")} | Temperature {formatValue(row.temperature, "°C")} |
                    Humidity {formatValue(row.humidity, "%")} | pH {formatValue(row.ph)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
