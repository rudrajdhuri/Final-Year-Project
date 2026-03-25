// "use client";

// import { useState, useEffect, useCallback } from "react";
// import {
//   Bluetooth, BluetoothOff, ChevronUp, ChevronDown,
//   ChevronLeft, ChevronRight, Square, Bot, Cpu
// } from "lucide-react";

// const BRIDGE = "http://localhost:5001";

// function ManualTab() {
//   const [connected,  setConnected]  = useState(false);
//   const [checking,   setChecking]   = useState(true);
//   const [lastCmd,    setLastCmd]    = useState<string | null>(null);
//   const [error,      setError]      = useState<string | null>(null);
//   const [comPort,    setComPort]    = useState("COM5");

//   const checkStatus = useCallback(async () => {
//     try {
//       const res  = await fetch(`${BRIDGE}/status`);
//       const data = await res.json();
//       setConnected(data.connected);
//       setComPort(data.port || "COM4");
//       setError(null);
//     } catch {
//       setConnected(false);
//       setError("bridge_down");
//     } finally {
//       setChecking(false);
//     }
//   }, []);

//   useEffect(() => {
//     checkStatus();
//     const id = setInterval(checkStatus, 3000);
//     return () => clearInterval(id);
//   }, [checkStatus]);

//   const sendCmd = useCallback(async (cmd: string) => {
//     if (!connected) return;
//     try {
//       await fetch(`${BRIDGE}/move`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ command: cmd }),
//       });
//       setLastCmd(cmd);
//     } catch {}
//   }, [connected]);

//   // Keyboard support
//   useEffect(() => {
//     if (!connected) return;
//     const map: Record<string, string> = {
//       ArrowUp: "F", ArrowDown: "B", ArrowLeft: "L", ArrowRight: "R",
//       w: "F", s: "B", a: "L", d: "R", " ": "S",
//     };
//     const down = (e: KeyboardEvent) => { const c = map[e.key]; if (c) { e.preventDefault(); sendCmd(c); } };
//     const up   = (e: KeyboardEvent) => { if (map[e.key]) sendCmd("S"); };
//     window.addEventListener("keydown", down);
//     window.addEventListener("keyup",   up);
//     return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
//   }, [connected, sendCmd]);

//   const cmdLabel: Record<string, string> = {
//     F: "Forward", B: "Backward", L: "Left", R: "Right", S: "Stop",
//   };

//   const DirBtn = ({ cmd, children }: { cmd: string; children: React.ReactNode }) => (
//     <button
//       disabled={!connected}
//       onPointerDown={() => sendCmd(cmd)}
//       onPointerUp={() => sendCmd("S")}
//       onPointerLeave={() => sendCmd("S")}
//       className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center
//         transition-all duration-100 active:scale-95 shadow-sm
//         ${connected
//           ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
//           : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
//         }`}
//     >
//       {children}
//     </button>
//   );

//   return (
//     <div className="space-y-4">
//       {/* Status card */}
//       <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
//         <div className="flex items-center gap-3">
//           <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
//             connected ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
//             {connected
//               ? <Bluetooth className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
//               : <BluetoothOff className="w-5 h-5 text-gray-400" />}
//           </div>
//           <div className="flex-1">
//             <p className="text-sm font-semibold text-gray-900 dark:text-white">HC-05 Bluetooth</p>
//             <p className={`text-xs ${connected ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
//               {checking ? "Checking..." : connected ? `✅ Connected via ${comPort}` : "❌ Not connected"}
//             </p>
//           </div>
//           {connected && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />}
//         </div>

//         {!connected && !checking && (
//           <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
//             🔵 Please connect <strong>HC-05</strong> Bluetooth from your device's Bluetooth settings, then it will auto-detect here.
//           </div>
//         )}
//       </div>

//       {/* D-Pad */}
//       <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
//         <div className="flex items-center gap-2 mb-6">
//           <Bot className="w-4 h-4 text-gray-500 dark:text-gray-400" />
//           <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Direction Control</p>
//           {connected && lastCmd && (
//             <span className="ml-auto text-xs font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
//               {cmdLabel[lastCmd]}
//             </span>
//           )}
//         </div>

