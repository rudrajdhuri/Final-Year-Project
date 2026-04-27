"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cpu,
  Gauge,
  Gamepad2,
  Hand,
  Loader2,
  Navigation,
  PauseCircle,
  PlayCircle,
  Save,
  ShieldAlert,
  Square,
  Wifi,
  WifiOff,
} from "lucide-react";

import { apiFetch, resolveApiBase } from "@/lib/api";

const ESP32_HOST = "192.168.4.1";
const ESP32_WS_URL = `ws://${ESP32_HOST}/CarInput`;
const AUTONOMOUS_PWM = 205;

const COMMANDS = {
  F: "MoveCar,1",
  B: "MoveCar,2",
  L: "MoveCar,3",
  R: "MoveCar,4",
  S: "MoveCar,0",
  SERVO: "Servo,down",
} as const;

type CommandKey = keyof typeof COMMANDS;
type ToastType = "success" | "error" | "info";

type RecordingStatus = {
  active: boolean;
  started_at: string | null;
  last_direction: string | null;
  segment_count: number;
  total_duration_ms: number;
};

type Profile = {
  id: string;
  name: string;
  segment_count: number;
  total_duration_ms: number;
  breakpoints_ms: number[];
  speed_pwm: number;
  created_at: string | null;
};

type AutonomousStatus = {
  running: boolean;
  completed: boolean;
  profile_id: string | null;
  profile_name: string | null;
  started_at: string | null;
  completed_at: string | null;
  paused_reason: string | null;
  current_direction: string;
  current_segment_index: number;
  total_segments: number;
  progress_ms: number;
  total_duration_ms: number;
  progress_ratio: number;
  error: string | null;
  breaks_taken: number;
  speed_pwm: number;
  obstacle: boolean;
};

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDirection(direction: string) {
  switch (direction) {
    case "F":
      return "Forward";
    case "B":
      return "Backward";
    case "L":
      return "Left turn";
    case "R":
      return "Right turn";
    default:
      return "Stopped";
  }
}

function formatPauseReason(reason: string | null) {
  if (!reason) return "Running";
  if (reason === "servo_break") return "Servo sensing break";
  if (reason === "obstacle") return "Ultrasonic obstacle pause";
  if (reason === "stopped_by_user") return "Stopped by user";
  return reason.replaceAll("_", " ");
}

function Toast({ message, type }: { message: string; type: ToastType }) {
  const colors: Record<ToastType, string> = {
    success:
      "border-emerald-300 bg-white text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/90 dark:text-emerald-300",
    error:
      "border-red-300 bg-white text-red-700 dark:border-red-500/30 dark:bg-red-950/90 dark:text-red-300",
    info:
      "border-sky-300 bg-white text-sky-700 dark:border-sky-500/30 dark:bg-sky-950/90 dark:text-sky-300",
  };

  return (
    <div
      className={`fixed right-4 top-4 z-50 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${colors[type]}`}
    >
      {message}
    </div>
  );
}

