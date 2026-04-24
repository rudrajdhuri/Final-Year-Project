// "use client";

// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import {
//   Bot,
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
//   ChevronUp,
//   Cpu,
//   Navigation,
//   Square,
//   Wifi,
//   WifiOff,
//   Gauge,
//   Router,
// } from "lucide-react";

// const ESP32_HOST = "192.168.4.1";
// const ESP32_HTTP_URL = `http://${ESP32_HOST}`;
// const ESP32_WS_URL = `ws://${ESP32_HOST}/CarInput`;

// function Toast({
//   message,
//   type = "success",
// }: {
//   message: string;
//   type?: "success" | "error" | "info";
// }) {
//   const colors = {
//     success:
//       "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
//     error:
//       "border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
//     info:
//       "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
//   };

//   return (
//     <div
//       className={`fixed right-5 top-5 z-50 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl ${colors[type]}`}
//     >
//       {message}
//     </div>
//   );
// }

// function DirBtn({
//   cmd,
//   enabled,
//   onCmd,
//   children,
// }: {
//   cmd: string;
//   enabled: boolean;
//   onCmd: (cmd: string) => void;
//   children: React.ReactNode;
// }) {
//   return (
//     <button
//       disabled={!enabled}
//       onPointerDown={() => onCmd(cmd)}
//       onPointerUp={() => onCmd("S")}
//       onPointerLeave={() => onCmd("S")}
//       onPointerCancel={() => onCmd("S")}
//       className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-all active:scale-95 ${
//         enabled
//           ? "border-gray-200 bg-white text-gray-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-emerald-500/30 dark:hover:bg-gray-700"
//           : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
//       }`}
//     >
//       {children}
//     </button>
//   );
// }

// function ManualTab() {
//   const wsRef = useRef<WebSocket | null>(null);
//   const stopTimerRef = useRef<number | null>(null);

//   const [connected, setConnected] = useState(false);
//   const [connecting, setConnecting] = useState(false);
//   const [speed, setSpeed] = useState(150);
//   const [lastCmd, setLastCmd] = useState("S");
//   const [toast, setToast] = useState<{
//     msg: string;
//     type: "success" | "error" | "info";
//   } | null>(null);

//   const cmdMeta = useMemo(
//     () => ({
//       F: { label: "Forward", cls: "text-emerald-600 dark:text-emerald-400" },
//       B: { label: "Backward", cls: "text-amber-600 dark:text-amber-400" },
//       L: { label: "Left", cls: "text-sky-600 dark:text-sky-400" },
//       R: { label: "Right", cls: "text-rose-600 dark:text-rose-400" },
//       S: { label: "Stop", cls: "text-gray-900 dark:text-white" },
//     }),
//     []
//   );

//   const showToast = useCallback(
//     (msg: string, type: "success" | "error" | "info" = "success") => {
//       setToast({ msg, type });
//       window.setTimeout(() => setToast(null), 2500);
//     },
//     []
//   );

//   const clearStopTimer = () => {
//     if (stopTimerRef.current) {
//       window.clearTimeout(stopTimerRef.current);
//       stopTimerRef.current = null;
//     }
//   };

//   const sendRawMessage = useCallback((payload: string) => {
//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       wsRef.current.send(payload);
//       return true;
//     }
//     return false;
//   }, []);

//   const sendCmd = useCallback(
//     (cmd: string) => {
//       if (!connected) return;

//       // Bot wiring is physically reversed, so we swap left/right before sending.
//       const outgoing = cmd === "L" ? "R" : cmd === "R" ? "L" : cmd;

//       clearStopTimer();
//       if (sendRawMessage(`MoveCar,${outgoing === "F" ? 1 : outgoing === "B" ? 2 : outgoing === "L" ? 3 : outgoing === "R" ? 4 : 0}`)) {
//         setLastCmd(cmd);
//       }
//     },
//     [connected, sendRawMessage]
//   );

//   const stopBot = useCallback(() => {
//     clearStopTimer();
//     if (connected) {
//       sendRawMessage("MoveCar,0");
//     }
//     setLastCmd("S");
//   }, [connected, sendRawMessage]);

//   const connectWifi = useCallback(() => {
//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

//     setConnecting(true);
//     const ws = new WebSocket(ESP32_WS_URL);
//     wsRef.current = ws;