//         <div className="flex flex-col items-center gap-2">
//           <DirBtn cmd="F"><ChevronUp className="w-7 h-7" /></DirBtn>
//           <div className="flex items-center gap-2">
//             <DirBtn cmd="L"><ChevronLeft className="w-7 h-7" /></DirBtn>
//             <button
//               disabled={!connected}
//               onPointerDown={() => sendCmd("S")}
//               className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center
//                 transition-all duration-100 active:scale-95 shadow-sm
//                 ${connected
//                   ? "bg-red-600 hover:bg-red-700 text-white"
//                   : "bg-gray-100 dark:bg-gray-800 text-gray-300 cursor-not-allowed border border-gray-200 dark:border-gray-700"
//                 }`}
//             >
//               <Square className="w-6 h-6" />
//             </button>
//             <DirBtn cmd="R"><ChevronRight className="w-7 h-7" /></DirBtn>
//           </div>
//           <DirBtn cmd="B"><ChevronDown className="w-7 h-7" /></DirBtn>
//         </div>

//         <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-5">
//           Hold to move · Release to stop · Keyboard: WASD / Arrow keys
//         </p>
//       </div>

//       {/* Info */}
//       <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
//         <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">🚀 How to use Manual Mode</h3>
//         <ol className="list-decimal pl-5 space-y-1 text-xs text-blue-800 dark:text-blue-400">
//           <li>Pair HC-05 with your device in Bluetooth settings.</li>
//           <li>Note the COM port assigned (e.g. COM5) in Device Manager → Ports.</li>
//           <li>Update <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">COM_PORT</code> in <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">bluetooth-server.js</code>.</li>
//           <li>Run: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">node bluetooth-server.js</code> in terminal.</li>
//           <li>Status turns green automatically — use D-pad to control!</li>
//         </ol>
//       </div>
//     </div>
//   );
// }

// function AutonomousTab() {
//   return (
//     <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 flex flex-col items-center text-center gap-4">
//       <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
//         <Cpu className="w-8 h-8 text-gray-400 dark:text-gray-600" />
//       </div>
//       <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Coming Soon</h2>
//       <p className="text-sm text-gray-400 dark:text-gray-600 max-w-xs">
//         Autonomous navigation mode is under development. The bot will navigate fields independently using sensors and AI.
//       </p>
//       <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
//         🚧 In Development
//       </span>
//     </div>
//   );
// }

// export default function BotControlPage() {
//   const [tab, setTab] = useState<"manual" | "autonomous">("manual");

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 pb-12">
//       <div className="max-w-2xl mx-auto px-6 pt-6 pb-4">
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bot Control</h1>
//         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manual and autonomous bot control</p>
//       </div>

//       {/* Tab switcher */}
//       <div className="max-w-2xl mx-auto px-6 mb-4">
//         <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
//           <button
//             onClick={() => setTab("manual")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
//               tab === "manual" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
//             }`}
//           >
//             🕹️ Manual
//           </button>
//           <button
//             onClick={() => setTab("autonomous")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
//               tab === "autonomous" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
//             }`}
//           >
//             🤖 Autonomous
//           </button>
//         </div>
//       </div>

//       <div className="max-w-2xl mx-auto px-6">
//         {tab === "manual" ? <ManualTab /> : <AutonomousTab />}
//       </div>
//     </div>
//   );
// }





// "use client";

// import { useState, useEffect, useCallback } from "react";
// import {
//   Bluetooth, BluetoothOff, ChevronUp, ChevronDown,
//   ChevronLeft, ChevronRight, Square, Bot, Cpu
// } from "lucide-react";

// // Dynamic bridge URL — works on laptop (localhost) and mobile (network IP)
// const BRIDGE = typeof window !== "undefined"
//   ? `http://${window.location.hostname}:5001`
//   : "http://localhost:5001";

// function ManualTab() {
//   const [connected,  setConnected]  = useState(false);
//   const [checking,   setChecking]   = useState(true);
//   const [lastCmd,    setLastCmd]    = useState<string | null>(null);
//   const [comPort,    setComPort]    = useState("COM4");

//   const checkStatus = useCallback(async () => {
//     try {
//       const bridge = typeof window !== "undefined"
//         ? `http://${window.location.hostname}:5001`
//         : "http://localhost:5001";
//       const res  = await fetch(`${bridge}/status`);
//       const data = await res.json();
//       setConnected(data.connected);
//       setComPort(data.port || "COM4");
//     } catch {
//       setConnected(false);
//     } finally {
//       setChecking(false);
//     }
//   }, []);

