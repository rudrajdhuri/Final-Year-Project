"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { useAuth, getGuestHistory } from "./AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://10.42.0.1:5000";
console.log("Using API:", API);

function parseAnimalCard(item: any) {
  const msg: string = item.message || "";
  let statusLabel = "", statusColor = "", borderColor = "", headerBg = "", badgeBg = "", typeDisplay = "";

  if (msg.includes("✅ Threat") && msg.includes("Animal:")) {
    statusLabel = "⚠️ Threat Detected"; statusColor = "text-red-500 dark:text-red-400"; borderColor = "border-red-400 dark:border-red-600"; headerBg = "bg-red-50 dark:bg-red-900/30"; badgeBg = "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"; typeDisplay = item.animal_type || "Unknown Animal";
  } else if (msg.includes("Plant image given")) {
    statusLabel = "🌿 Plant Detected"; statusColor = "text-emerald-600 dark:text-emerald-400"; borderColor = "border-emerald-400 dark:border-emerald-600"; headerBg = "bg-emerald-50 dark:bg-emerald-900/20"; badgeBg = "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"; typeDisplay = "Plant (Not a Threat)";
  } else if (msg.includes("Human detected")) {
    statusLabel = "👤 Human Detected"; statusColor = "text-purple-600 dark:text-purple-400"; borderColor = "border-purple-300 dark:border-purple-600"; headerBg = "bg-purple-50 dark:bg-purple-900/20"; badgeBg = "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"; typeDisplay = "Human (Not an Animal)";
  } else if (msg.includes("Not an animal")) {
    statusLabel = "✅ Not an Animal"; statusColor = "text-slate-500 dark:text-slate-400"; borderColor = "border-slate-300 dark:border-slate-600"; headerBg = "bg-slate-50 dark:bg-slate-800/60"; badgeBg = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"; typeDisplay = "Not an Animal";
  } else if (msg.includes("very unclear") || msg.includes("species ambiguous") || msg.includes("Uncertain")) {
    statusLabel = "⚠️ Unclear Image"; statusColor = "text-amber-600 dark:text-amber-400"; borderColor = "border-amber-400 dark:border-amber-600"; headerBg = "bg-amber-50 dark:bg-amber-900/20"; badgeBg = "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"; typeDisplay = "Unclear Image";
  } else if (item.threat_detected) {
    statusLabel = "⚠️ Threat Detected"; statusColor = "text-red-500 dark:text-red-400"; borderColor = "border-red-400 dark:border-red-600"; headerBg = "bg-red-50 dark:bg-red-900/30"; badgeBg = "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"; typeDisplay = item.animal_type || "Unknown Animal";
  } else {
    statusLabel = "✅ All Clear"; statusColor = "text-emerald-600 dark:text-emerald-400"; borderColor = "border-emerald-400 dark:border-emerald-600"; headerBg = "bg-emerald-50 dark:bg-emerald-900/20"; badgeBg = "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"; typeDisplay = item.animal_type !== "Unknown" ? item.animal_type : "No Animal";
  }
  return { statusLabel, statusColor, borderColor, headerBg, badgeBg, typeDisplay };
}

function parsePlantCard(item: any) {
  const result: string = item.result || item.message || "";
  let statusLabel = "", statusColor = "", borderColor = "", headerBg = "", badgeBg = "", typeDisplay = "";

  if (result.includes("Animal image given")) {
    statusLabel = "⚠️ Animal Detected"; statusColor = "text-red-500 dark:text-red-400"; borderColor = "border-red-400 dark:border-red-600"; headerBg = "bg-red-50 dark:bg-red-900/30"; badgeBg = "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"; typeDisplay = "Animal (Threat)";
  } else if (result.includes("UNHEALTHY") || result.includes("Threat Detected")) {
    statusLabel = "🌿 Unhealthy Plant"; statusColor = "text-orange-600 dark:text-orange-400"; borderColor = "border-orange-400 dark:border-orange-600"; headerBg = "bg-orange-50 dark:bg-orange-900/20"; badgeBg = "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"; typeDisplay = "Plant — Unhealthy";
  } else if (result.includes("HEALTHY") || result.includes("No Threat Detected")) {
    statusLabel = "🌿 Healthy Plant"; statusColor = "text-emerald-600 dark:text-emerald-400"; borderColor = "border-emerald-400 dark:border-emerald-600"; headerBg = "bg-emerald-50 dark:bg-emerald-900/20"; badgeBg = "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"; typeDisplay = "Plant — Healthy";
  } else if (result.includes("Human detected")) {
    statusLabel = "👤 Human Detected"; statusColor = "text-purple-600 dark:text-purple-400"; borderColor = "border-purple-300 dark:border-purple-600"; headerBg = "bg-purple-50 dark:bg-purple-900/20"; badgeBg = "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"; typeDisplay = "Human (Not a Plant)";
  } else if (result.includes("Not a plant")) {
    statusLabel = "❌ Not a Plant"; statusColor = "text-slate-500 dark:text-slate-400"; borderColor = "border-slate-300 dark:border-slate-600"; headerBg = "bg-slate-50 dark:bg-slate-800/60"; badgeBg = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"; typeDisplay = "Not a Plant";
  } else if (result.includes("UNCLEAR") || result.includes("Unclear")) {
    statusLabel = "⚠️ Unclear Image"; statusColor = "text-amber-600 dark:text-amber-400"; borderColor = "border-amber-400 dark:border-amber-600"; headerBg = "bg-amber-50 dark:bg-amber-900/20"; badgeBg = "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"; typeDisplay = "Unclear Image";
  } else {
    statusLabel = "🌿 Plant Detection"; statusColor = "text-emerald-600 dark:text-emerald-400"; borderColor = "border-emerald-400 dark:border-emerald-600"; headerBg = "bg-emerald-50 dark:bg-emerald-900/20"; badgeBg = "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"; typeDisplay = result || "Unknown";
  }
  return { statusLabel, statusColor, borderColor, headerBg, badgeBg, typeDisplay };
}