//     ws.onopen = () => {
//       setConnected(true);
//       setConnecting(false);
//       sendRawMessage(`Speed,${speed}`);
//       showToast("ESP32 Wi-Fi connected", "success");
//     };

//     ws.onclose = () => {
//       setConnected(false);
//       setConnecting(false);
//       setLastCmd("S");
//     };

//     ws.onerror = () => {
//       setConnected(false);
//       setConnecting(false);
//       showToast("ESP32 not reachable. Connect to bot Wi-Fi first.", "error");
//     };
//   }, [sendRawMessage, showToast, speed]);

//   const disconnectWifi = useCallback(() => {
//     clearStopTimer();
//     wsRef.current?.close();
//     wsRef.current = null;
//     setConnected(false);
//     setConnecting(false);
//     setLastCmd("S");
//     showToast("ESP32 Wi-Fi disconnected", "info");
//   }, [showToast]);

//   useEffect(() => {
//     connectWifi();
//     return () => {
//       clearStopTimer();
//       wsRef.current?.close();
//     };
//   }, [connectWifi]);

//   useEffect(() => {
//     if (!connected) return;
//     sendRawMessage(`Speed,${speed}`);
//   }, [connected, sendRawMessage, speed]);

//   useEffect(() => {
//     if (!connected) return;

//     const keyMap: Record<string, string> = {
//       ArrowUp: "F",
//       ArrowDown: "B",
//       ArrowLeft: "L",
//       ArrowRight: "R",
//       w: "F",
//       s: "B",
//       a: "L",
//       d: "R",
//       " ": "S",
//     };

//     const handleDown = (e: KeyboardEvent) => {
//       const cmd = keyMap[e.key];
//       if (!cmd) return;
//       e.preventDefault();
//       sendCmd(cmd);
//     };

//     const handleUp = (e: KeyboardEvent) => {
//       if (keyMap[e.key]) {
//         stopBot();
//       }
//     };

//     window.addEventListener("keydown", handleDown);
//     window.addEventListener("keyup", handleUp);
//     return () => {
//       window.removeEventListener("keydown", handleDown);
//       window.removeEventListener("keyup", handleUp);
//     };
//   }, [connected, sendCmd, stopBot]);

//   const meta = cmdMeta[lastCmd as keyof typeof cmdMeta] ?? cmdMeta.S;

//   return (
//     <div className="space-y-4">
//       {toast && <Toast message={toast.msg} type={toast.type} />}

//       <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
//         <div className="flex items-center gap-4">
//           <div
//             className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
//               connected
//                 ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
//                 : "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
//             }`}
//           >
//             {connected ? (
//               <Wifi className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
//             ) : (
//               <WifiOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
//             )}
//           </div>

//           <div className="min-w-0 flex-1">
//             <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
//               ESP32 Wi-Fi Control
//             </p>
//             <div className="mt-0.5 flex items-center gap-2 text-xs">
//               {connected ? (
//                 <>
//                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                   <span className="text-emerald-600 dark:text-emerald-400">
//                     Connected to {ESP32_HOST}
//                   </span>
//                 </>
//               ) : (
//                 <span className="text-gray-400 dark:text-gray-500">
//                   {connecting ? "Connecting..." : "Not connected"}
//                 </span>
//               )}
//             </div>
//           </div>

//           <button
//             onClick={connected ? disconnectWifi : connectWifi}
//             disabled={connecting}
//             className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
//               connected
//                 ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
//                 : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
//             }`}
//           >
//             {connecting ? "Connecting..." : connected ? "Disconnect" : "Connect Wi-Fi"}
//           </button>
//         </div>

//         {!connected && !connecting && (
//           <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
//             Connect your phone or laptop to the ESP32 hotspot first, then open this page and tap
//             <span className="font-semibold"> Connect Wi-Fi</span>.
//           </div>
//         )}
//       </div>

//       <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
//         <div className="flex items-center justify-between">
//           <span className="text-xs font-mono uppercase tracking-widest text-gray-400 dark:text-gray-500">
//             Last Command
//           </span>
//           <span className={`text-sm font-bold font-mono ${meta.cls}`}>{meta.label}</span>
//         </div>
//       </div>

//       <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
//         <div className="mb-6 flex items-center gap-2">
//           <Navigation className="h-4 w-4 text-gray-400 dark:text-gray-500" />
//           <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
//             Direction Control
//           </p>
//         </div>