//   useEffect(() => {
//     checkStatus();
//     const id = setInterval(checkStatus, 3000);
//     return () => clearInterval(id);
//   }, [checkStatus]);

//   const sendCmd = useCallback(async (cmd: string) => {
//     if (!connected) return;
//     try {
//       const bridge = typeof window !== "undefined"
//         ? `http://${window.location.hostname}:5001`
//         : "http://localhost:5001";
//       await fetch(`${bridge}/move`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ command: cmd }),
//       });
//       setLastCmd(cmd);
//     } catch {}
//   }, [connected]);

//   // Keyboard support
//   useEffect(() => {
//     if (!connected) return;
//     const map: Record<string, string> = {
//       ArrowUp: "F", ArrowDown: "B", ArrowLeft: "L", ArrowRight: "R",
//       w: "F", s: "B", a: "L", d: "R", " ": "S",
//     };
//     const down = (e: KeyboardEvent) => { const c = map[e.key]; if (c) { e.preventDefault(); sendCmd(c); } };
//     const up   = (e: KeyboardEvent) => { if (map[e.key]) sendCmd("S"); };
//     window.addEventListener("keydown", down);
//     window.addEventListener("keyup",   up);
//     return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
//   }, [connected, sendCmd]);

//   const cmdLabel: Record<string, string> = {
//     F: "Forward", B: "Backward", L: "Left", R: "Right", S: "Stop",
//   };

//   const DirBtn = ({ cmd, children }: { cmd: string; children: React.ReactNode }) => (
//     <button
//       disabled={!connected}
//       onPointerDown={() => sendCmd(cmd)}
//       onPointerUp={() => sendCmd("S")}
//       onPointerLeave={() => sendCmd("S")}
//       className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center
//         transition-all duration-100 active:scale-95 shadow-sm
//         ${connected
//           ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
//           : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
//         }`}
//     >
//       {children}
//     </button>
//   );

//   return (
//     <div className="space-y-4">
//       {/* Status card */}
//       <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
//         <div className="flex items-center gap-3">
//           <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
//             connected ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
//             {connected
//               ? <Bluetooth className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
//               : <BluetoothOff className="w-5 h-5 text-gray-400" />}
//           </div>
//           <div className="flex-1">
//             <p className="text-sm font-semibold text-gray-900 dark:text-white">HC-05 Bluetooth</p>
//             <p className={`text-xs ${connected ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
//               {checking ? "Checking..." : connected ? `✅ Connected via ${comPort}` : "❌ Not connected"}
//             </p>
//           </div>
//           {connected && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />}
//         </div>

//         {!connected && !checking && (
//           <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
//             🔵 Please connect <strong>HC-05</strong> Bluetooth from your device's Bluetooth settings, then it will auto-detect here.
//           </div>
//         )}
//       </div>

//       {/* D-Pad */}
//       <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
//         <div className="flex items-center gap-2 mb-6">
//           <Bot className="w-4 h-4 text-gray-500 dark:text-gray-400" />
//           <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Direction Control</p>
//           {connected && lastCmd && (
//             <span className="ml-auto text-xs font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
//               {cmdLabel[lastCmd]}
//             </span>
//           )}
//         </div>

//         <div className="flex flex-col items-center gap-2">
//           <DirBtn cmd="F"><ChevronUp className="w-7 h-7" /></DirBtn>
//           <div className="flex items-center gap-2">
//             <DirBtn cmd="L"><ChevronLeft className="w-7 h-7" /></DirBtn>
//             <button
//               disabled={!connected}
//               onPointerDown={() => sendCmd("S")}
//               className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center
//                 transition-all duration-100 active:scale-95 shadow-sm
//                 ${connected
//                   ? "bg-red-600 hover:bg-red-700 text-white"
//                   : "bg-gray-100 dark:bg-gray-800 text-gray-300 cursor-not-allowed border border-gray-200 dark:border-gray-700"
//                 }`}
//             >
//               <Square className="w-6 h-6" />
//             </button>
//             <DirBtn cmd="R"><ChevronRight className="w-7 h-7" /></DirBtn>
//           </div>
//           <DirBtn cmd="B"><ChevronDown className="w-7 h-7" /></DirBtn>
//         </div>

