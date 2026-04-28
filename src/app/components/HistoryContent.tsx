"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, Droplets, Leaf, Thermometer, Waves } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { getGuestHistory, useAuth } from "./AuthContext";

type HistoryTab = "animal" | "plant" | "moisture" | "temperature" | "humidity";

type DetectionItem = Record<string, any>;

type SensorItem = {
  id: string;
  moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  ph: number | null;
  obstacle: boolean;
  timestamp?: string | null;
};

const tabs: Array<{
  key: HistoryTab;
  label: string;
  icon: any;
}> = [
  { key: "animal", label: "Animal History", icon: AlertTriangle },
  { key: "plant", label: "Plant History", icon: Leaf },
  { key: "moisture", label: "Moisture History", icon: Droplets },
  { key: "temperature", label: "Temperature History", icon: Thermometer },
  { key: "humidity", label: "Humidity History", icon: Waves },
];

function formatIst(value?: string | number | null) {
  if (!value) return "No time available";
  const parsed = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
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

function isThresholdCrossed(item: SensorItem, tab: HistoryTab) {
  if (tab === "moisture") return typeof item.moisture === "number" && item.moisture <= 30;
  if (tab === "temperature") {
    return (
      typeof item.temperature === "number" && (item.temperature >= 35 || item.temperature <= 12)
    );
  }
  return false;
}

function DetectionCard({ item, tab }: { item: DetectionItem; tab: "animal" | "plant" }) {
  const isAnimal = tab === "animal";
  const imageUrl = item.image_b64 || null;
  const headline = isAnimal
    ? item.threat_detected
      ? "Animal threat detected"
      : "Animal check completed"
    : String(item.result || item.message || "").toLowerCase().includes("unhealthy")
      ? "Plant disease detected"
      : "Plant check completed";

  const tone = isAnimal
    ? item.threat_detected
      ? "border-red-200 bg-red-50/80 dark:border-red-500/20 dark:bg-red-950/20"
      : "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-950/20"
    : String(item.result || item.message || "").toLowerCase().includes("unhealthy")
      ? "border-orange-200 bg-orange-50/80 dark:border-orange-500/20 dark:bg-orange-950/20"
      : "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-950/20";

  return (
    <div className={`overflow-hidden rounded-3xl border ${tone}`}>
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{headline}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatIst(item.timestamp)}</p>
          </div>
          {item.filename && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <Camera className="h-3.5 w-3.5" />
              Camera
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/80">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Result
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-gray-800 dark:text-gray-100">
              {isAnimal
                ? item.message || item.animal_type || "No animal result"
                : item.result || item.message || "No plant result"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/80">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Confidence
            </p>
            <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
              {typeof item.confidence === "number" ? `${item.confidence}%` : "Not available"}
            </p>
          </div>
        </div>
      </div>

      {imageUrl ? (
        <img src={imageUrl} alt="Detection frame" className="h-52 w-full object-cover" />
      ) : null}
    </div>
  );
}

function SensorCard({ item, tab }: { item: SensorItem; tab: HistoryTab }) {
  const crossed = isThresholdCrossed(item, tab);
  const title =
    tab === "moisture"
      ? "Soil moisture reading"
      : tab === "temperature"
        ? "Temperature reading"
        : "Humidity reading";

  const value =
    tab === "moisture"
      ? `${item.moisture ?? "N/A"}%`
      : tab === "temperature"
        ? `${item.temperature ?? "N/A"}°C`
        : `${item.humidity ?? "N/A"}%`;

  const message =
    tab === "moisture"
      ? crossed
        ? "This reading shows the soil may need watering."
        : "This reading stayed within the normal moisture range."
      : tab === "temperature"
        ? crossed
          ? "This reading crossed the general crop comfort range."
          : "This reading stayed within the usual crop range."
        : "This is one of the last accepted humidity readings.";

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm transition-colors ${
        crossed
          ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-950/20"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatIst(item.timestamp)}</p>
        </div>
        {crossed ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            Threshold crossed
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-950/60">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            Value
          </p>
          <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-950/60">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            Meaning
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-gray-800 dark:text-gray-100">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HistoryContent() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<HistoryTab>("animal");
  const [detectionRecords, setDetectionRecords] = useState<Record<"animal" | "plant", DetectionItem[]>>({
    animal: [],
    plant: [],
  });
  const [sensorRecords, setSensorRecords] = useState<SensorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        if (isGuest) {
          const guestHistory = getGuestHistory();
          if (!active) return;
          setDetectionRecords({
            animal: guestHistory.filter((item: any) => item.mode === "animal").reverse(),
            plant: guestHistory.filter((item: any) => item.mode === "plant").reverse(),
          });
        } else {
          const [animalRes, plantRes] = await Promise.all([
            apiFetch(`/api/animal/history?user_id=${user!.id}`),
            apiFetch(`/api/plant/history?user_id=${user!.id}`),
          ]);
          const [animalJson, plantJson] = await Promise.all([animalRes.json(), plantRes.json()]);
          if (!active) return;
          setDetectionRecords({
            animal: animalJson.success ? animalJson.data : [],
            plant: plantJson.success ? plantJson.data : [],
          });
        }

        const soilRes = await apiFetch("/api/soil/history");
        const soilJson = await soilRes.json();
        if (!active) return;
        setSensorRecords(soilJson.success ? soilJson.data : []);
      } catch {
        if (!active) return;
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
  }, [authLoading, isGuest, user]);

  const currentItems = useMemo(() => {
    if (tab === "animal" || tab === "plant") {
      return detectionRecords[tab];
    }
    return sensorRecords;
  }, [detectionRecords, sensorRecords, tab]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12 transition-colors duration-200 dark:bg-gray-950">
      <div className="px-6 pb-4 pt-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">History</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          Review saved animal, plant, and accepted sensor readings from your offline Agri Bot system.
        </p>
      </div>

      <div className="px-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-300"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-emerald-500/20 dark:hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold sm:text-base">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pt-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              />
            ))}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            No saved records are available for this history section yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tab === "animal" || tab === "plant"
              ? (currentItems as DetectionItem[]).map((item) => (
                  <DetectionCard
                    key={item._id || item.record_id || item.filename || `${tab}-${item.timestamp || "row"}`}
                    item={item}
                    tab={tab}
                  />
                ))
              : (currentItems as SensorItem[]).map((item) => (
                  <SensorCard key={item.id} item={item} tab={tab} />
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