//         <div className="flex flex-col items-center gap-2">
//           <DirBtn cmd="F" enabled={connected} onCmd={sendCmd}>
//             <ChevronUp className="h-6 w-6" />
//           </DirBtn>
//           <div className="flex items-center gap-2">
//             <DirBtn cmd="R" enabled={connected} onCmd={sendCmd}>
//               <ChevronLeft className="h-6 w-6" />
//             </DirBtn>
//             <button
//               disabled={!connected}
//               onPointerDown={stopBot}
//               className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all active:scale-95 ${
//                 connected
//                   ? "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600"
//                   : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
//               }`}
//             >
//               <Square className="h-5 w-5" />
//             </button>
//             <DirBtn cmd="L" enabled={connected} onCmd={sendCmd}>
//               <ChevronRight className="h-6 w-6" />
//             </DirBtn>
//           </div>
//           <DirBtn cmd="B" enabled={connected} onCmd={sendCmd}>
//             <ChevronDown className="h-6 w-6" />
//           </DirBtn>
//         </div>

//         <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">
//           Hold to move, release to stop. Keyboard also works with WASD or arrow keys.
//         </p>
//       </div>

//       <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
//         <div className="mb-4 flex items-center gap-2">
//           <Gauge className="h-4 w-4 text-gray-400 dark:text-gray-500" />
//           <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Speed Control</p>
//         </div>

//         <input
//           type="range"
//           min="0"
//           max="255"
//           value={speed}
//           onChange={(e) => setSpeed(Number(e.target.value))}
//           className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-emerald-500 dark:bg-gray-700"
//         />
//         <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
//           <span>Slow</span>
//           <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{speed}</span>
//           <span>Fast</span>
//         </div>
//       </div>

//       <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800 shadow-sm dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
//         <div className="mb-2 flex items-center gap-2">
//           <Router className="h-4 w-4" />
//           <span className="font-semibold">How this connects</span>
//         </div>
//         <p className="leading-6">
//           For manual control, the Next.js page talks directly to the ESP32 over Wi-Fi at
//           <span className="mx-1 font-mono">{ESP32_HOST}</span>
//           using the same WebSocket path as your HTML page. The Pi does not need to relay these
//           movement commands in this direct manual mode.
//         </p>
//       </div>
//     </div>
//   );
// }

// function AutonomousTab() {
//   return (
//     <div className="flex flex-col items-center gap-5 rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
//       <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
//         <Cpu className="h-9 w-9 text-gray-400 dark:text-gray-600" />
//       </div>
//       <div>
//         <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Autonomous Mode</h2>
//         <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
//           Autonomous navigation will control the bot automatically. This part is still under
//           development.
//         </p>
//       </div>
//       <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
//         In Development
//       </span>
//     </div>
//   );
// }

// export default function BotControlPage() {
//   const [tab, setTab] = useState<"manual" | "autonomous">("manual");

//   return (
//     <div className="min-h-screen bg-gray-50 pb-16 transition-colors duration-200 dark:bg-gray-950">
//       <div className="mx-auto max-w-lg px-5 pb-5 pt-8">
//         <div className="mb-1 flex items-center gap-3">
//           <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
//             <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
//           </div>
//           <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
//             Bot Control
//           </h1>
//         </div>
//       </div>

//       <div className="mx-auto mb-5 max-w-lg px-5">
//         <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
//           <button
//             onClick={() => setTab("manual")}
//             className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
//               tab === "manual"
//                 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
//                 : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
//             }`}
//           >
//             Manual
//           </button>
//           <button
//             onClick={() => setTab("autonomous")}
//             className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
//               tab === "autonomous"
//                 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
//                 : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
//             }`}
//           >
//             Autonomous
//           </button>
//         </div>
//       </div>

//       <div className="mx-auto max-w-lg px-5">
//         {tab === "manual" ? <ManualTab /> : <AutonomousTab />}
//       </div>
//     </div>
//   );
// }



"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Wifi, WifiOff, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Square, Bot, Cpu,
  Gamepad2, Navigation, Gauge
} from "lucide-react";

// ── ESP32 IP on its own hotspot ────────────────────────────
// ESP32 hotspot owner is always 192.168.4.1
// Change this if your ESP32 uses a different IP
const ESP32_WS_URL = "ws://192.168.4.1/CarInput";