//         <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-5">
//           Hold to move · Release to stop · Keyboard: WASD / Arrow keys
//         </p>
//       </div>

//       {/* Info */}
//       <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
//         <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">🚀 How to use Manual Mode</h3>
//         <ol className="list-decimal pl-5 space-y-1 text-xs text-blue-800 dark:text-blue-400">
//           <li>Pair HC-05 with your device in Bluetooth settings.</li>
//           <li>Note the COM port assigned (e.g. COM4) in Device Manager → Ports.</li>
//           <li>Update <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">COM_PORT</code> in <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">bluetooth-server.js</code>.</li>
//           <li>Run: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">node bluetooth-server.js</code> in terminal.</li>
//           <li>Status turns green automatically — use D-pad to control!</li>
//         </ol>
//       </div>
//     </div>
//   );
// }

// function AutonomousTab() {
//   return (
//     <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 flex flex-col items-center text-center gap-4">
//       <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
//         <Cpu className="w-8 h-8 text-gray-400 dark:text-gray-600" />
//       </div>
//       <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Coming Soon</h2>
//       <p className="text-sm text-gray-400 dark:text-gray-600 max-w-xs">
//         Autonomous navigation mode is under development. The bot will navigate fields independently using sensors and AI.
//       </p>
//       <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">
//         🚧 In Development
//       </span>
//     </div>
//   );
// }

// export default function BotControlPage() {
//   const [tab, setTab] = useState<"manual" | "autonomous">("manual");

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 pb-12">
//       <div className="max-w-2xl mx-auto px-6 pt-6 pb-4">
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bot Control</h1>
//         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manual and autonomous bot control</p>
//       </div>

//       <div className="max-w-2xl mx-auto px-6 mb-4">
//         <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
//           <button
//             onClick={() => setTab("manual")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
//               tab === "manual" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
//             }`}
//           >
//             🕹️ Manual
//           </button>
//           <button
//             onClick={() => setTab("autonomous")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
//               tab === "autonomous" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
//             }`}
//           >
//             🤖 Autonomous
//           </button>
//         </div>
//       </div>

//       <div className="max-w-2xl mx-auto px-6">
//         {tab === "manual" ? <ManualTab /> : <AutonomousTab />}
//       </div>
//     </div>
//   );
// }















// "use client";

// import { useState, useEffect, useRef } from "react";
// import {
//   Bluetooth,
//   BluetoothOff,
//   ChevronUp,
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
//   Square,
//   Bot,
//   Cpu
// } from "lucide-react";

// declare global {
//   interface Window {
//     btDevice: any;
//   }
// }

// function Toast({ message }: { message: string }) {
//   return (
//     <div className="fixed top-5 right-5 bg-white border border-green-500 text-green-700 px-4 py-2 rounded-lg shadow-lg z-50">
//       {message}
//     </div>
//   );
// }

// function ManualTab() {

//   const [connected,setConnected] = useState(false);
//   const [deviceName,setDeviceName] = useState("");
//   const [toast,setToast] = useState<string | null>(null);

//   const joystickRef = useRef<HTMLDivElement>(null);

//   const showToast=(msg:string)=>{
//     setToast(msg);
//     setTimeout(()=>setToast(null),3000);
//   }

//   /* Bluetooth persistence */

//   useEffect(()=>{

//     const saved = localStorage.getItem("btDeviceName");

//     if(saved){
//       setConnected(true);
//       setDeviceName(saved);
//     }

//   },[])

//   async function connectBluetooth(){

//     try{

//       const device = await (navigator as any).bluetooth.requestDevice({
//         acceptAllDevices:true
//       });

//       window.btDevice = device;

//       localStorage.setItem("btDeviceName",device.name || "HC-05");

//       setConnected(true);
//       setDeviceName(device.name || "HC-05");

//       showToast("✓ Device Connected");

//     }catch(e){
//       console.log(e);
//     }

//   }

//   function disconnectBluetooth(){

//     if(window.btDevice?.gatt?.connected){
//       window.btDevice.gatt.disconnect();
//     }

//     window.btDevice=null;

//     localStorage.removeItem("btDeviceName");

//     setConnected(false);
//     setDeviceName("");

//     showToast("Bluetooth Disconnected");

