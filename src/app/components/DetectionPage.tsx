"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Camera,
  CheckCircle,
  Flower2,
  HelpCircle,
  Loader2,
  Square,
  Upload,
} from "lucide-react";

import { pushGuestHistory, useAuth } from "./AuthContext";
import { apiFetch, getApiUrl } from "@/lib/api";

type Mode = "animal" | "plant";

type DetectionStatus = {
  mode: Mode;
  running: boolean;
  completed: boolean;
  started_at?: string | null;
  ends_at?: string | null;
  completed_at?: string | null;
  remaining_seconds: number;
  detection_count: number;
  last_result?: any;
  last_detection?: any;
  last_inference_at?: string | null;
  error?: string | null;
  stream_active: boolean;
  active_modes: string[];
  frame_skip: number;
  duration_seconds: number;
};

type AllStatuses = {
  animal: DetectionStatus;
  plant: DetectionStatus;
  stream_active: boolean;
};

function formatRemaining(seconds: number) {
  const safe = Math.max(0, seconds || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function ResultCard({ result, mode }: { result: any; mode: Mode }) {
  const msg = result?.message || result?.result || result?.error || "";
  let style = {
    wrap: "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20",
    title: "text-emerald-800 dark:text-emerald-300",
    body: "text-emerald-700 dark:text-emerald-400",
    icon: <CheckCircle className="h-7 w-7 shrink-0 text-emerald-500" />,
    label: mode === "animal" ? "All clear" : "Healthy plant",
  };

  if (result?.success === false) {
    style = {
      wrap: "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20",
      title: "text-amber-800 dark:text-amber-300",
      body: "text-amber-700 dark:text-amber-400",
      icon: <AlertTriangle className="h-7 w-7 shrink-0 text-amber-500" />,
      label: "Detection error",
    };
  } else if (mode === "animal") {
    if (result?.threat_detected) {
      style = {
        wrap: "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20",
        title: "text-red-800 dark:text-red-300",
        body: "text-red-700 dark:text-red-400",
        icon: <AlertTriangle className="h-7 w-7 shrink-0 text-red-500" />,
        label: "Animal threat detected",
      };
    } else if (msg.toLowerCase().includes("human")) {
      style = {
        wrap: "border-purple-300 bg-purple-50 dark:border-purple-600 dark:bg-purple-900/20",
        title: "text-purple-800 dark:text-purple-300",
        body: "text-purple-700 dark:text-purple-400",
        icon: <AlertTriangle className="h-7 w-7 shrink-0 text-purple-500" />,
        label: "Human detected",
      };
    } else if (msg.toLowerCase().includes("unclear")) {
      style = {
        wrap: "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20",
        title: "text-amber-800 dark:text-amber-300",
        body: "text-amber-700 dark:text-amber-400",
        icon: <HelpCircle className="h-7 w-7 shrink-0 text-amber-500" />,
        label: "Unclear frame",
      };
    }
  } else {
    if (msg.includes("UNHEALTHY")) {
      style = {
        wrap: "border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20",
        title: "text-orange-800 dark:text-orange-300",
        body: "text-orange-700 dark:text-orange-400",
        icon: <AlertTriangle className="h-7 w-7 shrink-0 text-orange-500" />,
        label: "Disease detected",
      };
    } else if (msg.toLowerCase().includes("animal image")) {
      style = {
        wrap: "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20",
        title: "text-red-800 dark:text-red-300",
        body: "text-red-700 dark:text-red-400",
        icon: <AlertTriangle className="h-7 w-7 shrink-0 text-red-500" />,
        label: "Animal image given",
      };
    } else if (msg.toLowerCase().includes("not a plant")) {
      style = {
        wrap: "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/60",
        title: "text-gray-700 dark:text-gray-300",
        body: "text-gray-600 dark:text-gray-400",
        icon: <HelpCircle className="h-7 w-7 shrink-0 text-gray-400" />,
        label: "Not a plant",
      };
    } else if (msg.toLowerCase().includes("unclear")) {
      style = {
        wrap: "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20",
        title: "text-amber-800 dark:text-amber-300",
        body: "text-amber-700 dark:text-amber-400",
        icon: <HelpCircle className="h-7 w-7 shrink-0 text-amber-500" />,
        label: "Unclear frame",
      };
    }
  }

  return (
    <div className={`rounded-3xl border-2 p-5 transition-colors duration-200 ${style.wrap}`}>
      <div className="flex items-start gap-4">
        {style.icon}
        <div className="min-w-0 flex-1">
          <p className={`mb-1 text-lg font-bold ${style.title}`}>{style.label}</p>
          <p className={`mb-3 text-sm leading-7 sm:text-base ${style.body}`}>{msg}</p>
          <div className="flex flex-wrap gap-3">
            {typeof result?.confidence === "number" && result.confidence > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{result.confidence}%</p>
              </div>
            )}
            {result?.animal_type && result.animal_type !== "Unknown" && (
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">Animal</p>
                <p className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                  {result.animal_type}
                </p>
              </div>
            )}
            {result?.timestamp && (
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">Recorded</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetectionTab({
  mode,
  statuses,
  streamUrl,
}: {
  mode: Mode;
  statuses: AllStatuses | null;
  streamUrl: string | null;
}) {
  const { user, isGuest } = useAuth();
  const status = statuses?.[mode] || null;
  const otherMode: Mode = mode === "animal" ? "plant" : "animal";
  const otherStatus = statuses?.[otherMode] || null;

  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [singleImage, setSingleImage] = useState<string | null>(null);
  const [manualResult, setManualResult] = useState<any>(null);
  const [detectBusy, setDetectBusy] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pushedDetectionsRef = useRef<Record<string, string | null>>({ animal: null, plant: null });

  useEffect(() => {
    const latestDetectionId = status?.last_detection?.record_id || null;
    if (!isGuest || !latestDetectionId || pushedDetectionsRef.current[mode] === latestDetectionId) {
      return;
    }

    pushedDetectionsRef.current[mode] = latestDetectionId;
    pushGuestHistory({
      ...(status?.last_detection || {}),
      mode,
      timestamp: Date.now(),
      image_b64: status?.last_detection?.image_b64 || "",
    });
  }, [isGuest, mode, status]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadImage(reader.result as string);
      setManualResult(null);
    };
    reader.readAsDataURL(file);
  };

  const detectUpload = async () => {
    if (!uploadImage) return;
    setDetectBusy(true);
    setManualResult(null);
    const endpoint = mode === "animal" ? "detect-animal" : "detect-plant";

    try {
      const response = await apiFetch(`/api/${mode}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: uploadImage, user_id: user?.id || "guest" }),
      });
      const payload = await response.json();
      setManualResult(payload);
      if (isGuest && payload.success) {
        pushGuestHistory({ ...payload, mode, timestamp: Date.now(), image_b64: payload.image_b64 || uploadImage });
      }
    } catch {
      setManualResult({ success: false, error: "Backend connection failed" });
    } finally {
      setDetectBusy(false);
    }
  };

  const captureOnce = async () => {
    setCaptureBusy(true);
    setSingleImage(null);
    setManualResult(null);

    try {
      const response = await apiFetch(`/api/${mode}/capture-camera`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id || "guest" }),
      });
      const payload = await response.json();
      setManualResult(payload);
      if (payload.success) {
        const imageUrl =
          payload.image_b64 || (await getApiUrl(`/api/${mode}/image/${payload.filename}?t=${Date.now()}`));
        setSingleImage(imageUrl);
        if (isGuest) {
          pushGuestHistory({ ...payload, mode, timestamp: Date.now(), image_b64: payload.image_b64 || "" });
        }
      }
    } catch {
      setManualResult({ success: false, error: "Bot camera capture failed" });
    } finally {
      setCaptureBusy(false);
    }
  };

  const startSession = async () => {
    setSessionBusy(true);
    try {
      await apiFetch(`/api/auto/start/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id || "guest" }),
      });
      setManualResult(null);
      setSingleImage(null);
    } finally {
      setSessionBusy(false);
    }
  };

  const stopSession = async () => {
    setSessionBusy(true);
    try {
      await apiFetch(`/api/auto/stop/${mode}`, { method: "POST" });
    } finally {
      setSessionBusy(false);
    }
  };

  const liveResult = status?.last_detection || status?.last_result || null;

  const modeTitle = mode === "animal" ? "Animal Detection" : "Plant Detection";
  const startLabel = mode === "animal" ? "Start Animal Detection" : "Start Plant Detection";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Live Pi Camera
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                Shared live camera stream for both models. Inference runs on every 5th frame.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {status?.running && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {modeTitle} running
                </span>
              )}
              {otherStatus?.running && (
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                  {otherMode} also running
                </span>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-950 dark:border-gray-700">
            {statuses?.stream_active && streamUrl ? (
              <img src={streamUrl} alt="Live Pi camera stream" className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-4 px-6 text-center">
                <Camera className="h-12 w-12 text-gray-500" />
                <div>
                  <p className="text-lg font-semibold text-white">Live stream is idle</p>
                  <p className="mt-2 text-sm text-gray-300 sm:text-base">
                    Start a detection session and the Pi camera feed will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/50">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                Remaining
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {formatRemaining(status?.remaining_seconds || 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/50">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                Saved Detections
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {status?.detection_count || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/50">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                Session Length
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round((status?.duration_seconds || 600) / 60)} min
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              {mode === "animal" ? (
                <Bot className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Flower2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                  {modeTitle} Session
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                  Continuous live monitoring for 10 minutes with reduced-power inference.
                </p>
              </div>
            </div>

            {!status?.running ? (
              <button
                onClick={startSession}
                disabled={sessionBusy}
                className="w-full rounded-2xl bg-emerald-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 disabled:opacity-60"
              >
                {sessionBusy ? "Starting..." : startLabel}
              </button>
            ) : (
              <button
                onClick={stopSession}
                disabled={sessionBusy}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-700 disabled:opacity-60"
              >
                <Square className="h-5 w-5" />
                {sessionBusy ? "Stopping..." : "Stop Detection"}
              </button>
            )}

            {status?.completed && !status?.running && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                Detection complete. The 10-minute session finished automatically.
              </div>
            )}

            {status?.error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {status.error}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm dark:border-sky-500/20 dark:bg-sky-950/20 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">
              Session Rules
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-sky-900 dark:text-sky-100/90 sm:text-base">
              <li>The camera stays live continuously while the session is running.</li>
              <li>The model checks every 5th frame to reduce Pi CPU load.</li>
              <li>Only relevant detections are saved to MongoDB and notifications.</li>
              <li>Animal and plant sessions can overlap and share the same Pi camera stream.</li>
            </ul>
          </div>
        </div>
      </div>

      {liveResult && <ResultCard result={liveResult} mode={mode} />}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Image Test</h3>
          </div>

          <div
            className={`flex min-h-52 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
              uploadImage
                ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30"
                : "cursor-pointer border-gray-300 bg-gray-50 hover:border-emerald-500 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:border-emerald-500"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file?.type.startsWith("image/")) handleFile(file);
            }}
            onDragOver={(event) => event.preventDefault()}
          >
            {uploadImage ? (
              <img src={uploadImage} alt="Uploaded preview" className="max-h-80 w-full object-contain" />
            ) : (
              <div className="px-4 text-center">
                <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:text-base">
                  Click to upload or drag and drop
                </p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">PNG or JPG image</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={detectUpload}
              disabled={!uploadImage || detectBusy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {detectBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              {detectBusy ? "Detecting..." : mode === "animal" ? "Detect Animal Threat" : "Detect Plant Disease"}
            </button>
            <button
              onClick={() => {
                setUploadImage(null);
                setManualResult(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Single Camera Capture</h3>
          </div>

          <div className="flex min-h-52 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30">
            {singleImage ? (
              <img src={singleImage} alt="Single Pi camera capture" className="max-h-80 w-full object-contain" />
            ) : (
              <div className="px-4 text-center">
                <Camera className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:text-base">
                  Capture one frame from the Pi camera
                </p>
              </div>
            )}
          </div>

          <button
            onClick={captureOnce}
            disabled={captureBusy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {captureBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {captureBusy ? "Capturing..." : "Capture from Pi Camera"}
          </button>
        </div>
      </div>

      {manualResult && <ResultCard result={manualResult} mode={mode} />}
    </div>
  );
}

export default function DetectionPage() {
  const [tab, setTab] = useState<Mode>("animal");
  const [statuses, setStatuses] = useState<AllStatuses | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getApiUrl("/api/auto/stream").then((url) => {
      if (active) setStreamUrl(url);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      try {
        const response = await apiFetch("/api/auto/status");
        const payload = await response.json();
        if (!active) return;
        setStatuses(payload);
      } catch {
        if (!active) return;
      }
    };

    loadStatus();
    const timer = window.setInterval(loadStatus, 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            AI Threat Detection
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Shared live Pi camera detection for animal threats and plant disease sessions.
          </p>
        </div>

        <div className="mb-6 inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setTab("animal")}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === "animal"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Animal Detection
          </button>
          <button
            onClick={() => setTab("plant")}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === "plant"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Plant Detection
          </button>
        </div>

        <DetectionTab mode={tab} statuses={statuses} streamUrl={streamUrl} />
      </div>
    </div>
  );
}
