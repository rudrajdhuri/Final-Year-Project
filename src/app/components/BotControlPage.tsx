"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cpu,
  Gauge,
  Gamepad2,
  Hand,
  Navigation,
  Square,
  Wifi,
  WifiOff,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

const ESP32_HOST = "192.168.4.1";
const ESP32_WS_URL = `ws://${ESP32_HOST}/CarInput`;

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
  onCommand,
  children,
}: {
  cmd: CommandKey;
  enabled: boolean;
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
        enabled
          ? "border-gray-200 bg-white shadow-sm hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-emerald-500/40 dark:hover:bg-gray-700"
          : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function TouchJoystick({
  enabled,
  onCommand,
}: {
  enabled: boolean;
  onCommand: (command: CommandKey) => void;
}) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<CommandKey>("S");

  const setVisual = (x: number, y: number) => {
    if (!knobRef.current) return;
    knobRef.current.style.transform = `translate(${x}px, ${y}px)`;
  };

  const release = useCallback(() => {
    activeRef.current = "S";
    setVisual(0, 0);
    onCommand("S");
  }, [onCommand]);

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
    [enabled, onCommand]
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

function ManualTab() {
  const wsRef = useRef<WebSocket | null>(null);
  const toastTimer = useRef<number | null>(null);
  const stopTimer = useRef<number | null>(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speed, setSpeed] = useState(150);
  const [lastCommand, setLastCommand] = useState<CommandKey>("S");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const clearStopTimer = () => {
    if (stopTimer.current) {
      window.clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
  };

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

  const sendCommand = useCallback(
    async (command: CommandKey) => {
      if (!connected) return;

      if (command === "SERVO" && lastCommand !== "S") {
        showToast("Stop the bot before moving the sensor arm.", "info");
        return;
      }

      const message = COMMANDS[command];
      if (!sendRaw(message)) {
        showToast("ESP32 connection is not ready.", "error");
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
        showToast("Sensor arm activated. ESP32 will return it automatically.", "success");
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
    [connected, lastCommand, logCommand, sendRaw, showToast]
  );

  const connectBot = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || connecting) return;

    setConnecting(true);
    const socket = new WebSocket(ESP32_WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setConnecting(false);
      sendRaw(`Speed,${speed}`);
      showToast("Connected to AgriBot ESP32 hotspot.", "success");
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
      showToast("Could not reach ESP32. Join the AgriBot hotspot first.", "error");
    };
  }, [connecting, sendRaw, showToast, speed]);

  const disconnectBot = useCallback(() => {
    clearStopTimer();
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
    setConnecting(false);
    setLastCommand("S");
    showToast("Disconnected from AgriBot ESP32.", "info");
  }, [showToast]);

  useEffect(() => {
    return () => {
      clearStopTimer();
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!connected) return;
    sendRaw(`Speed,${speed}`);
  }, [connected, sendRaw, speed]);

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
      sendCommand(command);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (keyMap[event.key]) {
        sendCommand("S");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [connected, sendCommand]);

  const commandLabel = useMemo(() => {
    switch (lastCommand) {
      case "F":
        return "Forward";
      case "B":
        return "Backward";
      case "L":
        return "Left";
      case "R":
        return "Right";
      default:
        return "Stop";
    }
  }, [lastCommand]);

  const commandTone =
    lastCommand === "S"
      ? "text-red-600 dark:text-red-400"
      : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} />}

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
              Join the AgriBot hotspot and control the bot directly at `{ESP32_HOST}`.
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
            {Math.round((speed / 255) * 100)}%
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={255}
          step={1}
          value={speed}
          disabled={!connected}
          onChange={(event) => setSpeed(Number(event.target.value))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-emerald-500 disabled:opacity-40 dark:bg-gray-700"
        />
        <div className="mt-3 flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Laptop Direction Buttons
            </h3>
          </div>

          <div className="hidden items-center justify-center md:flex">
            <div className="flex flex-col items-center gap-3">
              <DirectionButton cmd="F" enabled={connected} onCommand={sendCommand}>
                <ChevronUp className="h-7 w-7" />
              </DirectionButton>
              <div className="flex items-center gap-3">
                <DirectionButton cmd="L" enabled={connected} onCommand={sendCommand}>
                  <ChevronLeft className="h-7 w-7" />
                </DirectionButton>
                <button
                  disabled={!connected}
                  onPointerDown={() => sendCommand("S")}
                  className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl transition-all active:scale-95 ${
                    connected
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600"
                      : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
                  }`}
                >
                  <Square className="h-6 w-6" />
                </button>
                <DirectionButton cmd="R" enabled={connected} onCommand={sendCommand}>
                  <ChevronRight className="h-7 w-7" />
                </DirectionButton>
              </div>
              <DirectionButton cmd="B" enabled={connected} onCommand={sendCommand}>
                <ChevronDown className="h-7 w-7" />
              </DirectionButton>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 md:hidden">
            <TouchJoystick enabled={connected} onCommand={sendCommand} />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drag the joystick to move. Release to stop.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Hand className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sensor Arm</h3>
            </div>
            <p className="mb-4 text-sm leading-6 text-gray-500 dark:text-gray-400 sm:text-base">
              Use this only when the bot is stopped. Your ESP32 code lowers the servo arm, takes
              readings, and auto-returns it after about 3 seconds.
            </p>
            <button
              disabled={!connected || lastCommand !== "S"}
              onClick={() => sendCommand("SERVO")}
              className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                connected && lastCommand === "S"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                  : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600"
              }`}
            >
              Move Sensor Arm
            </button>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm dark:border-sky-500/20 dark:bg-sky-950/20 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">
              Control Notes
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-sky-800 dark:text-sky-100/90 sm:text-base">
              <li>Movement commands go directly from the browser to the ESP32 over the hotspot.</li>
              <li>The Pi backend logs commands to MongoDB for your local history and status cards.</li>
              <li>Ultrasonic safety still works inside the ESP32 even if the UI asks the bot to move.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutonomousTab() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
        <Cpu className="h-9 w-9 text-gray-400 dark:text-gray-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Autonomous Mode</h2>
        <p className="mt-2 max-w-md text-sm leading-7 text-gray-500 dark:text-gray-400 sm:text-base">
          AI-based navigation is already separate from this manual panel. This section stays ready
          for future autonomous control integration on the Pi.
        </p>
      </div>
    </div>
  );
}

export default function BotControlPage() {
  const [tab, setTab] = useState<"manual" | "autonomous">("manual");

  return (
    <div className="min-h-full bg-gray-50 px-4 py-5 transition-colors duration-200 dark:bg-gray-950 sm:px-6 lg:px-8">
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
              Manual hotspot control for Raspberry Pi deployment and offline field use.
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

        {tab === "manual" ? <ManualTab /> : <AutonomousTab />}
      </div>
    </div>
  );
}