//   }

//   function sendCmd(cmd:string){

//     if(!connected) return;

//     /* Fix left right reversed */

//     if(cmd==="L") cmd="R";
//     else if(cmd==="R") cmd="L";

//     console.log("SEND:",cmd);

//   }

//   /* TOUCH JOYSTICK */

//   function handleTouch(e:any){

//     if(!connected) return;

//     const rect = joystickRef.current?.getBoundingClientRect();
//     if(!rect) return;

//     const touch = e.touches[0];

//     const x = touch.clientX - rect.left - rect.width/2;
//     const y = touch.clientY - rect.top - rect.height/2;

//     if(Math.abs(x) > Math.abs(y)){

//       if(x>20) sendCmd("R");
//       else if(x<-20) sendCmd("L");

//     }else{

//       if(y>20) sendCmd("B");
//       else if(y<-20) sendCmd("F");

//     }

//   }

//   function stopMove(){
//     sendCmd("S");
//   }

//   const DirBtn=({cmd,children}:{cmd:string,children:any})=>(

//     <button
//       disabled={!connected}
//       onPointerDown={()=>sendCmd(cmd)}
//       onPointerUp={()=>sendCmd("S")}
//       onPointerLeave={()=>sendCmd("S")}
//       className={`w-20 h-20 rounded-2xl flex items-center justify-center
//       ${connected
//       ? "bg-white border hover:border-green-400"
//       : "bg-gray-200 cursor-not-allowed"}`}
//     >
//       {children}
//     </button>

//   );

//   return(

//     <div className="space-y-6">

//       {toast && <Toast message={toast}/>}

//       {/* STATUS CARD */}

//       <div className="bg-white rounded-xl border p-5 shadow-sm">

//         <div className="flex items-center gap-3">

//           <div className={`w-9 h-9 flex items-center justify-center rounded-lg
//             ${connected ? "bg-green-100":"bg-gray-100"}`}>

//             {connected
//               ? <Bluetooth className="text-green-600"/>
//               : <BluetoothOff className="text-gray-400"/>
//             }

//           </div>

//           <div className="flex-1">

//             <p className="font-semibold">HC-05 Bluetooth</p>

//             <p className="text-xs">
//               {connected
//                 ? `Connected to ${deviceName}`
//                 : "Not connected"}
//             </p>

//           </div>

//         </div>

//         <div className="mt-4 flex gap-3">

//           {!connected && (

//             <button
//               onClick={connectBluetooth}
//               className="px-4 py-2 bg-green-600 text-white rounded-lg"
//             >
//               Connect HC-05
//             </button>

//           )}

//           {connected && (

//             <button
//               onClick={disconnectBluetooth}
//               className="px-4 py-2 bg-red-600 text-white rounded-lg"
//             >
//               Disconnect
//             </button>

//           )}

//         </div>

//       </div>

//       {/* D PAD */}

//       <div className="bg-white rounded-xl border p-6 shadow-sm">

//         <div className="flex items-center gap-2 mb-6">

//           <Bot className="w-4 h-4"/>
//           <p className="text-sm font-medium">Direction Control</p>

//         </div>

//         <div className="flex flex-col items-center gap-2">

//           <DirBtn cmd="F">
//             <ChevronUp/>
//           </DirBtn>

//           <div className="flex gap-2">

//             <DirBtn cmd="L">
//               <ChevronLeft/>
//             </DirBtn>

//             <button
//               onClick={()=>sendCmd("S")}
//               className="w-20 h-20 bg-red-600 text-white rounded-2xl flex items-center justify-center"
//             >
//               <Square/>
//             </button>

//             <DirBtn cmd="R">
//               <ChevronRight/>
//             </DirBtn>

//           </div>

//           <DirBtn cmd="B">
//             <ChevronDown/>
//           </DirBtn>

//         </div>

//       </div>

//       {/* TOUCH JOYSTICK */}

//       <div className="bg-white rounded-xl border p-6 shadow-sm">

//         <p className="text-sm mb-4 font-medium">
//           Touch Joystick
//         </p>

//         <div
//           ref={joystickRef}
//           onTouchMove={handleTouch}
//           onTouchEnd={stopMove}
//           className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center mx-auto"
//         >
//           Drag
//         </div>

//       </div>

//     </div>
//   )
// }

