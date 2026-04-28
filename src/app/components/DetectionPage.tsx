"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Flower2,
  Loader2,
  RefreshCcw,
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

type AutonomousEnvelope = {
  success: boolean;
  status: {
    running: boolean;
    profile_name: string | null;
  };
};

function formatRemaining(seconds: number) {
  const safe = Math.max(0, seconds || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatIst(value?: string | null) {
  if (!value) return "Waiting for live result";
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

function ResultCard({ result, mode }: { result: any; mode: Mode }) {
  const text = result?.message || result?.result || result?.error || "";
  const isAnimalThreat = mode === "animal" && result?.threat_detected;
  const isPlantThreat = mode === "plant" && String(text).toLowerCase().includes("unhealthy");
  const isError = result?.success === false;

  const theme = isError
    ? {
        border: "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-950/20",
        icon: "text-red-500",
        title: "Detection error",
      }
    : isAnimalThreat || isPlantThreat
      ? {
          border:
            mode === "animal"
              ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-950/20"
              : "border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-950/20",
          icon: mode === "animal" ? "text-red-500" : "text-orange-500",
          title: mode === "animal" ? "Animal threat detected" : "Plant disease detected",
        }
      : {
          border: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-950/20",
          icon: "text-emerald-500",
          title: mode === "animal" ? "No animal threat found" : "Healthy plant result",
        };

  const Icon = isError || isAnimalThreat || isPlantThreat ? AlertTriangle : CheckCircle2;

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${theme.border}`}>
      <div className="flex items-start gap-4">
        <Icon className={`mt-1 h-6 w-6 shrink-0 ${theme.icon}`} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{theme.title}</h3>
          <p className="mt-2 text-sm leading-7 text-gray-700 dark:text-gray-300 sm:text-base">{text}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/80">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Confidence
              </p>
              <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                {typeof result?.confidence === "number" ? `${result.confidence}%` : "Not available"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/80">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Recorded
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {formatIst(result?.timestamp)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/80">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Source
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {result?.filename ? "Pi camera" : "Uploaded image"}
              </p>
            </div>
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
  autonomousRunning,
  autonomousProfileName,
}: {
  mode: Mode;
  statuses: AllStatuses | null;
  streamUrl: string | null;
  autonomousRunning: boolean;
  autonomousProfileName: string | null;
}) {
  const { user, isGuest } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pushedDetectionsRef = useRef<Record<string, string | null>>({ animal: null, plant: null });

  const status = statuses?.[mode] || null;
  const currentLiveResult = status?.last_detection || status?.last_result || null;

  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [manualResult, setManualResult] = useState<any>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [detectBusy, setDetectBusy] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);

  useEffect(() => {
    const latestDetectionId = status?.last_detection?.record_id || null;
    if (!isGuest || !latestDetectionId || pushedDetectionsRef.current[mode] === latestDetectionId) return;

    pushedDetectionsRef.current[mode] = latestDetectionId;
    pushGuestHistory({
      ...(status?.last_detection || {}),
      mode,
      timestamp: Date.now(),
      image_b64: status?.last_detection?.image_b64 || "",
    });
  }, [isGuest, mode, status]);

  const controlsLocked = captureBusy || detectBusy || sessionBusy;
  const liveSessionRunning = Boolean(status?.running);
  const showAutonomousOnly = autonomousRunning;
  const showManualStopOnly = liveSessionRunning && !showAutonomousOnly;
  const showIdleControls = !liveSessionRunning && !showAutonomousOnly;
  const bigBoxImage = uploadImage || previewImage;
  const title = mode === "animal" ? "Animal Detection" : "Plant Disease Detection";

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setUploadImage(dataUrl);
      setPreviewImage(dataUrl);
      setManualResult(null);
      void detectUploadedImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const detectUploadedImage = async (imageBase64: string) => {
    setDetectBusy(true);
    setManualResult(null);

    try {
      const endpoint = mode === "animal" ? "/api/animal/detect-animal" : "/api/plant/detect-plant";
      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: imageBase64, user_id: user?.id || "guest" }),
      });
      const payload = await response.json();
      setManualResult(payload);
      if (isGuest && payload.success) {
        pushGuestHistory({ ...payload, mode, timestamp: Date.now(), image_b64: payload.image_b64 || imageBase64 });
      }
    } catch {
      setManualResult({ success: false, error: "Detection request failed." });
    } finally {
      setDetectBusy(false);
    }
  };

  const captureOnce = async () => {
    setCaptureBusy(true);
    setManualResult(null);

    try {
      const endpoint = mode === "animal" ? "/api/animal/capture-camera" : "/api/plant/capture-camera";
      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id || "guest" }),
      });
      const payload = await response.json();
      setManualResult(payload);
      if (payload.success) {
        const imageUrl =
          payload.image_b64 ||
          (await getApiUrl(`/api/${mode}/image/${payload.filename}?t=${Date.now()}`));
        setPreviewImage(imageUrl);
        if (isGuest) {
          pushGuestHistory({ ...payload, mode, timestamp: Date.now(), image_b64: payload.image_b64 || "" });
        }
      }
    } catch {
      setManualResult({ success: false, error: "Bot camera capture failed." });
    } finally {
      setCaptureBusy(false);
    }
  };

  const startLiveDetection = async () => {
    setSessionBusy(true);
    try {
      await apiFetch(`/api/auto/start/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id || "guest" }),
      });
      setManualResult(null);
      setPreviewImage(null);
    } finally {
      setSessionBusy(false);
    }
  };

  const stopLiveDetection = async () => {
    setSessionBusy(true);
    try {
      await apiFetch(`/api/auto/stop/${mode}`, { method: "POST" });
    } finally {
      setSessionBusy(false);
    }
  };

  const resetState = () => {
    setUploadImage(null);
    setPreviewImage(null);
    setManualResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Upload a photo, capture one frame from the Pi camera, or start the shared live
              detection stream. The frontend can show the full live feed while the model checks every
              3rd frame in the backend.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {showAutonomousOnly ? (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-600 dark:bg-red-500/10 dark:text-red-400">
                Autonomous mode active
              </span>
            ) : liveSessionRunning ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                Live detection running
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                Manual mode ready
              </span>
            )}
          </div>
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

        <div
          onClick={() => {
            if (showIdleControls) fileInputRef.current?.click();
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (!showIdleControls) return;
            const file = event.dataTransfer.files?.[0];
            if (file?.type.startsWith("image/")) handleFile(file);
          }}
          onDragOver={(event) => event.preventDefault()}
          className={`overflow-hidden rounded-3xl border-2 border-dashed transition ${
            showIdleControls
              ? "cursor-pointer border-gray-300 bg-gray-50 hover:border-emerald-400 dark:border-gray-700 dark:bg-gray-950/40 dark:hover:border-emerald-500/40"
              : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950/40"
          }`}
        >
          {showAutonomousOnly && statuses?.stream_active && streamUrl ? (
            <img src={streamUrl} alt="Shared autonomous live stream" className="aspect-video w-full object-cover" />
          ) : liveSessionRunning && statuses?.stream_active && streamUrl ? (
            <img src={streamUrl} alt="Manual live detection stream" className="aspect-video w-full object-cover" />
          ) : bigBoxImage ? (
            <img src={bigBoxImage} alt="Selected detection preview" className="aspect-video w-full object-contain bg-black/90" />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center px-6 text-center">
              <Upload className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Click here to upload an image
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                Uploaded images are checked automatically. You can also use the Pi camera capture button or start live detection below.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {showIdleControls ? (
            <>
              <button
                onClick={captureOnce}
                disabled={controlsLocked}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {captureBusy || detectBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {captureBusy ? "Capturing..." : "Capture from Pi Cam"}
              </button>

              <button
                onClick={startLiveDetection}
                disabled={controlsLocked}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {sessionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Start Live Detection
              </button>

              <button
                onClick={resetState}
                disabled={controlsLocked}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
            </>
          ) : showManualStopOnly ? (
            <button
              onClick={stopLiveDetection}
              disabled={sessionBusy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {sessionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Stop Detection
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Remaining</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatRemaining(status?.remaining_seconds || 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Saved detections</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {status?.detection_count || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Mode</p>
            <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
              {showAutonomousOnly
                ? `Shared with autonomous profile ${autonomousProfileName || ""}`.trim()
                : liveSessionRunning
                  ? "Manual live detection"
                  : "Single capture or upload"}
            </p>
          </div>
        </div>
      </div>

      {(manualResult || currentLiveResult) && (
        <ResultCard result={manualResult || currentLiveResult} mode={mode} />
      )}
    </div>
  );
}

export default function DetectionPage() {
  const [tab, setTab] = useState<Mode>("animal");
  const [statuses, setStatuses] = useState<AllStatuses | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [autonomous, setAutonomous] = useState<AutonomousEnvelope["status"] | null>(null);

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

    const load = async () => {
      try {
        const [statusResponse, autonomousResponse] = await Promise.all([
          apiFetch("/api/auto/status"),
          apiFetch("/api/bots/autonomous/status"),
        ]);

        const statusPayload = await statusResponse.json();
        const autonomousPayload = await autonomousResponse.json();
        if (!active) return;

        setStatuses(statusPayload);
        setAutonomous(autonomousPayload?.status || null);
      } catch {
        if (!active) return;
      }
    };

    void load();
    const timer = window.setInterval(load, 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const activeStatus = statuses?.[tab];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              AI Threat Detection
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Manual capture, manual live detection, and shared autonomous live monitoring from the
              Pi camera.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm dark:border-emerald-500/20 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              {tab === "animal" ? <AlertTriangle className="h-4 w-4" /> : <Flower2 className="h-4 w-4" />}
              <span className="text-sm font-semibold">
                {autonomous?.running
                  ? "Autonomous detection is in control"
                  : activeStatus?.running
                    ? "Manual live detection is active"
                    : "Detection controls are ready"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Inference checks every {activeStatus?.frame_skip || 3}rd frame while the live stream stays continuous.
            </p>
          </div>
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

        <DetectionTab
          mode={tab}
          statuses={statuses}
          streamUrl={streamUrl}
          autonomousRunning={Boolean(autonomous?.running)}
          autonomousProfileName={autonomous?.profile_name || null}
        />
      </div>
    </div>
  );
}