function formatTime(ts: string | number) {
  if (!ts) return "No date";
  try {
    // Handle both ISO string (MongoDB) and Unix timestamp (guest sessionStorage)
    const date = typeof ts === "number"
      ? new Date(ts)
      : new Date(String(ts).endsWith("Z") ? ts : ts + "Z");
    return date.toLocaleString();
  } catch { return String(ts); }
}

export default function HistoryContent() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [type, setType] = useState<"animal" | "plant">("animal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading before fetching
    if (authLoading) return;

    setLoading(true);
    setRecords([]);

    if (isGuest) {
      // ── Guest: read from sessionStorage ──
      const guestRecs = getGuestHistory()
        .filter((r: any) => r.mode === type)
        .reverse();
      setRecords(guestRecs);
      setLoading(false);
      return;
    }

    // ── Logged in: fetch from MongoDB filtered by user_id ──
    const url = type === "animal"
      ? `${API}/api/animal/history?user_id=${user!.id}`
      : `${API}/api/plant/history?user_id=${user!.id}`;

    fetch(url)
      .then(res => res.json())
      .then(data => { if (data.success) setRecords(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

  }, [type, user, isGuest, authLoading]);

  const isCamCapture = (item: any, mode: "animal" | "plant") => {
    if (item.filename?.startsWith("apicam") || item.filename?.startsWith("ppicam") || item.filename?.startsWith("autocam")) return true;
    // Guest records from camera have no filename but have imageMode
    return false;
  };

  const renderCard = (item: any, mode: "animal" | "plant") => {
    const parsed = mode === "animal" ? parseAnimalCard(item) : parsePlantCard(item);
    const { statusLabel, statusColor, borderColor, headerBg, badgeBg, typeDisplay } = parsed;
    const confidence = item.confidence ?? 0;
    const timestamp  = item.timestamp;
    // Image: use base64 if available, else URL
    const imageUrl   = item.image_b64 || null;
    const camCapture = isCamCapture(item, mode);

    return (
      <div key={item._id || item.timestamp} className={`rounded-xl border ${borderColor} overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200`}>
        {/* Header */}
        <div className={`${headerBg} px-4 py-3 flex items-center justify-between border-b ${borderColor}`}>
          <span className={`font-semibold text-sm ${statusColor}`}>{statusLabel}</span>
          <div className="flex items-center gap-2">
            {camCapture && (
              <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                <Camera className="w-3 h-3" />
                <span className="text-xs font-medium">Camera</span>
              </div>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(timestamp)}</span>
          </div>
        </div>
        {/* Body */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 shrink-0">Type</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeBg}`}>{typeDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 shrink-0">Confidence</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{confidence > 0 ? `${confidence}%` : "—"}</span>
          </div>
        </div>
        {/* Image */}
        {imageUrl && (
          <img src={imageUrl} className="w-full h-40 object-cover" alt="detection" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12 transition-colors duration-200">

      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detection History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isGuest ? "Guest session — history clears on refresh" : `Showing history for ${user?.name}`}
        </p>
      </div>

      <div className="px-6 mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
          <button onClick={() => setType("animal")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${type === "animal" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
            🐾 Animal History
          </button>
          <button onClick={() => setType("plant")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${type === "plant" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
            🌿 Plant History
          </button>
        </div>
      </div>

      {loading && (
        <div className="px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 animate-pulse">
              <div className="h-12 bg-gray-100 dark:bg-gray-800" />
              <div className="px-4 py-3 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
              <div className="h-40 bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      )}

      {!loading && records.length === 0 && (
        <div className="px-6 flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <p className="text-4xl mb-3">{type === "animal" ? "🐾" : "🌿"}</p>
          <p className="text-sm font-medium">No {type} detection history yet</p>
          {isGuest && <p className="text-xs mt-1 text-gray-400">Sign in to keep history permanently</p>}
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map(item => renderCard(item, type))}
        </div>
      )}

    </div>
  );
}