// function AutonomousTab(){
//   return(

//     <div className="bg-white rounded-xl border shadow-sm p-12 text-center">

//       <Cpu className="mx-auto mb-3"/>

//       <h2 className="text-lg font-semibold">Coming Soon</h2>

//       <p className="text-sm text-gray-500">
//         Autonomous navigation will control the bot automatically.
//       </p>

//     </div>

//   )
// }

// export default function BotControlPage(){

//   const [tab,setTab]=useState<"manual"|"autonomous">("manual");

//   return(

//     <div className="min-h-screen bg-gray-50 pb-12">

//       <div className="max-w-2xl mx-auto px-6 pt-6 pb-4">

//         <h1 className="text-2xl font-bold">
//           Bot Control
//         </h1>

//         <p className="text-sm text-gray-500">
//           Manual and autonomous bot control
//         </p>

//       </div>

//       <div className="max-w-2xl mx-auto px-6 mb-4">

//         <div className="inline-flex border rounded-lg p-1 gap-1 bg-white">

//           <button
//             onClick={()=>setTab("manual")}
//             className={`px-4 py-2 rounded-md text-sm
//             ${tab==="manual"?"bg-green-600 text-white":""}`}
//           >
//             🕹 Manual
//           </button>

//           <button
//             onClick={()=>setTab("autonomous")}
//             className={`px-4 py-2 rounded-md text-sm
//             ${tab==="autonomous"?"bg-green-600 text-white":""}`}
//           >
//             🤖 Autonomous
//           </button>

//         </div>

//       </div>

//       <div className="max-w-2xl mx-auto px-6">

//         {tab==="manual"
//           ? <ManualTab/>
//           : <AutonomousTab/>
//         }

//       </div>

//     </div>

//   )

// }









"use client";

import { useState, useEffect, useRef, useCallback, Touch as ReactTouch } from "react";
import {
  Bluetooth, BluetoothOff, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Square, Bot, Cpu,
  Gamepad2, Navigation
} from "lucide-react";

declare global {
  interface Window { btDevice: any; }
}

