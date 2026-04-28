"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Camera,
  Cpu,
  Gamepad2,
  Loader2,
  PauseCircle,
  PlayCircle,
  Save,
  ShieldAlert,
  Square,
  Wifi,
  WifiOff,
} from "lucide-react";

import { apiFetch, getApiUrl } from "@/lib/api";

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
type PageTab = "manual" | "training" | "autonomous";
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
      return "Left";
    case "R":
      return "Right";
    default:
      return "Stopped";
  }
}

function formatPauseReason(reason: string | null) {
  if (!reason) return "Running";
  if (reason === "servo_break") return "Servo sensing break";
  if (reason === "obstacle") return "Obstacle pause";
  if (reason === "stopped_by_user") return "Stopped by user";
  return reason.replaceAll("_", " ");
}

function formatIst(value?: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    <div className={`fixed right-4 top-4 z-50 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${colors[type]}`}>
      {message}
    </div>
  );
}

function DirectionButton({
  command,
  enabled,
  active,
  onPress,
  children,
}: {
  command: CommandKey;
  enabled: boolean;
  active?: boolean;
  onPress: (command: CommandKey, release?: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={!enabled}
      onPointerDown={() => onPress(command, false)}
      onPointerUp={() => onPress("S", true)}
      onPointerLeave={() => onPress("S", true)}
      onPointerCancel={() => onPress("S", true)}
      className={`flex h-[4.7rem] w-[4.7rem] items-center justify-center rounded-3xl border text-gray-700 transition-all active:scale-95 dark:text-gray-100 ${
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

function MobileCircleButton({
  label,
  onClick,
  disabled,
  variant = "neutral",
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant?: "neutral" | "danger" | "emerald";
}) {
  const styles =
    variant === "danger"
      ? "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
      : variant === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
        : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-14 min-w-14 rounded-full border px-4 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${styles}`}
    >
      {label}
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
  onCommand: (command: CommandKey, release?: boolean) => void;
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
    onCommand("S", true);
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
          onCommand("S", true);
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
        onCommand(next, false);
      }
    },
    [enabled, onCommand, setVisual]
  );

  return (
    <div
      ref={baseRef}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        if (touch) handleTouch(touch.clientX, touch.clientY);
      }}
      onTouchMove={(event) => {
        const touch = event.touches[0];
        if (touch) handleTouch(touch.clientX, touch.clientY);
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

function useEsp32Controller(onToast: (message: string, type: ToastType) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speed, setSpeed] = useState(150);
  const [lastCommand, setLastCommand] = useState<CommandKey>("S");

  const logCommand = useCallback(async (payload: Record<string, unknown>) => {
    try {
      await apiFetch("/api/bots/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Keep live bot control usable even if command logging fails.
    }
  }, []);

  const sendRaw = useCallback((message: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
    wsRef.current.send(message);
    return true;
  }, []);

  const connectBot = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || connecting) return;

    setConnecting(true);
    const socket = new WebSocket(ESP32_WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setConnecting(false);
      sendRaw(`Speed,${speed}`);
      onToast("Connected to the AgriBot ESP32 hotspot.", "success");
    };

    socket.onclose = () => {
      setConnected(false);
      setConnecting(false);
      setLastCommand("S");
    };

    socket.onerror = () => {
      setConnected(false);
      setConnecting(false);
      onToast("Could not connect to ESP32. Join the hotspot first.", "error");
    };
  }, [connecting, onToast, sendRaw, speed]);

  const disconnectBot = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
    setConnecting(false);
    setLastCommand("S");
    onToast("Disconnected from the ESP32 bot controller.", "info");
  }, [onToast]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (connected) sendRaw(`Speed,${speed}`);
  }, [connected, sendRaw, speed]);

  const sendCommand = useCallback(
    async (command: CommandKey, release = false) => {
      if (!connected) return;

      if (command === "SERVO" && lastCommand !== "S") {
        onToast("Stop the bot before moving the sensor arm.", "info");
        return;
      }

      if (!sendRaw(COMMANDS[command])) {
        onToast("ESP32 connection is not ready.", "error");
        return;
      }

      if (command === "SERVO") {
        await logCommand({
          type: "servo",
          raw: COMMANDS[command],
          direction: "SERVO",
          direction_label: "Sensor arm down",
          message: "Sensor arm moved down for reading capture",
        });
        onToast("Sensor arm activated for soil readings.", "success");
        return;
      }

      setLastCommand(command);
      await logCommand({
        type: "movement",
        raw: COMMANDS[command],
        direction: command,
        direction_label: formatDirection(command),
        released: release,
      });
    },
    [connected, lastCommand, logCommand, onToast, sendRaw]
  );

  return {
    connected,
    connecting,
    speed,
    setSpeed,
    lastCommand,
    connectBot,
    disconnectBot,
    sendCommand,
    sendRaw,
  };
}