function DirectionButton({
  cmd,
  enabled,
  active,
  onCommand,
  children,
}: {
  cmd: CommandKey;
  enabled: boolean;
  active?: boolean;
  onCommand: (command: CommandKey) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={!enabled}
      onPointerDown={() => onCommand(cmd)}
      onPointerUp={() => onCommand("S")}
      onPointerLeave={() => onCommand("S")}
      onPointerCancel={() => onCommand("S")}
      className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl border text-gray-700 transition-all active:scale-95 dark:text-gray-100 ${
        !enabled
          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
          : active
            ? "border-emerald-400 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
            : "border-gray-200 bg-white shadow-sm hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-emerald-500/40 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function TouchJoystick({
  enabled,
  activeCommand = "S",
  onCommand,
}: {
  enabled: boolean;
  activeCommand?: CommandKey;
  onCommand: (command: CommandKey) => void;
}) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<CommandKey>("S");

  const setVisual = useCallback((x: number, y: number) => {
    if (!knobRef.current) return;
    knobRef.current.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVisual(0, 0);
      return;
    }

    const offsets: Record<string, [number, number]> = {
      F: [0, -36],
      B: [0, 36],
      L: [-36, 0],
      R: [36, 0],
      S: [0, 0],
    };
    const [x, y] = offsets[activeCommand] ?? offsets.S;
    setVisual(x, y);
  }, [activeCommand, enabled, setVisual]);

  const release = useCallback(() => {
    activeRef.current = "S";
    setVisual(0, 0);
    onCommand("S");
  }, [onCommand, setVisual]);

  const handleTouch = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !baseRef.current) return;

      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const diffX = clientX - centerX;
      const diffY = clientY - centerY;
      const maxRadius = 36;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY) || 1;
      const clamped = Math.min(distance, maxRadius);
      const normX = (diffX / distance) * clamped;
      const normY = (diffY / distance) * clamped;

      setVisual(normX, normY);

      if (distance < 18) {
        if (activeRef.current !== "S") {
          activeRef.current = "S";
          onCommand("S");
        }
        return;
      }

      let next: CommandKey = "S";
      if (Math.abs(diffX) > Math.abs(diffY)) {
        next = diffX > 0 ? "R" : "L";
      } else {
        next = diffY > 0 ? "B" : "F";
      }

      if (next !== activeRef.current) {
        activeRef.current = next;
        onCommand(next);
      }
    },
    [enabled, onCommand, setVisual]
  );

  return (
    <div
      ref={baseRef}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        if (!touch) return;
        handleTouch(touch.clientX, touch.clientY);
      }}
      onTouchMove={(event) => {
        const touch = event.touches[0];
        if (!touch) return;
        handleTouch(touch.clientX, touch.clientY);
      }}
      onTouchEnd={release}
      onTouchCancel={release}
      style={{ touchAction: "none" }}
      className={`relative flex h-44 w-44 items-center justify-center rounded-full border-2 ${
        enabled
          ? "border-emerald-400/40 bg-gray-100 dark:border-emerald-500/40 dark:bg-gray-800/60"
          : "border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-900/60"
      }`}
    >
      <div className="absolute inset-4 rounded-full border border-dashed border-gray-300 dark:border-gray-600/40" />
      <div
        ref={knobRef}
        style={{ transition: "transform 60ms ease-out" }}
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          enabled
            ? "bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.35)]"
            : "bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
        }`}
      >
        <Gamepad2 className="h-6 w-6" />
      </div>
    </div>
  );
}

function ManualTab({ onToast }: { onToast: (message: string, type: ToastType) => void }) {
  const wsRef = useRef<WebSocket | null>(null);
  const stopTimer = useRef<number | null>(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speed, setSpeed] = useState(150);
  const [lastCommand, setLastCommand] = useState<CommandKey>("S");
  const [trainingStatus, setTrainingStatus] = useState<RecordingStatus | null>(null);
  const [trainingBusy, setTrainingBusy] = useState(false);
  const [profileName, setProfileName] = useState("");

  const clearStopTimer = () => {
    if (stopTimer.current) {
      window.clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
  };

  const refreshTrainingStatus = useCallback(async () => {
    try {
      const response = await apiFetch("/api/bots/training/status", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) {
        setTrainingStatus(payload.status);
      }
    } catch {
      // Ignore status refresh failures in the control UI.
    }
  }, []);

  useEffect(() => {
    void refreshTrainingStatus();
    const interval = window.setInterval(() => {
      void refreshTrainingStatus();
    }, 2000);
    return () => window.clearInterval(interval);
  }, [refreshTrainingStatus]);

  const logCommand = useCallback(async (payload: Record<string, unknown>) => {
    try {
      await apiFetch("/api/bots/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // UI control should continue even if local logging fails.
    }
  }, []);

  const sendRaw = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    wsRef.current.send(message);
    return true;
  }, []);

  const trainingActive = Boolean(trainingStatus?.active);

  const sendCommand = useCallback(
    async (command: CommandKey) => {
      if (!connected) return;

      if (command === "SERVO" && lastCommand !== "S") {
        onToast("Stop the bot before moving the sensor arm.", "info");
        return;
      }

      const message = COMMANDS[command];
      if (!sendRaw(message)) {
        onToast("ESP32 connection is not ready.", "error");
        return;
      }

      if (command === "SERVO") {
        await logCommand({
          type: "servo",
          raw: message,
          direction: "SERVO",
          direction_label: "Sensor arm down",
          message: "Sensor arm moved down for reading capture",
        });
        onToast("Sensor arm activated. ESP32 will return it automatically.", "success");
        return;
      }

      setLastCommand(command);
      await logCommand({
        type: "movement",
        raw: message,
        direction: command,
        direction_label:
          command === "F"
            ? "Forward"
            : command === "B"
              ? "Backward"
              : command === "L"
                ? "Left"
                : command === "R"
                  ? "Right"
                  : "Stop",
      });
    },
    [connected, lastCommand, logCommand, onToast, sendRaw]
  );

  const connectBot = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || connecting) return;

    setConnecting(true);
    const socket = new WebSocket(ESP32_WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setConnecting(false);
      sendRaw(`Speed,${trainingActive ? AUTONOMOUS_PWM : speed}`);
      onToast("Connected to AgriBot ESP32 hotspot.", "success");
    };

    socket.onclose = () => {
      clearStopTimer();
      setConnected(false);
      setConnecting(false);
      setLastCommand("S");
    };

    socket.onerror = () => {
      setConnected(false);
      setConnecting(false);
      onToast("Could not reach ESP32. Join the AgriBot hotspot first.", "error");
    };
  }, [connecting, onToast, sendRaw, speed, trainingActive]);

  const disconnectBot = useCallback(() => {
    clearStopTimer();
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
    setConnecting(false);
    setLastCommand("S");
    onToast("Disconnected from AgriBot ESP32.", "info");
  }, [onToast]);

  useEffect(() => {
    return () => {
      clearStopTimer();
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!connected) return;
    sendRaw(`Speed,${trainingActive ? AUTONOMOUS_PWM : speed}`);
  }, [connected, sendRaw, speed, trainingActive]);

  useEffect(() => {
    if (!connected) return;

    const keyMap: Record<string, CommandKey> = {
      ArrowUp: "F",
      ArrowDown: "B",
      ArrowLeft: "L",
      ArrowRight: "R",
      w: "F",
      a: "L",
      s: "B",
      d: "R",
      " ": "S",
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const command = keyMap[event.key];
      if (!command) return;
      event.preventDefault();
      void sendCommand(command);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (keyMap[event.key]) {
        void sendCommand("S");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [connected, sendCommand]);

  const startTraining = useCallback(async () => {
    if (!connected) {
      onToast("Connect the bot first, then start manual training.", "info");
      return;
    }

    setTrainingBusy(true);
    try {
      sendRaw(`Speed,${AUTONOMOUS_PWM}`);
      setSpeed(AUTONOMOUS_PWM);

      const response = await apiFetch("/api/bots/training/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "guest" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not start manual training");
      }
      setTrainingStatus(payload.status);
      onToast("Manual training started. Drive the full farm path now.", "success");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not start training.", "error");
    } finally {
      setTrainingBusy(false);
    }
  }, [connected, onToast, sendRaw]);

  const stopTraining = useCallback(async () => {
    if (!profileName.trim()) {
      onToast("Enter a profile name before saving the manual training path.", "info");
      return;
    }

    setTrainingBusy(true);
    try {
      const response = await apiFetch("/api/bots/training/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_name: profileName.trim() }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not save the profile");
      }
      setTrainingStatus({ active: false, started_at: null, last_direction: "S", segment_count: 0, total_duration_ms: 0 });
      onToast(`Training saved as ${payload.profile.name}.`, "success");
      setProfileName("");
      await sendCommand("S");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not save the training profile.", "error");
    } finally {
      setTrainingBusy(false);
    }
  }, [onToast, profileName, sendCommand]);

  const commandLabel = useMemo(() => formatDirection(lastCommand), [lastCommand]);

  const commandTone =
    lastCommand === "S"
      ? "text-red-600 dark:text-red-400"
      : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
              connected
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                : "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            }`}
          >
            {connected ? (
              <Wifi className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <WifiOff className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
              ESP32 Hotspot Control
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Join the AgriBot hotspot and train the path directly at `{ESP32_HOST}`.
            </p>
          </div>

          <button
            onClick={connected ? disconnectBot : connectBot}
            disabled={connecting}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all disabled:opacity-60 ${
              connected
                ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
            }`}
          >
            {connecting ? "Connecting..." : connected ? "Disconnect" : "Connect Bot"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-500/20 dark:bg-amber-950/20 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                    Manual Training
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-100/90 sm:text-base">
                    Train the path once from the start line. Recording locks the bot to PWM 205 so
                    the same stored profile can be replayed later in autonomous mode.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <input
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    placeholder="Profile name, for example deepak's_farm"
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-400 dark:border-amber-500/20 dark:bg-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => void startTraining()}
                    disabled={!connected || trainingActive || trainingBusy}
                    className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {trainingBusy && !trainingActive ? "Starting..." : "Start Training"}
                  </button>
                  <button
                    onClick={() => void stopTraining()}
                    disabled={!trainingActive || trainingBusy}
                    className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/20 dark:bg-gray-900 dark:text-emerald-300"
                  >
                    {trainingBusy && trainingActive ? "Saving..." : "Stop & Save"}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-amber-200/70 bg-white/70 px-4 py-3 dark:border-amber-500/10 dark:bg-gray-900/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                      Recording
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                      {trainingActive ? "Active" : "Ready"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200/70 bg-white/70 px-4 py-3 dark:border-amber-500/10 dark:bg-gray-900/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                      Stored Duration
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                      {formatDuration(trainingStatus?.total_duration_ms ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200/70 bg-white/70 px-4 py-3 dark:border-amber-500/10 dark:bg-gray-900/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                      Segments
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                      {trainingStatus?.segment_count ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
                Last Command
              </span>
              <span className={`text-base font-bold ${commandTone}`}>{commandLabel}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Speed Control</h3>
              <span className="ml-auto text-base font-bold text-emerald-600 dark:text-emerald-400">
                {trainingActive ? "205 fixed" : `${Math.round((speed / 255) * 100)}%`}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={255}
              step={1}
              value={trainingActive ? AUTONOMOUS_PWM : speed}
              disabled={!connected || trainingActive}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="h-3 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-emerald-500 disabled:opacity-40 dark:bg-gray-700"
            />
            <div className="mt-3 flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-6 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manual Direction Training
              </h3>
            </div>

            <div className="hidden items-center justify-center md:flex">
              <div className="flex flex-col items-center gap-3">
                <DirectionButton cmd="F" enabled={connected} onCommand={(cmd) => void sendCommand(cmd)}>
                  <ChevronUp className="h-7 w-7" />
                </DirectionButton>
                <div className="flex items-center gap-3">
                  <DirectionButton cmd="L" enabled={connected} onCommand={(cmd) => void sendCommand(cmd)}>
                    <ChevronLeft className="h-7 w-7" />
                  </DirectionButton>
                  <button
                    disabled={!connected}
                    onPointerDown={() => void sendCommand("S")}
                    className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl transition-all active:scale-95 ${
                      connected
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600"
                        : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
                    }`}
                  >
                    <Square className="h-6 w-6" />
                  </button>
                  <DirectionButton cmd="R" enabled={connected} onCommand={(cmd) => void sendCommand(cmd)}>
                    <ChevronRight className="h-7 w-7" />
                  </DirectionButton>
                </div>
                <DirectionButton cmd="B" enabled={connected} onCommand={(cmd) => void sendCommand(cmd)}>
                  <ChevronDown className="h-7 w-7" />
                </DirectionButton>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 md:hidden">
              <TouchJoystick enabled={connected} onCommand={(cmd) => void sendCommand(cmd)} />
              <button
                disabled={!connected}
                onClick={() => void sendCommand("S")}
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  connected
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                }`}
              >
                <Square className="h-5 w-5" />
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag the joystick to train the path. Release to stop.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Hand className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sensor Arm</h3>
            </div>
            <p className="mb-4 text-sm leading-6 text-gray-500 dark:text-gray-400 sm:text-base">
              Use this only when the bot is stopped. Training does not include servo sensing, and
              autonomous will trigger two sensing breaks on the saved route automatically.
            </p>
            <button
              disabled={!connected || lastCommand !== "S" || trainingActive}
              onClick={() => void sendCommand("SERVO")}
              className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                connected && lastCommand === "S" && !trainingActive
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                  : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600"
              }`}
            >
              Move Sensor Arm
            </button>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm dark:border-sky-500/20 dark:bg-sky-950/20 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">
              Training Notes
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-sky-800 dark:text-sky-100/90 sm:text-base">
              <li>Movement commands go directly from the browser to the ESP32 over the hotspot.</li>
              <li>The Pi backend stores the trained movement profile in local MongoDB.</li>
              <li>Autonomous replay later uses fixed PWM 205 and inserts two servo breaks automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutonomousTab({ onToast }: { onToast: (message: string, type: ToastType) => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [status, setStatus] = useState<AutonomousStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");

  const refreshProfiles = useCallback(async () => {
    const response = await apiFetch("/api/bots/profiles", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "Could not load profiles");
    }
    setProfiles(payload.profiles);
    setSelectedProfileId((current) => current || payload.profiles[0]?.id || "");
  }, []);

  const refreshStatus = useCallback(async () => {
    const response = await apiFetch("/api/bots/autonomous/status", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok && payload.success) {
      setStatus(payload.status);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await Promise.all([refreshProfiles(), refreshStatus()]);
        const base = await resolveApiBase();
        setStreamUrl(`${base}/api/auto/stream`);
      } catch (error) {
        onToast(error instanceof Error ? error.message : "Could not load autonomous data.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [onToast, refreshProfiles, refreshStatus]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshStatus();
      void refreshProfiles();
    }, 2500);
    return () => window.clearInterval(interval);
  }, [refreshProfiles, refreshStatus]);

  const startAutonomous = useCallback(async () => {
    if (!selectedProfileId) {
      onToast("Save and select one training profile before starting autonomous mode.", "info");
      return;
    }

    setWorking(true);
    try {
      const response = await apiFetch("/api/bots/autonomous/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: selectedProfileId, user_id: "guest" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not start autonomous mode");
      }
      setStatus(payload.status);
      onToast("Autonomous replay started. Manual detection sessions are now managed by the Pi.", "success");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not start autonomous mode.", "error");
    } finally {
      setWorking(false);
    }
  }, [onToast, selectedProfileId]);

  const stopAutonomous = useCallback(async () => {
    setWorking(true);
    try {
      const response = await apiFetch("/api/bots/autonomous/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not stop autonomous mode");
      }
      setStatus(payload.status);
      onToast("Autonomous mode stopped. Detection sessions and replay were closed.", "info");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not stop autonomous mode.", "error");
    } finally {
      setWorking(false);
    }
  }, [onToast]);

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? null;
  const running = Boolean(status?.running);
  const progressPercent = Math.round((status?.progress_ratio ?? 0) * 100);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-500/20 dark:bg-red-950/20 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-300" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700 dark:text-red-300">
              Before You Start
            </p>
            <p className="mt-2 text-sm leading-6 text-red-900 dark:text-red-100/90 sm:text-base">
              Keep the bot at the start point, complete manual training first, then select the saved
              profile here. Starting autonomous mode will take over the models, servo breaks, and
              obstacle pause handling from the Pi backend.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <Cpu className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Autonomous Replay
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
                  Fixed speed PWM 205, two servo sensing breaks, shared live Pi camera, and both
                  models running together.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Saved training profile
              </label>
              <select
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
                disabled={running || profiles.length === 0}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="">{profiles.length ? "Select a saved profile" : "No saved profile yet"}</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>

              {selectedProfile && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Duration
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                      {formatDuration(selectedProfile.total_duration_ms)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Segments
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                      {selectedProfile.segment_count}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      Servo Breaks
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                      {selectedProfile.breakpoints_ms.length}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void startAutonomous()}
                  disabled={working || running || !selectedProfileId}
                  className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {working && !running ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
                  Start Autonomous
                </button>
                <button
                  onClick={() => void stopAutonomous()}
                  disabled={working || !running}
                  className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-3xl bg-red-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {working && running ? <Loader2 className="h-5 w-5 animate-spin" /> : <PauseCircle className="h-5 w-5" />}
                  Stop Autonomous
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Autonomous Status</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  The Pi pauses progress during ultrasonic stops and servo breaks, then resumes from
                  the same saved step.
                </p>
              </div>
              {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Selected</p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {status?.profile_name || selectedProfile?.name || "No profile selected"}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Current action</p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {formatDirection(status?.current_direction || "S")}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Pause state</p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {formatPauseReason(status?.paused_reason || null)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Obstacle flag</p>
                <p className={`mt-2 text-base font-semibold ${status?.obstacle ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {status?.obstacle ? "Detected" : "Clear"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Replay progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-3 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{formatDuration(status?.progress_ms ?? 0)}</span>
                <span>{formatDuration(status?.total_duration_ms ?? selectedProfile?.total_duration_ms ?? 0)}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">PWM</p>
                <p className="mt-2 text-lg font-semibold text-emerald-800 dark:text-emerald-100">
                  {status?.speed_pwm ?? AUTONOMOUS_PWM}
                </p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-500/20 dark:bg-sky-950/20">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Segments</p>
                <p className="mt-2 text-lg font-semibold text-sky-800 dark:text-sky-100">
                  {Math.max((status?.current_segment_index ?? -1) + 1, 0)} / {status?.total_segments ?? selectedProfile?.segment_count ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-950/20">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Servo breaks</p>
                <p className="mt-2 text-lg font-semibold text-amber-800 dark:text-amber-100">
                  {status?.breaks_taken ?? 0} / 2
                </p>
              </div>
            </div>

            {status?.error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-200">
                {status.error}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Shared Live Pi Camera</h3>
            </div>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-950 dark:border-gray-800">
              {streamUrl ? (
                <img
                  src={streamUrl}
                  alt="Live Pi camera stream"
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-sm text-gray-400">
                  Live stream preparing...
                </div>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400 sm:text-base">
              During autonomous replay, animal and plant models share this same Pi cam stream and
              store only detected events in local MongoDB history.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Save className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Saved Profiles</h3>
            </div>
            <div className="space-y-3">
              {profiles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No manual training profile is saved yet. Go to the Manual tab, record the path,
                  and save it with a profile name.
                </div>
              ) : (
                profiles.map((profile) => {
                  const selected = profile.id === selectedProfileId;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfileId(profile.id)}
                      disabled={running}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/20"
                          : "border-gray-200 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-gray-800 dark:bg-gray-950/50 dark:hover:border-emerald-500/20"
                      } ${running ? "cursor-not-allowed opacity-80" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {profile.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {formatDuration(profile.total_duration_ms)} • {profile.segment_count} segments • PWM {profile.speed_pwm}
                          </p>
                        </div>
                        {selected ? <PlayCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BotControlPage() {
  const [tab, setTab] = useState<"manual" | "autonomous">("manual");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <div className="min-h-full bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Bot Control
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Offline hotspot control, profile training, and Pi-driven autonomous replay.
            </p>
          </div>
        </div>

        <div className="mb-6 inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setTab("manual")}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === "manual"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setTab("autonomous")}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === "autonomous"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Autonomous
          </button>
        </div>

        {tab === "manual" ? <ManualTab onToast={showToast} /> : <AutonomousTab onToast={showToast} />}
      </div>
    </div>
  );
}
