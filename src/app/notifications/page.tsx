"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { getGuestHistory, useAuth } from "../components/AuthContext";

type NotificationItem = {
  id: string;
  type: "warning" | "success" | "info";
  title: string;
  message: string;
  source: string;
  timestamp?: string | null;
};

function formatTime(value?: string | null) {
  if (!value) return "Waiting for live data";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function NotificationsPage() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let active = true;

    const buildGuestNotifications = (): NotificationItem[] => {
      const guestHistory = getGuestHistory();
      const notifications: NotificationItem[] = [];

      guestHistory
        .filter((item: any) => item.mode === "animal" || item.mode === "plant")
        .slice(-8)
        .reverse()
        .forEach((item: any, index: number) => {
          const isAnimal = item.mode === "animal";
          const message = String(item.message || item.result || "");
          const isAnimalThreat = Boolean(item.threat_detected) || message.includes("Threat");
          const isPlantDisease = message.toLowerCase().includes("unhealthy") || message.toLowerCase().includes("threat");
          if ((isAnimal && !isAnimalThreat) || (!isAnimal && !isPlantDisease)) return;

          notifications.push({
            id: `guest-${item.mode}-${item.timestamp || index}`,
            type: "warning",
            title: isAnimal ? "Animal Threat Detected" : "Plant Disease Detected",
            message: isAnimal
              ? item.message || `Threat detected: ${item.animal_type || "Unknown animal"}`
              : item.result || item.message || "Plant disease detected",
            source: isAnimal ? "animal_detection" : "plant_detection",
            timestamp:
              typeof item.timestamp === "number"
                ? new Date(item.timestamp).toISOString()
                : item.timestamp || null,
          });
        });

      guestHistory
        .filter((item: any) => ["moisture", "temperature", "humidity"].includes(item.mode))
        .slice(-8)
        .reverse()
        .forEach((item: any, index: number) => {
          const timestamp =
            typeof item.timestamp === "number"
              ? new Date(item.timestamp).toISOString()
              : item.timestamp || null;

          if (typeof item.moisture === "number" && item.moisture <= 30) {
            notifications.push({
              id: `guest-soil-${item.timestamp || index}`,
              type: "warning",
              title: "Soil Looks Dry",
              message: `Soil moisture is low at ${item.moisture}%. This area may need watering soon.`,
              source: "soil",
              timestamp,
            });
          }

          if (typeof item.temperature === "number" && item.temperature >= 35) {
            notifications.push({
              id: `guest-temp-high-${item.timestamp || index}`,
              type: "info",
              title: "Temperature is on the High Side",
              message: `The crop area is warm at ${item.temperature} degrees Celsius. Keep an eye on heat stress for common kharif and rabi crops.`,
              source: "temperature",
              timestamp,
            });
          } else if (typeof item.temperature === "number" && item.temperature <= 12) {
            notifications.push({
              id: `guest-temp-low-${item.timestamp || index}`,
              type: "info",
              title: "Temperature is on the Low Side",
              message: `The crop area is cool at ${item.temperature} degrees Celsius. Sensitive crops may need attention in this weather.`,
              source: "temperature",
              timestamp,
            });
          }

          if (item.obstacle) {
            notifications.push({
              id: `guest-obstacle-${item.timestamp || index}`,
              type: "warning",
              title: "Obstacle Was Detected",
              message: "The bot reported an obstacle during a recorded reading session.",
              source: "ultrasonic",
              timestamp,
            });
          }
        });

      if (notifications.length === 0 && guestHistory.length > 0) {
        const last = guestHistory[guestHistory.length - 1];
        notifications.push({
          id: "guest-stable",
          type: "success",
          title: "Farm Readings Look Normal",
          message: "No urgent issue is being reported from your latest saved bot readings.",
          source: "system",
          timestamp:
            typeof last?.timestamp === "number"
              ? new Date(last.timestamp).toISOString()
              : last?.timestamp || null,
        });
      }

      return notifications;
    };

    const load = async () => {
      try {
        if (!active) return;

        if (isGuest) {
          const merged = buildGuestNotifications();
          merged.sort((a: NotificationItem, b: NotificationItem) =>
            String(b.timestamp || "").localeCompare(String(a.timestamp || ""))
          );
          setItems(merged);
          setError(null);
          return;
        }

        const query = user?.id ? `?user_id=${encodeURIComponent(user.id)}` : "";
        const response = await apiFetch(`/api/system/notifications${query}`);
        if (!response.ok) throw new Error("Notifications could not be loaded");

        const payload = await response.json();
        if (!active) return;
        const backendItems = Array.isArray(payload?.data) ? payload.data : [];
        const merged: NotificationItem[] = backendItems;
        merged.sort((a: NotificationItem, b: NotificationItem) =>
          String(b.timestamp || "").localeCompare(String(a.timestamp || ""))
        );
        setItems(merged);
        setError(null);
      } catch (err: any) {
        if (!active) return;
        setError(err.message || "Unable to load notifications");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [authLoading, isGuest, user]);

  const summary = useMemo(() => {
    const warnings = items.filter((item) => item.type === "warning").length;
    return { total: items.length, warnings, stable: items.length - warnings };
  }, [items]);

  return (
    <div className="min-h-full bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Bell className="h-7 w-7 text-gray-700 dark:text-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Threat Notifications
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Live sensor alerts plus AI threat history from your local offline backend.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
                Total
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-center shadow-sm dark:border-red-500/20 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500 dark:text-red-400">
                Threats
              </p>
              <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.warnings}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center shadow-sm dark:border-emerald-500/20 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-500 dark:text-emerald-400">
                Stable
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {summary.stable}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {loading &&
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="h-5 w-40 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="mt-4 h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />
                <div className="mt-2 h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}

          {!loading &&
            items.map((item) => {
              const isWarning = item.type === "warning";
              const isInfo = item.type === "info";
              const Icon =
                item.type === "success"
                  ? CheckCircle2
                  : item.type === "info"
                    ? Clock3
                    : AlertTriangle;

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl border bg-white p-5 shadow-sm transition-colors dark:bg-gray-900 sm:p-6 ${
                    isWarning
                      ? "border-red-200 dark:border-red-500/20"
                      : isInfo
                        ? "border-sky-200 dark:border-sky-500/20"
                        : "border-gray-200 dark:border-gray-800"
                  }`}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div
                      className={`rounded-2xl p-3 ${
                        isWarning
                          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                          : isInfo
                            ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                          {item.title}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            isWarning
                              ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                              : isInfo
                                ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          }`}
                        >
                          {item.source.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-400 sm:text-base">
                        {item.message}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <ShieldAlert className="h-4 w-4" />
                        <span>{formatTime(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