function ConnectionCard({
  connected,
  connecting,
  onConnect,
  onDisconnect,
}: {
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
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
            Connect Bot
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Join the AgriBot hotspot and control the ESP32 at {ESP32_HOST}.
          </p>
        </div>

        <button
          onClick={connected ? onDisconnect : onConnect}
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
  );
}

function ControlSurface({
  connected,
  canAdjustSpeed,
  speed,
  setSpeed,
  lastCommand,
  sendCommand,
}: {
  connected: boolean;
  canAdjustSpeed: boolean;
  speed: number;
  setSpeed: (value: number) => void;
  lastCommand: CommandKey;
  sendCommand: (command: CommandKey, release?: boolean) => void | Promise<void>;
}) {
  const actionDisabled = !connected;

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
              Manual Controls
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Servo arm works only when the bot is stopped. Laptop shows 6 buttons and mobile shows
              the joystick with separate stop and servo buttons.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              lastCommand === "S"
                ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            }`}
          >
            {formatDirection(lastCommand)}
          </span>
        </div>

        <div className="hidden justify-center md:flex">
          <div className="grid grid-cols-3 gap-4">
            <div />
            <DirectionButton
              command="F"
              enabled={!actionDisabled}
              active={lastCommand === "F"}
              onPress={sendCommand}
            >
              ↑
            </DirectionButton>
            <div />

            <DirectionButton
              command="L"
              enabled={!actionDisabled}
              active={lastCommand === "L"}
              onPress={sendCommand}
            >
              ←
            </DirectionButton>
            <DirectionButton command="S" enabled={!actionDisabled} active={lastCommand === "S"} onPress={sendCommand}>
              ■
            </DirectionButton>
            <DirectionButton
              command="R"
              enabled={!actionDisabled}
              active={lastCommand === "R"}
              onPress={sendCommand}
            >
              →
            </DirectionButton>

            <div />
            <DirectionButton
              command="B"
              enabled={!actionDisabled}
              active={lastCommand === "B"}
              onPress={sendCommand}
            >
              ↓
            </DirectionButton>
            <button
              onClick={() => void sendCommand("SERVO")}
              disabled={actionDisabled || lastCommand !== "S"}
              className={`flex h-[4.7rem] w-[4.7rem] items-center justify-center rounded-3xl border text-sm font-semibold transition ${
                actionDisabled || lastCommand !== "S"
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
              }`}
            >
              Arm
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:hidden">
          <TouchJoystick enabled={!actionDisabled} activeCommand={lastCommand} onCommand={sendCommand} />
          <div className="flex items-center gap-4">
            <MobileCircleButton
              label="Stop"
              onClick={() => void sendCommand("S", true)}
              disabled={actionDisabled}
              variant="danger"
            />
            <MobileCircleButton
              label="Arm"
              onClick={() => void sendCommand("SERVO")}
              disabled={actionDisabled || lastCommand !== "S"}
              variant="emerald"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Control Status</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Connection</p>
              <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                {connected ? "Connected to ESP32" : "Not connected"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Current action</p>
              <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                {formatDirection(lastCommand)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Motor Speed</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Manual driving can still use the speed slider. Training and autonomous replay remain
            fixed at PWM 205.
          </p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Selected PWM</span>
              <span className="font-semibold text-gray-900 dark:text-white">{speed}</span>
            </div>
            <input
              type="range"
              min={80}
              max={255}
              value={speed}
              disabled={!canAdjustSpeed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-emerald-500 disabled:cursor-not-allowed dark:bg-gray-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualPage({
  connected,
  connecting,
  speed,
  setSpeed,
  lastCommand,
  connectBot,
  disconnectBot,
  sendCommand,
}: {
  connected: boolean;
  connecting: boolean;
  speed: number;
  setSpeed: (value: number) => void;
  lastCommand: CommandKey;
  connectBot: () => void;
  disconnectBot: () => void;
  sendCommand: (command: CommandKey, release?: boolean) => void | Promise<void>;
}) {
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
      void sendCommand(command, false);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (keyMap[event.key]) {
        void sendCommand("S", true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [connected, sendCommand]);

  return (
    <div className="space-y-5">
      <ConnectionCard
        connected={connected}
        connecting={connecting}
        onConnect={connectBot}
        onDisconnect={disconnectBot}
      />
      <ControlSurface
        connected={connected}
        canAdjustSpeed={connected}
        speed={speed}
        setSpeed={setSpeed}
        lastCommand={lastCommand}
        sendCommand={sendCommand}
      />
    </div>
  );
}

function TrainingPage({
  connected,
  connecting,
  lastCommand,
  connectBot,
  disconnectBot,
  sendCommand,
  sendRaw,
  onToast,
}: {
  connected: boolean;
  connecting: boolean;
  lastCommand: CommandKey;
  connectBot: () => void;
  disconnectBot: () => void;
  sendCommand: (command: CommandKey, release?: boolean) => void | Promise<void>;
  sendRaw: (message: string) => boolean;
  onToast: (message: string, type: ToastType) => void;
}) {
  const [trainingStatus, setTrainingStatus] = useState<RecordingStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [profileName, setProfileName] = useState("");

  const refreshStatus = useCallback(async () => {
    try {
      const response = await apiFetch("/api/bots/training/status", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) setTrainingStatus(payload.status);
    } catch {
      // keep quiet in UI refresh
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [refreshStatus]);

  const startTraining = useCallback(async () => {
    if (!connected) {
      onToast("Connect the bot first, then start training.", "info");
      return;
    }

    setBusy(true);
    try {
      await sendCommand("S", true);
      sendRaw(`Speed,${AUTONOMOUS_PWM}`);
      const response = await apiFetch("/api/bots/training/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "guest" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Could not start training");
      setTrainingStatus(payload.status);
      onToast("Training started. Drive the full farm path at PWM 205.", "success");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not start training.", "error");
    } finally {
      setBusy(false);
    }
  }, [connected, onToast, sendCommand]);

  const saveTraining = useCallback(async () => {
    if (!profileName.trim()) {
      onToast("Enter a profile name before saving.", "info");
      return;
    }

    setBusy(true);
    try {
      await sendCommand("S", true);
      const response = await apiFetch("/api/bots/training/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_name: profileName.trim() }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Could not save the training profile");
      setTrainingStatus(payload.status || { active: false, started_at: null, last_direction: "S", segment_count: 0, total_duration_ms: 0 });
      setProfileName("");
      onToast(`Training profile saved as ${payload.profile.name}.`, "success");
      await refreshStatus();
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not save training.", "error");
    } finally {
      setBusy(false);
    }
  }, [onToast, profileName, refreshStatus, sendCommand]);

  return (
    <div className="space-y-5">
      <ConnectionCard
        connected={connected}
        connecting={connecting}
        onConnect={connectBot}
        onDisconnect={disconnectBot}
      />

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-500/20 dark:bg-amber-950/20 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
              Manual Training
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-100/90 sm:text-base">
              This page records the path for autonomous replay. The training replay speed stays fixed
              to PWM 205 so the saved profile matches autonomous playback as closely as possible.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <ControlSurface
            connected={connected}
            canAdjustSpeed={false}
            speed={AUTONOMOUS_PWM}
            setSpeed={() => undefined}
            lastCommand={lastCommand}
            sendCommand={sendCommand}
          />
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Session</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Start training, drive the full route, stop the bot when needed, and save the finished
              profile once the farm path is complete.
            </p>

            <div className="mt-5 grid gap-4">
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Profile name, for example deepak_farm"
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={() => void startTraining()}
                  disabled={!connected || busy || Boolean(trainingStatus?.active)}
                  className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  {busy && !trainingStatus?.active ? "Starting..." : "Start Training"}
                </button>
                <button
                  onClick={() => void sendCommand("S", true)}
                  disabled={!connected}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                >
                  Stop Training
                </button>
                <button
                  onClick={() => void saveTraining()}
                  disabled={!connected || busy || !trainingStatus?.active}
                  className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-500/20 dark:bg-gray-900 dark:text-emerald-300 dark:hover:bg-emerald-950/20"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Status</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Recording</p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {trainingStatus?.active ? "Active" : "Idle"}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Last direction</p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {formatDirection(trainingStatus?.last_direction || "S")}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Started at</p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {formatIst(trainingStatus?.started_at)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Segments</p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {trainingStatus?.segment_count || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-200">
              Recorded duration: {formatDuration(trainingStatus?.total_duration_ms || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutonomousPage({
  onToast,
  openTrainingPage,
}: {
  onToast: (message: string, type: ToastType) => void;
  openTrainingPage: () => void;
}) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [status, setStatus] = useState<AutonomousStatus | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const refreshProfiles = useCallback(async () => {
    try {
      const response = await apiFetch("/api/bots/profiles", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) return;
      setProfiles(payload.profiles || []);
      setSelectedProfileId((current) => current || payload.profiles?.[0]?.id || "");
    } catch {
      // ignore
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await apiFetch("/api/bots/autonomous/status", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) return;
      setStatus(payload.status);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfiles();
    void refreshStatus();
    getApiUrl("/api/auto/stream").then(setStreamUrl);

    const timer = window.setInterval(() => {
      void refreshStatus();
      void refreshProfiles();
    }, 2000);

    return () => window.clearInterval(timer);
  }, [refreshProfiles, refreshStatus]);

  const startAutonomous = useCallback(async () => {
    if (!selectedProfileId) {
      onToast("Select a saved training profile before starting autonomous mode.", "info");
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
      if (!response.ok || !payload.success) throw new Error(payload.error || "Could not start autonomous mode");
      setStatus(payload.status);
      onToast("Autonomous replay started.", "success");
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
      if (!response.ok || !payload.success) throw new Error(payload.error || "Could not stop autonomous mode");
      setStatus(payload.status);
      onToast("Autonomous mode stopped.", "info");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not stop autonomous mode.", "error");
    } finally {
      setWorking(false);
    }
  }, [onToast]);

  const selectedProfile = profiles.find((item) => item.id === selectedProfileId) || null;
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
                  Fixed speed PWM 205, two servo sensing breaks, one shared Pi camera stream, and both models running together.
                </p>
              </div>
            </div>

            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Saved training profile
            </label>
            <select
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
              disabled={running || profiles.length === 0}
              className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="">{profiles.length ? "Select a saved profile" : "No saved profile yet"}</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={openTrainingPage}
                className="rounded-2xl border border-gray-200 bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Go To Manual Training
              </button>
            </div>

            {selectedProfile ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {formatDuration(selectedProfile.total_duration_ms)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Segments</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {selectedProfile.segment_count}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Servo breaks</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {selectedProfile.breakpoints_ms.length}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => void startAutonomous()}
                disabled={working || running || !selectedProfileId}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-50"
              >
                {working && !running ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
                Start Autonomous
              </button>
              <button
                onClick={() => void stopAutonomous()}
                disabled={working || !running}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-3xl bg-red-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 disabled:opacity-50"
              >
                {working && running ? <Loader2 className="h-5 w-5 animate-spin" /> : <PauseCircle className="h-5 w-5" />}
                Stop Autonomous
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Autonomous View</h3>
            </div>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-950 dark:border-gray-800">
              {streamUrl ? (
                <img src={streamUrl} alt="Live Pi camera stream" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm text-gray-400">
                  Live stream preparing...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Autonomous Status</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The Pi pauses progress during ultrasonic stops and servo breaks, then resumes the same saved step.
              </p>
            </div>
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : null}
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
              <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{formatDuration(status?.progress_ms ?? 0)}</span>
              <span>{formatDuration(status?.total_duration_ms ?? selectedProfile?.total_duration_ms ?? 0)}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-950/20">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">PWM</p>
              <p className="mt-2 text-lg font-semibold text-emerald-800 dark:text-emerald-100">{status?.speed_pwm ?? AUTONOMOUS_PWM}</p>
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

          {status?.started_at ? (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-300">
              Started at: {formatIst(status.started_at)}
            </div>
          ) : null}

          {status?.error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-200">
              {status.error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function BotControlPage() {
  const [tab, setTab] = useState<PageTab>("manual");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const controller = useEsp32Controller(showToast);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <div className="min-h-full bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
      {toast ? <Toast message={toast.message} type={toast.type} /> : null}

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Bot Control</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              Manual hotspot driving, separate path training, and Pi-driven autonomous replay.
            </p>
          </div>
        </div>

        <div className="mb-6 inline-flex flex-wrap rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {[
            { key: "manual", label: "Manual" },
            { key: "training", label: "Manual Training" },
            { key: "autonomous", label: "Autonomous" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as PageTab)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                tab === item.key
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "manual" ? (
          <ManualPage
            connected={controller.connected}
            connecting={controller.connecting}
            speed={controller.speed}
            setSpeed={controller.setSpeed}
            lastCommand={controller.lastCommand}
            connectBot={controller.connectBot}
            disconnectBot={controller.disconnectBot}
            sendCommand={controller.sendCommand}
          />
        ) : tab === "training" ? (
          <TrainingPage
            connected={controller.connected}
            connecting={controller.connecting}
            lastCommand={controller.lastCommand}
            connectBot={controller.connectBot}
            disconnectBot={controller.disconnectBot}
            sendCommand={controller.sendCommand}
            sendRaw={controller.sendRaw}
            onToast={showToast}
          />
        ) : (
          <AutonomousPage onToast={showToast} openTrainingPage={() => setTab("training")} />
        )}
      </div>
    </div>
  );
}
