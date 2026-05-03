"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Droplets, FlaskConical, Thermometer, Waves } from "lucide-react";

import Graph from "../components/graph";
import { getGuestHistory, pushGuestHistory, useAuth } from "../components/AuthContext";
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
  arm_active: boolean;
  bot_running: boolean;
  timestamp?: string | null;
  history: SoilHistoryRow[];
};

function formatValue(value: number | null | undefined, suffix = "") {
  return typeof value === "number" ? `${value}${suffix}` : "Not available";
}

function formatIst(value?: string | null, withDate = false) {
  if (!value) return withDate ? "No reading time yet" : "--:--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: withDate ? "numeric" : undefined,
    month: withDate ? "short" : undefined,
    day: withDate ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
    second: withDate ? "2-digit" : undefined,
  });
}

export default function SoilSensorPage() {
  const { user, isGuest } = useAuth();
  const [data, setData] = useState<SoilPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastGuestTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await apiFetch(
          `/api/soil/readings${user?.id ? `?user_id=${encodeURIComponent(user.id)}` : ""}`
        );
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
  }, [user?.id]);

  useEffect(() => {
    if (!isGuest || !data?.timestamp || !data?.arm_active) return;
    if (lastGuestTimestampRef.current === data.timestamp) return;
    lastGuestTimestampRef.current = data.timestamp;

    pushGuestHistory({
      mode: "humidity",
      moisture: data.moisture,
      temperature: data.temperature,
      humidity: data.humidity,
      ph: data.ph,
      obstacle: data.obstacle,
      timestamp: new Date(data.timestamp).getTime(),
    });
  }, [data?.timestamp, data?.arm_active, data?.moisture, data?.temperature, data?.humidity, data?.ph, data?.obstacle, isGuest]);

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
    () => {
      if (isGuest) {
        return getGuestHistory()
          .filter((item: any) => ["moisture", "temperature", "humidity"].includes(item.mode))
          .slice(-10)
          .map((row: any) => ({
            time:
              typeof row.timestamp === "number"
                ? formatIst(new Date(row.timestamp).toISOString())
                : formatIst(row.timestamp),
            moisture: row.moisture,
            temperature: row.temperature,
            humidity: row.humidity,
            ph: row.ph,
          }));
      }

      return (data?.history || []).map((row) => ({
        time: formatIst(row.timestamp),
        moisture: row.moisture,
        temperature: row.temperature,
        humidity: row.humidity,
        ph: row.ph,
      }));
    },
    [data, isGuest]
  );

  return (
    <div className="min-h-full bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Soil Sensor Readings
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              This page shows only the verified readings taken while the sensor arm is down and
              touching the soil. When the arm is up, the last accepted reading stays visible.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm dark:border-emerald-500/20 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {data?.arm_active
                  ? "Sensor arm is down"
                  : data?.connected
                    ? "Waiting for arm-down reading"
                    : "Waiting for ESP32 stream"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formatIst(data?.timestamp, true)}
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

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Verified Sensor Trend Chart
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              The last 10 accepted arm-down readings are plotted here with an auto-scaled range so
              even smaller changes stay visible on mobile and desktop.
            </p>
          </div>

          <Graph
            data={chartData}
            xKey="time"
            showYAxis
            height={420}
            series={[
              { key: "moisture", label: "Moisture", color: "#2563eb" },
              { key: "temperature", label: "Temperature", color: "#f97316" },
              { key: "humidity", label: "Humidity", color: "#10b981" },
              { key: "ph", label: "pH", color: "#8b5cf6" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