/* ─────────────────── Toast ─────────────────── */
function Toast({ message, type = "success" }: { message: string; type?: "success" | "error" | "info" }) {
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

/* ─────────────────── Joystick ─────────────────── */
function TouchJoystick({ onCommand, enabled }: { onCommand: (cmd: string) => void; enabled: boolean }) {
  const baseRef  = useRef<HTMLDivElement>(null);
  const knobRef  = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const RADIUS   = 52;

  // FIX: Using ReactTouch | Touch to satisfy TypeScript's property requirements
  function getOffset(touch: ReactTouch | Touch) {
    const r = baseRef.current!.getBoundingClientRect();
    return { x: touch.clientX - r.left - r.width / 2, y: touch.clientY - r.top - r.height / 2 };
  }

  function clamp(v: number, max: number) { return Math.max(-max, Math.min(max, v)); }

  function applyKnob(rawX: number, rawY: number) {
    const x = clamp(rawX, RADIUS);
    const y = clamp(rawY, RADIUS);
    if (knobRef.current) knobRef.current.style.transform = `translate(${x}px, ${y}px)`;
  }

  function deriveCmd(rawX: number, rawY: number) {
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
    const touch = Array.from(e.touches).find(t => t.identifier === activeId.current);
    if (!touch) return;
    const { x, y } = getOffset(touch);
    applyKnob(x, y);
    onCommand(deriveCmd(x, y));
  }

  function onTouchEnd() {
    activeId.current = null;
    if (knobRef.current) knobRef.current.style.transform = "translate(0px,0px)";
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
  const [connected,  setConnected]  = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [toast,      setToast]      = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [lastCmd,    setLastCmd]    = useState<string>("S");
  const [connecting, setConnecting] = useState(false);

  const cmdMeta: Record<string, { label: string; cls: string }> = {
    F: { label: "Forward",  cls: "text-emerald-600 dark:text-emerald-400" },
    B: { label: "Backward", cls: "text-amber-600   dark:text-amber-400"   },
    L: { label: "Left",     cls: "text-sky-600     dark:text-sky-400"     },
    R: { label: "Right",    cls: "text-red-600     dark:text-red-500"     }, // Right color set to Red
    S: { label: "Stop",     cls: "text-black       dark:text-white"       }, // Stop color dynamic
  };

  function showToast(msg: string, type: "success" | "error" | "info" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const saved = localStorage.getItem("btDeviceName");
    if (saved) { setConnected(true); setDeviceName(saved); }
  }, []);

  async function connectBluetooth() {
    setConnecting(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
      window.btDevice = device;
      localStorage.setItem("btDeviceName", device.name || "HC-05");
      setConnected(true);
      setDeviceName(device.name || "HC-05");
      showToast(`Connected to ${device.name || "HC-05"}`, "success");
    } catch {
      showToast("Connection cancelled", "error");
    } finally {
      setConnecting(false);
    }
  }

  function disconnectBluetooth() {
    if (window.btDevice?.gatt?.connected) window.btDevice.gatt.disconnect();
    window.btDevice = null;
    localStorage.removeItem("btDeviceName");
    setConnected(false);
    setDeviceName("");
    showToast("Disconnected", "info");
  }

  const sendCmd = useCallback((cmd: string) => {
    if (!connected) return;
    // Wiring swap correction
    if (cmd === "L") cmd = "R";
    else if (cmd === "R") cmd = "L";
    setLastCmd(cmd);
    console.log("CMD →", cmd);
  }, [connected]);

  useEffect(() => {
    if (!connected) return;
    const map: Record<string, string> = {
      ArrowUp: "F", ArrowDown: "B", ArrowLeft: "L", ArrowRight: "R",
      w: "F", s: "B", a: "L", d: "R", " ": "S",
    };
    const down = (e: KeyboardEvent) => { const c = map[e.key]; if (c) { e.preventDefault(); sendCmd(c); } };
    const up   = (e: KeyboardEvent) => { if (map[e.key]) sendCmd("S"); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup",   up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [connected, sendCmd]);

  const meta = cmdMeta[lastCmd];

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
            ${connected
              ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20"
              : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            }`}>
            {connected
              ? <Bluetooth className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              : <BluetoothOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {connected ? deviceName : "HC-05 Bluetooth"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {connected
                ? <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Connected via Web BLE</span>
                  </>
                : <span className="text-xs text-gray-400 dark:text-gray-500">Not connected</span>
              }
            </div>
          </div>

          <button
            onClick={connected ? disconnectBluetooth : connectBluetooth}
            disabled={connecting}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 disabled:opacity-50
              ${connected
                ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
              }`}
          >
            {connecting ? "Connecting…" : connected ? "Disconnect" : "Connect HC-05"}
          </button>
        </div>

        {!connected && !connecting && (
          <div className="mt-4 flex gap-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-sm shrink-0">⚠</span>
            <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
              Pair <strong className="text-amber-600 dark:text-amber-400">HC-05</strong> in your device's Bluetooth settings first, then tap <em>Connect HC-05</em> above.
            </p>
          </div>
        )}
      </div>

      {connected && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-5 py-3 flex items-center justify-between shadow-sm">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono uppercase tracking-widest">Last Command</span>
          <span className={`text-sm font-bold font-mono ${meta?.cls}`}>
            {meta?.label ?? "—"}
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Navigation className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Direction Control</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <DirBtn cmd="F" enabled={connected} onCmd={sendCmd}><ChevronUp className="w-6 h-6" /></DirBtn>
          <div className="flex items-center gap-2">
            {/* Swapped UI position: Right button on the left, Left button on the right */}
            <DirBtn cmd="R" enabled={connected} onCmd={sendCmd}><ChevronLeft className="w-6 h-6" /></DirBtn>
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
            <DirBtn cmd="L" enabled={connected} onCmd={sendCmd}><ChevronRight className="w-6 h-6" /></DirBtn>
          </div>
          <DirBtn cmd="B" enabled={connected} onCmd={sendCmd}><ChevronDown className="w-6 h-6" /></DirBtn>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Gamepad2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Touch Joystick</p>
        </div>
        <div className="flex justify-center">
          <TouchJoystick onCommand={sendCmd} enabled={connected} />
        </div>
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
      <div className="max-w-lg mx-auto px-5 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Bot Control</h1>
        </div>
      </div>

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

      <div className="max-w-lg mx-auto px-5">
        {tab === "manual" ? <ManualTab /> : <AutonomousTab />}
      </div>
    </div>
  );
}