// ── His ESP32 command format ───────────────────────────────
// "MoveCar,1" = Forward
// "MoveCar,2" = Backward
// "MoveCar,3" = Left    (we send this when user taps RIGHT — L/R swap)
// "MoveCar,4" = Right   (we send this when user taps LEFT  — L/R swap)
// "MoveCar,0" = Stop
// "Speed,150" = Set speed 0–255

const CMD = {
  F: "MoveCar,2",
  B: "MoveCar,1",
  L: "MoveCar,4",  // ← SWAPPED: user presses L → send Right (4) to ESP32
  R: "MoveCar,3",  // ← SWAPPED: user presses R → send Left  (3) to ESP32
  S: "MoveCar,0",
};

/* ─────────────────── Toast ─────────────────── */
function Toast({ message, type = "success" }: {
  message: string; type?: "success" | "error" | "info"
}) {
  const colors = {
    success: "bg-white dark:bg-emerald-950 border-emerald-400 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    error:   "bg-white dark:bg-red-950   border-red-400   dark:border-red-500/40   text-red-700   dark:text-red-300",
    info:    "bg-white dark:bg-sky-950   border-sky-400   dark:border-sky-500/40   text-sky-700   dark:text-sky-300",
  };
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur-sm ${colors[type]}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-80" />
      {message}
    </div>
  );
}

/* ─────────────────── Touch Joystick ─────────────────── */
function TouchJoystick({ onCommand, enabled }: {
  onCommand: (cmd: string) => void; enabled: boolean
}) {
  const baseRef  = useRef<HTMLDivElement>(null);
  const knobRef  = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const RADIUS   = 52;

  function getOffset(touch: React.Touch) {
    const r = baseRef.current!.getBoundingClientRect();
    return {
      x: touch.clientX - r.left - r.width / 2,
      y: touch.clientY - r.top  - r.height / 2,
    };
  }

  function clamp(v: number, max: number) {
    return Math.max(-max, Math.min(max, v));
  }

  function applyKnob(rawX: number, rawY: number) {
    const x = clamp(rawX, RADIUS);
    const y = clamp(rawY, RADIUS);
    if (knobRef.current)
      knobRef.current.style.transform = `translate(${x}px, ${y}px)`;
  }

  // Joystick derives L/R/F/B — the CMD map above handles the L/R swap
  function deriveCmd(rawX: number, rawY: number): string {
    const ax = Math.abs(rawX), ay = Math.abs(rawY);
    if (ax < 18 && ay < 18) return "S";
    if (ax > ay) return rawX > 0 ? "R" : "L";
    return rawY > 0 ? "B" : "F";
  }

  function onTouchStart(e: React.TouchEvent) {
    if (!enabled) return;
    activeId.current = e.changedTouches[0].identifier;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!enabled || activeId.current === null) return;
    const touch = Array.from(e.touches).find(
      t => t.identifier === activeId.current
    );
    if (!touch) return;
    const { x, y } = getOffset(touch);
    applyKnob(x, y);
    onCommand(deriveCmd(x, y));
  }

  function onTouchEnd() {
    activeId.current = null;
    if (knobRef.current)
      knobRef.current.style.transform = "translate(0px,0px)";
    onCommand("S");
  }

  return (
    <div
      ref={baseRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: "none" }}
      className={`relative w-40 h-40 rounded-full flex items-center justify-center select-none transition-colors
        ${enabled
          ? "bg-gray-100 dark:bg-gray-800/60 border-2 border-emerald-400/40 dark:border-emerald-500/30"
          : "bg-gray-100 dark:bg-gray-900/40 border-2 border-gray-300 dark:border-gray-700/30"
        }`}
    >
      <div className="absolute inset-4 rounded-full border border-dashed border-gray-300 dark:border-gray-600/30" />
      <div
        ref={knobRef}
        style={{ transition: "transform 50ms ease-out" }}
        className={`w-14 h-14 rounded-full flex items-center justify-center
          ${enabled
            ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            : "bg-gray-300 dark:bg-gray-700"
          }`}
      >
        <Gamepad2 className={`w-5 h-5 ${enabled ? "text-white" : "text-gray-400 dark:text-gray-500"}`} />
      </div>
    </div>
  );
}

