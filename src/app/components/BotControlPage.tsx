"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cpu,
  Navigation,
  Square,
  Wifi,
  WifiOff,
  Gauge,
  Router,
} from "lucide-react";

const ESP32_HOST = "192.168.4.1";
const ESP32_HTTP_URL = `http://${ESP32_HOST}`;
const ESP32_WS_URL = `ws://${ESP32_HOST}/CarInput`;

function Toast({
  message,
  type = "success",
}: {
  message: string;
  type?: "success" | "error" | "info";
}) {
  const colors = {
    success:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    error:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    info:
      "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  };

  return (
    <div
      className={`fixed right-5 top-5 z-50 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl ${colors[type]}`}
    >
      {message}
    </div>
  );
}

function DirBtn({
  cmd,
  enabled,
  onCmd,
  children,
}: {
  cmd: string;
  enabled: boolean;
  onCmd: (cmd: string) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={!enabled}
      onPointerDown={() => onCmd(cmd)}
      onPointerUp={() => onCmd("S")}
      onPointerLeave={() => onCmd("S")}
      onPointerCancel={() => onCmd("S")}
      className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-all active:scale-95 ${
        enabled
          ? "border-gray-200 bg-white text-gray-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-emerald-500/30 dark:hover:bg-gray-700"
          : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function ManualTab() {
  const wsRef = useRef<WebSocket | null>(null);
  const stopTimerRef = useRef<number | null>(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speed, setSpeed] = useState(150);
  const [lastCmd, setLastCmd] = useState("S");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const cmdMeta = useMemo(
    () => ({
      F: { label: "Forward", cls: "text-emerald-600 dark:text-emerald-400" },
      B: { label: "Backward", cls: "text-amber-600 dark:text-amber-400" },
      L: { label: "Left", cls: "text-sky-600 dark:text-sky-400" },
      R: { label: "Right", cls: "text-rose-600 dark:text-rose-400" },
      S: { label: "Stop", cls: "text-gray-900 dark:text-white" },
    }),
    []
  );

  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "info" = "success") => {
      setToast({ msg, type });
      window.setTimeout(() => setToast(null), 2500);
    },
    []
  );

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const sendRawMessage = useCallback((payload: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
      return true;
    }
    return false;
  }, []);

  const sendCmd = useCallback(
    (cmd: string) => {
      if (!connected) return;

      // Bot wiring is physically reversed, so we swap left/right before sending.
      const outgoing = cmd === "L" ? "R" : cmd === "R" ? "L" : cmd;

      clearStopTimer();
      if (sendRawMessage(`MoveCar,${outgoing === "F" ? 1 : outgoing === "B" ? 2 : outgoing === "L" ? 3 : outgoing === "R" ? 4 : 0}`)) {
        setLastCmd(cmd);
      }
    },
    [connected, sendRawMessage]
  );

  const stopBot = useCallback(() => {
    clearStopTimer();
    if (connected) {
      sendRawMessage("MoveCar,0");
    }
    setLastCmd("S");
  }, [connected, sendRawMessage]);

  const connectWifi = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setConnecting(true);
    const ws = new WebSocket(ESP32_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      sendRawMessage(`Speed,${speed}`);
      showToast("ESP32 Wi-Fi connected", "success");
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
      setLastCmd("S");
    };

    ws.onerror = () => {
      setConnected(false);
      setConnecting(false);
      showToast("ESP32 not reachable. Connect to bot Wi-Fi first.", "error");
    };
  }, [sendRawMessage, showToast, speed]);

  const disconnectWifi = useCallback(() => {
    clearStopTimer();
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
    setConnecting(false);
    setLastCmd("S");
    showToast("ESP32 Wi-Fi disconnected", "info");
  }, [showToast]);

  useEffect(() => {
    connectWifi();
    return () => {
      clearStopTimer();
      wsRef.current?.close();
    };
  }, [connectWifi]);

  useEffect(() => {
    if (!connected) return;
    sendRawMessage(`Speed,${speed}`);
  }, [connected, sendRawMessage, speed]);

  useEffect(() => {
    if (!connected) return;

    const keyMap: Record<string, string> = {
      ArrowUp: "F",
      ArrowDown: "B",
      ArrowLeft: "L",
      ArrowRight: "R",
      w: "F",
      s: "B",
      a: "L",
      d: "R",
      " ": "S",
    };

    const handleDown = (e: KeyboardEvent) => {
      const cmd = keyMap[e.key];
      if (!cmd) return;
      e.preventDefault();
      sendCmd(cmd);
    };

    const handleUp = (e: KeyboardEvent) => {
      if (keyMap[e.key]) {
        stopBot();
      }
    };

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, [connected, sendCmd, stopBot]);

  const meta = cmdMeta[lastCmd as keyof typeof cmdMeta] ?? cmdMeta.S;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
              connected
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                : "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            }`}
          >
            {connected ? (
              <Wifi className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              ESP32 Wi-Fi Control
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-xs">
              {connected ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Connected to {ESP32_HOST}
                  </span>
                </>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  {connecting ? "Connecting..." : "Not connected"}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={connected ? disconnectWifi : connectWifi}
            disabled={connecting}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
              connected
                ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
            }`}
          >
            {connecting ? "Connecting..." : connected ? "Disconnect" : "Connect Wi-Fi"}
          </button>
        </div>

        {!connected && !connecting && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
            Connect your phone or laptop to the ESP32 hotspot first, then open this page and tap
            <span className="font-semibold"> Connect Wi-Fi</span>.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Last Command
          </span>
          <span className={`text-sm font-bold font-mono ${meta.cls}`}>{meta.label}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Direction Control
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <DirBtn cmd="F" enabled={connected} onCmd={sendCmd}>
            <ChevronUp className="h-6 w-6" />
          </DirBtn>
          <div className="flex items-center gap-2">
            <DirBtn cmd="R" enabled={connected} onCmd={sendCmd}>
              <ChevronLeft className="h-6 w-6" />
            </DirBtn>
            <button
              disabled={!connected}
              onPointerDown={stopBot}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all active:scale-95 ${
                connected
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600"
                  : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
              }`}
            >
              <Square className="h-5 w-5" />
            </button>
            <DirBtn cmd="L" enabled={connected} onCmd={sendCmd}>
              <ChevronRight className="h-6 w-6" />
            </DirBtn>
          </div>
          <DirBtn cmd="B" enabled={connected} onCmd={sendCmd}>
            <ChevronDown className="h-6 w-6" />
          </DirBtn>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">
          Hold to move, release to stop. Keyboard also works with WASD or arrow keys.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Speed Control</p>
        </div>

        <input
          type="range"
          min="0"
          max="255"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-emerald-500 dark:bg-gray-700"
        />
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Slow</span>
          <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{speed}</span>
          <span>Fast</span>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
        <div className="mb-2 flex items-center gap-2">
          <Router className="h-4 w-4" />
          <span className="font-semibold">How this connects</span>
        </div>
        <p className="leading-6">
          For manual control, the Next.js page talks directly to the ESP32 over Wi-Fi at
          <span className="mx-1 font-mono">{ESP32_HOST}</span>
          using the same WebSocket path as your HTML page. The Pi does not need to relay these
          movement commands in this direct manual mode.
        </p>
      </div>
    </div>
  );
}

function AutonomousTab() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
        <Cpu className="h-9 w-9 text-gray-400 dark:text-gray-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Autonomous Mode</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
          Autonomous navigation will control the bot automatically. This part is still under
          development.
        </p>
      </div>
      <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
        In Development
      </span>
    </div>
  );
}

export default function BotControlPage() {
  const [tab, setTab] = useState<"manual" | "autonomous">("manual");

  return (
    <div className="min-h-screen bg-gray-50 pb-16 transition-colors duration-200 dark:bg-gray-950">
      <div className="mx-auto max-w-lg px-5 pb-5 pt-8">
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Bot Control
          </h1>
        </div>
      </div>

      <div className="mx-auto mb-5 max-w-lg px-5">
        <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setTab("manual")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              tab === "manual"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setTab("autonomous")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              tab === "autonomous"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Autonomous
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5">
        {tab === "manual" ? <ManualTab /> : <AutonomousTab />}
      </div>
    </div>
  );
}