/* ─────────────────── D-Pad Button ─────────────────── */
function DirBtn({ cmd, children, enabled, onCmd }: {
  cmd: string; children: React.ReactNode; enabled: boolean; onCmd: (c: string) => void;
}) {
  return (
    <button
      disabled={!enabled}
      onPointerDown={() => onCmd(cmd)}
      onPointerUp={() => onCmd("S")}
      onPointerLeave={() => onCmd("S")}
      className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-100 select-none
        ${enabled
          ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-400/60 hover:bg-emerald-50 dark:hover:bg-gray-700 active:scale-95 text-gray-700 dark:text-gray-200 shadow-sm"
          : "bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
        }`}
    >
      {children}
    </button>
  );
}

/* ─────────────────── Manual Tab ─────────────────── */
function ManualTab() {
  const wsRef = useRef<WebSocket | null>(null);

  const [connected,  setConnected]  = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastCmd,    setLastCmd]    = useState<string>("S");
  const [speed,      setSpeed]      = useState<number>(150);
  const [toast,      setToast]      = useState<{ msg: string; type: "success"|"error"|"info" } | null>(null);

  const cmdMeta: Record<string, { label: string; cls: string }> = {
    F: { label: "Forward",  cls: "text-emerald-600 dark:text-emerald-400" },
    B: { label: "Backward", cls: "text-amber-600   dark:text-amber-400"   },
    L: { label: "Left",     cls: "text-sky-600     dark:text-sky-400"     },
    R: { label: "Right",    cls: "text-sky-600     dark:text-sky-400"     },
    S: { label: "Stop",     cls: "text-red-600     dark:text-red-400"     },
  };

  function showToast(msg: string, type: "success"|"error"|"info" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Connect WebSocket directly to ESP32 ─────────────────
  function connectWS() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setConnecting(true);

    const ws = new WebSocket(ESP32_WS_URL);

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      // Send current speed immediately on connect (matches his ESP32 behavior)
      ws.send(`Speed,${speed}`);
      showToast("Connected to AgriBot", "success");
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
      showToast("Disconnected from AgriBot", "info");
    };

    ws.onerror = () => {
      setConnected(false);
      setConnecting(false);
      showToast("Cannot reach ESP32 — are you on AgriBot hotspot?", "error");
    };

    wsRef.current = ws;
  }

  function disconnectWS() {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  // ── Send command to ESP32 ────────────────────────────────
  const sendCmd = useCallback((dir: string) => {
    if (!connected || !wsRef.current) return;
    const wsCmd = CMD[dir as keyof typeof CMD] ?? CMD.S;
    wsRef.current.send(wsCmd);
    setLastCmd(dir); // show original direction in UI (L still shows Left)
  }, [connected]);

  // ── Speed change ─────────────────────────────────────────
  function handleSpeedChange(val: number) {
    setSpeed(val);
    if (connected && wsRef.current) {
      wsRef.current.send(`Speed,${val}`);
    }
  }

  // ── Keyboard support ─────────────────────────────────────
  useEffect(() => {
    if (!connected) return;
    const map: Record<string, string> = {
      ArrowUp: "F", ArrowDown: "B", ArrowLeft: "L", ArrowRight: "R",
      w: "F", s: "B", a: "L", d: "R", " ": "S",
    };
    const down = (e: KeyboardEvent) => {
      const c = map[e.key];
      if (c) { e.preventDefault(); sendCmd(c); }
    };
    const up = (e: KeyboardEvent) => {
      if (map[e.key]) sendCmd("S");
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup",   up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup",   up);
    };
  }, [connected, sendCmd]);

  const meta = cmdMeta[lastCmd];

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* ── Connection Card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
            ${connected
              ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20"
              : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            }`}>
            {connected
              ? <Wifi className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              : <WifiOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              AgriBot ESP32
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {connected
                ? <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      Connected · {ESP32_WS_URL}
                    </span>
                  </>
                : <span className="text-xs text-gray-400 dark:text-gray-500">
                    Not connected
                  </span>
              }
            </div>
          </div>

          <button
            onClick={connected ? disconnectWS : connectWS}
            disabled={connecting}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 disabled:opacity-50
              ${connected
                ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
              }`}
          >
            {connecting ? "Connecting…" : connected ? "Disconnect" : "Connect"}
          </button>
        </div>

        {!connected && !connecting && (
          <div className="mt-4 flex gap-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-sm shrink-0">⚠</span>
            <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
              Connect your device to the <strong className="text-amber-600 dark:text-amber-400">AgriBot</strong> WiFi
              hotspot first, then tap Connect.
            </p>
          </div>
        )}
      </div>

      {/* ── Command Status ── */}
      {connected && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-5 py-3 flex items-center justify-between shadow-sm">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono uppercase tracking-widest">
            Last Command
          </span>
          <span className={`text-sm font-bold font-mono ${meta?.cls}`}>
            {meta?.label ?? "—"}
          </span>
        </div>
      )}

      {/* ── Speed Slider ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Speed Control</p>
          <span className="ml-auto text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {Math.round((speed / 255) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={255}
          step={1}
          value={speed}
          onChange={e => handleSpeedChange(Number(e.target.value))}
          disabled={!connected}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-gray-200 dark:bg-gray-700
            accent-emerald-500
            disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600 mt-1">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      {/* ── D-Pad ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Navigation className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Direction Control</p>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">
            Hold = move · Release = stop
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <DirBtn cmd="F" enabled={connected} onCmd={sendCmd}>
            <ChevronUp className="w-6 h-6" />
          </DirBtn>
          <div className="flex items-center gap-2">
            <DirBtn cmd="L" enabled={connected} onCmd={sendCmd}>
              <ChevronLeft className="w-6 h-6" />
            </DirBtn>
            <button
              disabled={!connected}
              onPointerDown={() => sendCmd("S")}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-95
                ${connected
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                  : "bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
                }`}
            >
              <Square className="w-5 h-5" />
            </button>
            <DirBtn cmd="R" enabled={connected} onCmd={sendCmd}>
              <ChevronRight className="w-6 h-6" />
            </DirBtn>
          </div>
          <DirBtn cmd="B" enabled={connected} onCmd={sendCmd}>
            <ChevronDown className="w-6 h-6" />
          </DirBtn>
        </div>

        <p className="text-center text-xs text-gray-300 dark:text-gray-700 mt-6 font-mono">
          Keyboard: W A S D  or  ↑ ← ↓ →
        </p>
      </div>

      {/* ── Touch Joystick ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Gamepad2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Touch Joystick</p>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">
            Drag in any direction
          </span>
        </div>
        <div className="flex justify-center">
          <TouchJoystick onCommand={sendCmd} enabled={connected} />
        </div>
        {!connected && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-700 mt-4">
            Connect to AgriBot hotspot to enable
          </p>
        )}
      </div>

      {/* ── How to use ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          How to use
        </p>
        <ol className="space-y-2 list-none">
          {[
            "Connect your phone/laptop to the AgriBot WiFi hotspot",
            "Open this dashboard in your browser",
            "Tap Connect — it links directly to the bot",
            "Use D-Pad, Joystick, or keyboard to drive",
            "Adjust speed with the slider above",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                {i + 1}
              </span>
              <span className="text-xs text-gray-500 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ─────────────────── Autonomous Tab ─────────────────── */
function AutonomousTab() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 flex flex-col items-center text-center gap-5 shadow-sm">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <Cpu className="w-9 h-9 text-gray-400 dark:text-gray-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Autonomous Mode</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
          The bot will navigate fields independently using sensors and AI — currently in development.
        </p>
      </div>
      <span className="text-xs bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-1.5 rounded-full">
        🚧 In Development
      </span>
    </div>
  );
}

/* ─────────────────── Page ─────────────────── */
export default function BotControlPage() {
  const [tab, setTab] = useState<"manual" | "autonomous">("manual");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 pb-16">

      {/* Header */}
      <div className="max-w-lg mx-auto px-5 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Bot Control
          </h1>
        </div>
        <p className="text-sm text-gray-500 pl-12">Manual and autonomous field navigation</p>
      </div>

      {/* Tab switcher */}
      <div className="max-w-lg mx-auto px-5 mb-5">
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1 gap-1 shadow-sm">
          <button
            onClick={() => setTab("manual")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === "manual"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            🕹️ Manual
          </button>
          <button
            onClick={() => setTab("autonomous")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === "autonomous"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            🤖 Autonomous
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-5">
        {tab === "manual" ? <ManualTab /> : <AutonomousTab />}
      </div>
    </div>
  );
}
