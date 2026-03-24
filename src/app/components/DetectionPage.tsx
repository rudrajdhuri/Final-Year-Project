// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useAuth, pushGuestHistory } from "./AuthContext";
// import { Camera, Upload, AlertTriangle, CheckCircle, Loader2, HelpCircle, Square } from "lucide-react";

// const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// function ResultCard({ result, mode }: { result: any; mode: "animal" | "plant" }) {
//   const msg = result?.message || result?.result || "";

//   let s = {
//     wrap:  "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
//     title: "text-emerald-800 dark:text-emerald-300",
//     body:  "text-emerald-700 dark:text-emerald-400",
//     icon:  <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />,
//     label: mode === "animal" ? "✅ All Clear" : "✅ Healthy Plant",
//   };

//   if (!result?.success) {
//     s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: "⚠️ Error" };
//   } else if (mode === "animal") {
//     if (msg.includes("✅ Threat") && msg.includes("Animal:"))
//       s = { wrap: "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20", title: "text-red-800 dark:text-red-300", body: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />, label: "⚠️ Threat Detected!" };
//     else if (msg.includes("Human detected"))
//       s = { wrap: "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20", title: "text-purple-800 dark:text-purple-300", body: "text-purple-700 dark:text-purple-400", icon: <AlertTriangle className="w-7 h-7 text-purple-500 shrink-0" />, label: "👤 Human Detected" };
//     else if (msg.includes("⚠"))
//       s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: "⚠️ Unclear" };
//   } else {
//     if (msg.includes("UNHEALTHY") || (msg.includes("Threat Detected") && !msg.includes("No Threat")))
//       s = { wrap: "border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20", title: "text-orange-800 dark:text-orange-300", body: "text-orange-700 dark:text-orange-400", icon: <AlertTriangle className="w-7 h-7 text-orange-500 shrink-0" />, label: "🌿 Disease Detected" };
//     else if (msg.includes("Animal image given"))
//       s = { wrap: "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20", title: "text-red-800 dark:text-red-300", body: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />, label: "⚠️ Animal Detected" };
//     else if (msg.includes("Not a plant"))
//       s = { wrap: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60", title: "text-gray-700 dark:text-gray-300", body: "text-gray-600 dark:text-gray-400", icon: <HelpCircle className="w-7 h-7 text-gray-400 shrink-0" />, label: "❌ Not a Plant" };
//     else if (msg.includes("UNCLEAR") || msg.includes("Unclear"))
//       s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: "⚠️ Unclear" };
//     else if (msg.includes("Human detected"))
//       s = { wrap: "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20", title: "text-purple-800 dark:text-purple-300", body: "text-purple-700 dark:text-purple-400", icon: <AlertTriangle className="w-7 h-7 text-purple-500 shrink-0" />, label: "👤 Human Detected" };
//   }

//   return (
//     <div className={`rounded-xl border-2 ${s.wrap} p-5 transition-colors duration-200`}>
//       <div className="flex items-start gap-4">
//         {s.icon}
//         <div className="flex-1 min-w-0">
//           <p className={`text-base font-bold mb-1 ${s.title}`}>{s.label}</p>
//           <p className={`text-sm mb-2 ${s.body}`}>{msg || result?.error}</p>
//           <div className="flex flex-wrap gap-3">
//             {result?.confidence > 0 && (
//               <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
//                 <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
//                 <p className="text-sm font-semibold text-gray-900 dark:text-white">{result.confidence}%</p>
//               </div>
//             )}
//             {result?.animal_type && result.animal_type !== "Unknown" && (
//               <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
//                 <p className="text-xs text-gray-500 dark:text-gray-400">Animal</p>
//                 <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{result.animal_type}</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function DetectionTab({ mode }: { mode: "animal" | "plant" }) {
//   const { user, isGuest } = useAuth();
//   const [image,        setImage]        = useState<string | null>(null);
//   const [imageMode,    setImageMode]    = useState<"upload" | "camera" | null>(null);
//   const [cameraActive, setCameraActive] = useState(false);
//   const [result,       setResult]       = useState<any>(null);
//   const [detectBusy,   setDetectBusy]   = useState(false);
//   const [singleBusy,   setSingleBusy]   = useState(false);
//   const [startingAuto, setStartingAuto] = useState(false);
//   const [autoRunning,  setAutoRunning]  = useState(false);
//   const [count,        setCount]        = useState(0);
//   const [capturing,    setCapturing]    = useState(false);
//   const maxCap = 10;
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFile = (file: File) => {
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setImage(reader.result as string);
//       setImageMode("upload");
//       setResult(null);
//     };
//     reader.readAsDataURL(file);
//   };

//   const detectImage = async () => {
//     if (!image || imageMode !== "upload") return;
//     setDetectBusy(true); setResult(null);
//     const endpoint = mode === "animal" ? "detect-animal" : "detect-plant";
//     try {
//       const res = await fetch(`${API}/api/${mode}/${endpoint}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ image_base64: image, user_id: user?.id || "guest" }),
//       });
//       const data = await res.json();
//       setResult(data);
//       if (isGuest && data.success) {
//         pushGuestHistory({ ...data, mode, timestamp: Date.now(), image_b64: data.image_b64 || image });
//       }
//     } catch {
//       setResult({ success: false, error: "Backend connection failed" });
//     } finally {
//       setDetectBusy(false);
//     }
//   };

//   const resetImage = () => {
//     setImage(null); setImageMode(null); setResult(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   useEffect(() => {
//     fetch(`${API}/api/auto/status/${mode}`)
//       .then(r => r.json())
//       .then(s => {
//         if (s.running && s.mode === mode) {
//           setAutoRunning(true);
//           setCount(s.count ?? 0);
//           const imgSrc = s.image_b64 || s.last_result?.image_b64 || null;
//           if (imgSrc) { setImage(imgSrc); setImageMode("camera"); }
//           if (s.last_result) setResult(s.last_result);
//         }
//       })
//       .catch(() => {});
//   }, [mode]);

//   useEffect(() => {
//     if (!autoRunning) return;
//     const id = setInterval(async () => {
//       try {
//         const res  = await fetch(`${API}/api/auto/status/${mode}`);
//         const data = await res.json();
//         if (data.count > count) {
//           setCount(data.count);
//           setCapturing(false);
//           if (data.last_result) {
//             const imgSrc = data.image_b64 || data.last_result.image_b64 || null;
//             if (imgSrc) { setImage(imgSrc); setImageMode("camera"); setCameraActive(false); }
//             setResult(data.last_result);
//             if (isGuest) pushGuestHistory({ ...data.last_result, mode, timestamp: Date.now(), image_b64: imgSrc || "" });
//           }
//         } else if (data.running) {
//           setCapturing(true);
//         }
//         if (!data.running) {
//           setAutoRunning(false); setCapturing(false); setStartingAuto(false);
//         }
//       } catch {}
//     }, 2000);
//     return () => clearInterval(id);
//   }, [autoRunning, count]);

//   const singleCapture = async () => {
//     setSingleBusy(true); setResult(null);
//     setImage(null); setImageMode(null); setCameraActive(true);
//     try {
//       const res  = await fetch(`${API}/api/${mode}/capture-camera`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ user_id: user?.id || "guest" }),
//       });
//       const data = await res.json();
//       setResult(data);
//       if (data.success && data.filename) {
//         setImage(data.image_b64 || `${API}/api/${mode}/image/${data.filename}?t=${Date.now()}`);
//         setImageMode("camera");
//         if (isGuest) pushGuestHistory({ ...data, mode, timestamp: Date.now() });
//       }
//     } catch {
//       setResult({ success: false, error: "Camera capture failed" });
//     } finally {
//       setSingleBusy(false); setCameraActive(false);
//     }
//   };

//   const startAuto = async () => {
//     setStartingAuto(true);
//     try {
//       const res  = await fetch(`${API}/api/auto/start/${mode}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ user_id: user?.id || "guest" }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         setAutoRunning(true); setCapturing(true); setCameraActive(true);
//         setCount(0); setImage(null); setImageMode(null); setResult(null);
//       }
//     } catch {}
//     finally { setStartingAuto(false); }
//   };

//   const stopAuto = async () => {
//     await fetch(`${API}/api/auto/stop/${mode}`, { method: "POST" });
//     setAutoRunning(false); setCapturing(false); setCameraActive(false);
//   };

//   const dots = Array.from({ length: maxCap }, (_, i) => i < count);

//   return (
//     <div className="max-w-4xl mx-auto space-y-5">
//       <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200 space-y-4">

//         <div
//           className={`border-2 border-dashed rounded-xl overflow-hidden min-h-52 flex items-center justify-center transition-colors duration-200 ${
//             image ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40" :
//             autoRunning ? "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40" :
//             "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500"
//           }`}
//           onClick={() => { if (!image && !autoRunning && !singleBusy) fileInputRef.current?.click(); }}
//           onDrop={(e) => { e.preventDefault(); if (!autoRunning && !singleBusy) { const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleFile(f); } }}
//           onDragOver={(e) => e.preventDefault()}
//         >
//           {image ? (
//             <div className="relative w-full">
//               <img src={image} alt="Preview" className="w-full max-h-80 object-contain" />
//               {autoRunning && (
//                 <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1.5">
//                   <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
//                   #{count}
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="text-center py-6 px-4 pointer-events-none">
//               {cameraActive || autoRunning ? (
//                 <>
//                   <Camera className="w-12 h-12 mx-auto mb-3 text-blue-400 dark:text-blue-500 animate-pulse" />
//                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
//                     {autoRunning ? "Capturing from Pi camera..." : "Capturing from camera..."}
//                   </p>
//                   {autoRunning && <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Auto mode active</p>}
//                 </>
//               ) : (
//                 <>
//                   <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
//                   <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Click to upload or drag & drop</p>
//                   <p className="text-sm text-gray-400 dark:text-gray-600">PNG, JPG up to 10 MB</p>
//                 </>
//               )}
//             </div>
//           )}
//         </div>
//         <input ref={fileInputRef} type="file" accept="image/*"
//           onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

//         {image && imageMode === "upload" && (
//           <div className="flex gap-2">
//             <button onClick={detectImage} disabled={detectBusy}
//               className="flex-1 min-w-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
//               {detectBusy
//                 ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" /><span className="truncate">Detecting...</span></>
//                 : <><AlertTriangle className="w-4 h-4 shrink-0" /><span className="truncate">{mode === "animal" ? "Detect Threats" : "Detect Disease"}</span></>}
//             </button>
//             <button onClick={resetImage}
//               className="px-4 py-2.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors shrink-0">
//               Reset
//             </button>
//           </div>
//         )}

//         {image && imageMode === "camera" && !autoRunning && (
//           <div className="flex justify-end">
//             <button onClick={resetImage}
//               className="px-4 py-2.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors">
//               Reset
//             </button>
//           </div>
//         )}

//         <div className="flex items-center gap-2">
//           <Camera className="w-4 h-4 text-gray-500 dark:text-gray-400" />
//           <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Camera Detection</p>
//         </div>

//         {/* FIX 6: flex-col on mobile so buttons stack and text wraps naturally */}
//         {!autoRunning ? (
//           <div className="flex flex-col sm:flex-row gap-2">
//             <button onClick={singleCapture} disabled={singleBusy}
//               className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
//               {singleBusy
//                 ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Capturing...</>
//                 : <><Camera className="w-4 h-4 shrink-0" />Capture from Camera</>}
//             </button>
//             <button onClick={startAuto} disabled={startingAuto}
//               className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
//               {startingAuto
//                 ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Starting...</>
//                 : <>▶ Start Auto Capture</>}
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-2">
//             <div className="flex items-center justify-between text-xs px-0.5">
//               <div className="flex items-center gap-1.5">
//                 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
//                 <span className="font-medium text-gray-700 dark:text-gray-200">Auto Running</span>
//               </div>
//               <span className="font-mono text-gray-500 dark:text-gray-400">{count}/{maxCap} · ~{(maxCap - count) * 30}s left</span>
//             </div>
//             <div className="flex gap-1.5">
//               {dots.map((done, i) => (
//                 <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
//                   done ? "bg-emerald-500" : i === count && capturing ? "bg-blue-500 animate-pulse" : "bg-gray-200 dark:bg-gray-700"
//                 }`} />
//               ))}
//             </div>
//             <button onClick={stopAuto}
//               className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
//               <Square className="w-4 h-4" /> Stop Auto Capture
//             </button>
//           </div>
//         )}
//       </div>

//       {result && <ResultCard result={result} mode={mode} />}

//       <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 transition-colors duration-200">
//         <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
//           {mode === "animal" ? "🐾 About the Animal Model" : "🌿 About the Plant Model"}
//         </h3>
//         <ul className="list-disc pl-5 space-y-1.5 text-sm text-blue-800 dark:text-blue-400">
//           {mode === "animal" ? <>
//             <li>Trained deep learning model on a multi-class animal dataset.</li>
//             <li>Detects crop threats: birds, monkeys, cows, and wild animals.</li>
//             <li>Processes images using computer vision on the Raspberry Pi 4.</li>
//             <li>All results are saved to detection history for monitoring.</li>
//           </> : <>
//             <li>Trained on the PlantVillage dataset with 38 disease classes.</li>
//             <li>Supports Apple, Corn, Grape, Tomato, Potato, Peach and more.</li>
//             <li>Multi-stage pipeline: plant guard → disease classification.</li>
//             <li>All results are saved to detection history for monitoring.</li>
//           </>}
//         </ul>
//       </div>
//     </div>
//   );
// }

// export default function DetectionPage() {
//   const [tab, setTab] = useState<"animal" | "plant">("animal");

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 pb-12">
//       {/* FIX 5: max-w-4xl mx-auto aligns heading with content below */}
//       <div className="px-6 pt-6 pb-4 max-w-4xl mx-auto">
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Threat Detection</h1>
//         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detect animal threats and plant diseases</p>
//       </div>
//       <div className="px-6 mb-6 max-w-4xl mx-auto">
//         <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
//           <button onClick={() => setTab("animal")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${tab === "animal" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
//             🐾 Animal Detection
//           </button>
//           <button onClick={() => setTab("plant")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${tab === "plant" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
//             🌿 Plant Detection
//           </button>
//         </div>
//       </div>
//       <div className="px-6">
//         <DetectionTab key={tab} mode={tab} />
//       </div>
//     </div>
//   );
// }













// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useAuth, pushGuestHistory } from "./AuthContext";
// import { Camera, Upload, AlertTriangle, CheckCircle, Loader2, HelpCircle, Square, Bot } from "lucide-react";

// const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// function ResultCard({ result, mode }: { result: any; mode: "animal" | "plant" }) {
//   const msg = result?.message || result?.result || "";
//   let s = {
//     wrap:  "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
//     title: "text-emerald-800 dark:text-emerald-300",
//     body:  "text-emerald-700 dark:text-emerald-400",
//     icon:  <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />,
//     label: mode === "animal" ? "✅ All Clear" : "✅ Healthy Plant",
//   };
//   if (!result?.success) {
//     s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: "⚠️ Error" };
//   } else if (mode === "animal") {
//     if (msg.includes("✅ Threat") && msg.includes("Animal:"))
//       s = { wrap: "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20", title: "text-red-800 dark:text-red-300", body: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />, label: "⚠️ Threat Detected!" };
//     else if (msg.includes("Human detected"))
//       s = { wrap: "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20", title: "text-purple-800 dark:text-purple-300", body: "text-purple-700 dark:text-purple-400", icon: <AlertTriangle className="w-7 h-7 text-purple-500 shrink-0" />, label: "👤 Human Detected" };
//     else if (msg.includes("⚠"))
//       s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: "⚠️ Unclear" };
//   } else {
//     if (msg.includes("UNHEALTHY") || (msg.includes("Threat Detected") && !msg.includes("No Threat")))
//       s = { wrap: "border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20", title: "text-orange-800 dark:text-orange-300", body: "text-orange-700 dark:text-orange-400", icon: <AlertTriangle className="w-7 h-7 text-orange-500 shrink-0" />, label: "🌿 Disease Detected" };
//     else if (msg.includes("Animal image given"))
//       s = { wrap: "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20", title: "text-red-800 dark:text-red-300", body: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />, label: "⚠️ Animal Detected" };
//     else if (msg.includes("Not a plant"))
//       s = { wrap: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60", title: "text-gray-700 dark:text-gray-300", body: "text-gray-600 dark:text-gray-400", icon: <HelpCircle className="w-7 h-7 text-gray-400 shrink-0" />, label: "❌ Not a Plant" };
//     else if (msg.includes("UNCLEAR") || msg.includes("Unclear"))
//       s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: "⚠️ Unclear" };
//     else if (msg.includes("Human detected"))
//       s = { wrap: "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20", title: "text-purple-800 dark:text-purple-300", body: "text-purple-700 dark:text-purple-400", icon: <AlertTriangle className="w-7 h-7 text-purple-500 shrink-0" />, label: "👤 Human Detected" };
//   }
//   return (
//     <div className={`rounded-xl border-2 ${s.wrap} p-5 transition-colors duration-200`}>
//       <div className="flex items-start gap-4">
//         {s.icon}
//         <div className="flex-1 min-w-0">
//           <p className={`text-base font-bold mb-1 ${s.title}`}>{s.label}</p>
//           <p className={`text-sm mb-2 ${s.body}`}>{msg || result?.error}</p>
//           <div className="flex flex-wrap gap-3">
//             {result?.confidence > 0 && (
//               <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
//                 <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
//                 <p className="text-sm font-semibold text-gray-900 dark:text-white">{result.confidence}%</p>
//               </div>
//             )}
//             {result?.animal_type && result.animal_type !== "Unknown" && (
//               <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
//                 <p className="text-xs text-gray-500 dark:text-gray-400">Animal</p>
//                 <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{result.animal_type}</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function DetectionTab({ mode }: { mode: "animal" | "plant" }) {
//   const { user, isGuest } = useAuth();
//   const [image,        setImage]        = useState<string | null>(null);
//   const [imageMode,    setImageMode]    = useState<"upload" | "camera" | null>(null);
//   const [cameraActive, setCameraActive] = useState(false);
//   const [result,       setResult]       = useState<any>(null);
//   const [detectBusy,   setDetectBusy]   = useState(false);
//   const [singleBusy,   setSingleBusy]   = useState(false);
//   const [startingAuto, setStartingAuto] = useState(false);
//   const [autoRunning,  setAutoRunning]  = useState(false);
//   const [count,        setCount]        = useState(0);
//   const [capturing,    setCapturing]    = useState(false);
//   const maxCap = 10;
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFile = (file: File) => {
//     const reader = new FileReader();
//     reader.onloadend = () => { setImage(reader.result as string); setImageMode("upload"); setResult(null); };
//     reader.readAsDataURL(file);
//   };

//   const detectImage = async () => {
//     if (!image || imageMode !== "upload") return;
//     setDetectBusy(true); setResult(null);
//     const endpoint = mode === "animal" ? "detect-animal" : "detect-plant";
//     try {
//       const res = await fetch(`${API}/api/${mode}/${endpoint}`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ image_base64: image, user_id: user?.id || "guest" }),
//       });
//       const data = await res.json();
//       setResult(data);
//       if (isGuest && data.success) pushGuestHistory({ ...data, mode, timestamp: Date.now(), image_b64: data.image_b64 || image });
//     } catch { setResult({ success: false, error: "Backend connection failed" }); }
//     finally { setDetectBusy(false); }
//   };

//   const resetImage = () => {
//     setImage(null); setImageMode(null); setResult(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   useEffect(() => {
//     fetch(`${API}/api/auto/status/${mode}`)
//       .then(r => r.json())
//       .then(s => {
//         if (s.running && s.mode === mode) {
//           setAutoRunning(true); setCount(s.count ?? 0);
//           const imgSrc = s.image_b64 || s.last_result?.image_b64 || null;
//           if (imgSrc) { setImage(imgSrc); setImageMode("camera"); }
//           if (s.last_result) setResult(s.last_result);
//         }
//       }).catch(() => {});
//   }, [mode]);

//   useEffect(() => {
//     if (!autoRunning) return;
//     const id = setInterval(async () => {
//       try {
//         const res = await fetch(`${API}/api/auto/status/${mode}`);
//         const data = await res.json();
//         if (data.count > count) {
//           setCount(data.count); setCapturing(false);
//           if (data.last_result) {
//             const imgSrc = data.image_b64 || data.last_result.image_b64 || null;
//             if (imgSrc) { setImage(imgSrc); setImageMode("camera"); setCameraActive(false); }
//             setResult(data.last_result);
//             if (isGuest) pushGuestHistory({ ...data.last_result, mode, timestamp: Date.now(), image_b64: imgSrc || "" });
//           }
//         } else if (data.running) { setCapturing(true); }
//         if (!data.running) { setAutoRunning(false); setCapturing(false); setStartingAuto(false); }
//       } catch {}
//     }, 2000);
//     return () => clearInterval(id);
//   }, [autoRunning, count]);

//   // ── Animal: Pi cam capture (calls /capture-camera on Pi) ──
//   const singleCaptureAnimal = async () => {
//     setSingleBusy(true); setResult(null);
//     setImage(null); setImageMode(null); setCameraActive(true);
//     try {
//       const res = await fetch(`${API}/api/animal/capture-camera`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ user_id: user?.id || "guest" }),
//       });
//       const data = await res.json();
//       setResult(data);
//       if (data.success) {
//         setImage(data.image_b64 || `${API}/api/animal/image/${data.filename}?t=${Date.now()}`);
//         setImageMode("camera");
//         if (isGuest) pushGuestHistory({ ...data, mode: "animal", timestamp: Date.now() });
//       }
//     } catch { setResult({ success: false, error: "Bot camera capture failed" }); }
//     finally { setSingleBusy(false); setCameraActive(false); }
//   };

//   // ── Plant: Browser/device camera capture ──
//   const singleCapturePlant = async () => {
//     setSingleBusy(true); setResult(null);
//     setImage(null); setImageMode(null); setCameraActive(true);
//     try {
//       // Use browser getUserMedia to capture from device camera
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
//       const video = document.createElement("video");
//       video.srcObject = stream;
//       video.setAttribute("playsinline", "true");
//       await video.play();

//       // Wait a moment for camera to adjust
//       await new Promise(r => setTimeout(r, 500));

//       const canvas = document.createElement("canvas");
//       canvas.width  = video.videoWidth;
//       canvas.height = video.videoHeight;
//       canvas.getContext("2d")!.drawImage(video, 0, 0);

//       // Stop stream
//       stream.getTracks().forEach(t => t.stop());

//       const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);
//       setImage(imageBase64);
//       setImageMode("camera");

//       // Send to Flask
//       const res = await fetch(`${API}/api/plant/capture-camera`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ image_base64: imageBase64, user_id: user?.id || "guest" }),
//       });
//       const data = await res.json();
//       setResult(data);
//       if (data.success) {
//         if (data.image_b64) setImage(data.image_b64);
//         if (isGuest) pushGuestHistory({ ...data, mode: "plant", timestamp: Date.now() });
//       }
//     } catch (err: any) {
//       setResult({ success: false, error: err?.message || "Camera access failed. Please allow camera permission." });
//       setImage(null); setImageMode(null);
//     }
//     finally { setSingleBusy(false); setCameraActive(false); }
//   };

//   const startAuto = async () => {
//     setStartingAuto(true);
//     try {
//       const res = await fetch(`${API}/api/auto/start/${mode}`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ user_id: user?.id || "guest" }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         setAutoRunning(true); setCapturing(true); setCameraActive(true);
//         setCount(0); setImage(null); setImageMode(null); setResult(null);
//       }
//     } catch {}
//     finally { setStartingAuto(false); }
//   };

//   const stopAuto = async () => {
//     await fetch(`${API}/api/auto/stop/${mode}`, { method: "POST" });
//     setAutoRunning(false); setCapturing(false); setCameraActive(false);
//   };

//   const dots = Array.from({ length: maxCap }, (_, i) => i < count);

//   return (
//     <div className="max-w-4xl mx-auto space-y-5">
//       <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200 space-y-4">

//         <div
//           className={`border-2 border-dashed rounded-xl overflow-hidden min-h-52 flex items-center justify-center transition-colors duration-200 ${
//             image ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40" :
//             autoRunning ? "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40" :
//             "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500"
//           }`}
//           onClick={() => { if (!image && !autoRunning && !singleBusy) fileInputRef.current?.click(); }}
//           onDrop={(e) => { e.preventDefault(); if (!autoRunning && !singleBusy) { const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleFile(f); } }}
//           onDragOver={(e) => e.preventDefault()}
//         >
//           {image ? (
//             <div className="relative w-full">
//               <img src={image} alt="Preview" className="w-full max-h-80 object-contain" />
//               {autoRunning && (
//                 <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1.5">
//                   <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />#{count}
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="text-center py-6 px-4 pointer-events-none">
//               {cameraActive || autoRunning ? (
//                 <>
//                   <Camera className="w-12 h-12 mx-auto mb-3 text-blue-400 dark:text-blue-500 animate-pulse" />
//                   <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
//                     {autoRunning ? "Capturing from Pi camera..." : mode === "animal" ? "Capturing from bot camera..." : "Opening device camera..."}
//                   </p>
//                   {autoRunning && <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Auto mode active</p>}
//                 </>
//               ) : (
//                 <>
//                   <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
//                   <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Click to upload or drag & drop</p>
//                   <p className="text-sm text-gray-400 dark:text-gray-600">PNG, JPG up to 10 MB</p>
//                 </>
//               )}
//             </div>
//           )}
//         </div>
//         <input ref={fileInputRef} type="file" accept="image/*"
//           onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

//         {image && imageMode === "upload" && (
//           <div className="flex gap-2">
//             <button onClick={detectImage} disabled={detectBusy}
//               className="flex-1 min-w-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
//               {detectBusy
//                 ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" /><span className="truncate">Detecting...</span></>
//                 : <><AlertTriangle className="w-4 h-4 shrink-0" /><span className="truncate">{mode === "animal" ? "Detect Threats" : "Detect Disease"}</span></>}
//             </button>
//             <button onClick={resetImage}
//               className="px-4 py-2.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors shrink-0">
//               Reset
//             </button>
//           </div>
//         )}

//         {image && imageMode === "camera" && !autoRunning && (
//           <div className="flex justify-end">
//             <button onClick={resetImage}
//               className="px-4 py-2.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors">
//               Reset
//             </button>
//           </div>
//         )}

//         <div className="flex items-center gap-2">
//           <Camera className="w-4 h-4 text-gray-500 dark:text-gray-400" />
//           <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Camera Detection</p>
//         </div>

//         {!autoRunning ? (
//           <div className="flex flex-col sm:flex-row gap-2">
//             {/* Capture button — Bot cam for animal, Device cam for plant */}
//             <button
//               onClick={mode === "animal" ? singleCaptureAnimal : singleCapturePlant}
//               disabled={singleBusy}
//               className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
//               {singleBusy
//                 ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Capturing...</>
//                 : mode === "animal"
//                   ? <><Bot className="w-4 h-4 shrink-0" />Capture from Camera (Bot)</>
//                   : <><Camera className="w-4 h-4 shrink-0" />Capture from Camera (Device)</>}
//             </button>
//             <button onClick={startAuto} disabled={startingAuto}
//               className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
//               {startingAuto
//                 ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Starting...</>
//                 : <>▶ Start Auto Capture</>}
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-2">
//             <div className="flex items-center justify-between text-xs px-0.5">
//               <div className="flex items-center gap-1.5">
//                 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
//                 <span className="font-medium text-gray-700 dark:text-gray-200">Auto Running</span>
//               </div>
//               <span className="font-mono text-gray-500 dark:text-gray-400">{count}/{maxCap} · ~{(maxCap - count) * 30}s left</span>
//             </div>
//             <div className="flex gap-1.5">
//               {dots.map((done, i) => (
//                 <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
//                   done ? "bg-emerald-500" : i === count && capturing ? "bg-blue-500 animate-pulse" : "bg-gray-200 dark:bg-gray-700"
//                 }`} />
//               ))}
//             </div>
//             <button onClick={stopAuto}
//               className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
//               <Square className="w-4 h-4" /> Stop Auto Capture
//             </button>
//           </div>
//         )}
//       </div>

//       {result && <ResultCard result={result} mode={mode} />}

//       <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 transition-colors duration-200">
//         <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
//           {mode === "animal" ? "🐾 About the Animal Model" : "🌿 About the Plant Model"}
//         </h3>
//         <ul className="list-disc pl-5 space-y-1.5 text-sm text-blue-800 dark:text-blue-400">
//           {mode === "animal" ? <>
//             <li>Trained deep learning model on a multi-class animal dataset.</li>
//             <li>Detects crop threats: birds, monkeys, cows, and wild animals.</li>
//             <li>Processes images using computer vision on the Raspberry Pi 4.</li>
//             <li>All results are saved to detection history for monitoring.</li>
//           </> : <>
//             <li>Trained on the PlantVillage dataset with 38 disease classes.</li>
//             <li>Supports Apple, Corn, Grape, Tomato, Potato, Peach and more.</li>
//             <li>Multi-stage pipeline: plant guard → disease classification.</li>
//             <li>All results are saved to detection history for monitoring.</li>
//           </>}
//         </ul>
//       </div>
//     </div>
//   );
// }

// export default function DetectionPage() {
//   const [tab, setTab] = useState<"animal" | "plant">("animal");
//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 pb-12">
//       <div className="px-6 pt-6 pb-4 max-w-4xl mx-auto">
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Threat Detection</h1>
//         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detect animal threats and plant diseases</p>
//       </div>
//       <div className="px-6 mb-6 max-w-4xl mx-auto">
//         <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
//           <button onClick={() => setTab("animal")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${tab === "animal" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
//             🐾 Animal Detection
//           </button>
//           <button onClick={() => setTab("plant")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${tab === "plant" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
//             🌿 Plant Detection
//           </button>
//         </div>
//       </div>
//       <div className="px-6">
//         <DetectionTab key={tab} mode={tab} />
//       </div>
//     </div>
//   );
// }






















"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, pushGuestHistory } from "./AuthContext";
import { Camera, Upload, AlertTriangle, CheckCircle, Loader2, HelpCircle, Square, Bot } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

function ResultCard({ result, mode }: { result: any; mode: "animal" | "plant" }) {
  const msg = result?.message || result?.result || "";
  let s = {
    wrap:  "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    title: "text-emerald-800 dark:text-emerald-300",
    body:  "text-emerald-700 dark:text-emerald-400",
    icon:  <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />,
    label: mode === "animal" ? "✅ All Clear" : "✅ Healthy Plant",
  };
  if (!result?.success) {
    s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: "⚠️ Error" };
  } else if (mode === "animal") {
    if (msg.includes("✅ Threat") && msg.includes("Animal:"))
      s = { wrap: "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20", title: "text-red-800 dark:text-red-300", body: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />, label: "⚠️ Threat Detected!" };
    else if (msg.includes("Human detected"))
      s = { wrap: "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20", title: "text-purple-800 dark:text-purple-300", body: "text-purple-700 dark:text-purple-400", icon: <AlertTriangle className="w-7 h-7 text-purple-500 shrink-0" />, label: "👤 Human Detected" };
    else if (msg.includes("⚠"))
      s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: "⚠️ Unclear" };
  } else {
    if (msg.includes("UNHEALTHY") || (msg.includes("Threat Detected") && !msg.includes("No Threat")))
      s = { wrap: "border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20", title: "text-orange-800 dark:text-orange-300", body: "text-orange-700 dark:text-orange-400", icon: <AlertTriangle className="w-7 h-7 text-orange-500 shrink-0" />, label: "🌿 Disease Detected" };
    else if (msg.includes("Animal image given"))
      s = { wrap: "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20", title: "text-red-800 dark:text-red-300", body: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />, label: "⚠️ Animal Detected" };
    else if (msg.includes("Not a plant"))
      s = { wrap: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60", title: "text-gray-700 dark:text-gray-300", body: "text-gray-600 dark:text-gray-400", icon: <HelpCircle className="w-7 h-7 text-gray-400 shrink-0" />, label: "❌ Not a Plant" };
    else if (msg.includes("UNCLEAR") || msg.includes("Unclear"))
      s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: "⚠️ Unclear" };
    else if (msg.includes("Human detected"))
      s = { wrap: "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20", title: "text-purple-800 dark:text-purple-300", body: "text-purple-700 dark:text-purple-400", icon: <AlertTriangle className="w-7 h-7 text-purple-500 shrink-0" />, label: "👤 Human Detected" };
  }
  return (
    <div className={`rounded-xl border-2 ${s.wrap} p-5 transition-colors duration-200`}>
      <div className="flex items-start gap-4">
        {s.icon}
        <div className="flex-1 min-w-0">
          <p className={`text-base font-bold mb-1 ${s.title}`}>{s.label}</p>
          <p className={`text-sm mb-2 ${s.body}`}>{msg || result?.error}</p>
          <div className="flex flex-wrap gap-3">
            {result?.confidence > 0 && (
              <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{result.confidence}%</p>
              </div>
            )}
            {result?.animal_type && result.animal_type !== "Unknown" && (
              <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">Animal</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{result.animal_type}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetectionTab({ mode }: { mode: "animal" | "plant" }) {
  const { user, isGuest } = useAuth();
  const [image,        setImage]        = useState<string | null>(null);
  const [imageMode,    setImageMode]    = useState<"upload" | "camera" | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [result,       setResult]       = useState<any>(null);
  const [detectBusy,   setDetectBusy]   = useState(false);
  const [singleBusy,   setSingleBusy]   = useState(false);
  const [startingAuto, setStartingAuto] = useState(false);
  const [autoRunning,  setAutoRunning]  = useState(false);
  const [count,        setCount]        = useState(0);
  const [capturing,    setCapturing]    = useState(false);
  const maxCap = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => { setImage(reader.result as string); setImageMode("upload"); setResult(null); };
    reader.readAsDataURL(file);
  };

  const detectImage = async () => {
    if (!image || imageMode !== "upload") return;
    setDetectBusy(true); setResult(null);
    const endpoint = mode === "animal" ? "detect-animal" : "detect-plant";
    try {
      const res = await fetch(`${API}/api/${mode}/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: image, user_id: user?.id || "guest" }),
      });
      const data = await res.json();
      setResult(data);
      if (isGuest && data.success) pushGuestHistory({ ...data, mode, timestamp: Date.now(), image_b64: data.image_b64 || image });
    } catch { setResult({ success: false, error: "Backend connection failed" }); }
    finally { setDetectBusy(false); }
  };

  const resetImage = () => {
    setImage(null); setImageMode(null); setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    fetch(`${API}/api/auto/status/${mode}`)
      .then(r => r.json())
      .then(s => {
        if (s.running && s.mode === mode) {
          setAutoRunning(true); setCount(s.count ?? 0);
          const imgSrc = s.image_b64 || s.last_result?.image_b64 || null;
          if (imgSrc) { setImage(imgSrc); setImageMode("camera"); }
          if (s.last_result) setResult(s.last_result);
        }
      }).catch(() => {});
  }, [mode]);

  useEffect(() => {
    if (!autoRunning) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/auto/status/${mode}`);
        const data = await res.json();
        if (data.count > count) {
          setCount(data.count); setCapturing(false);
          if (data.last_result) {
            const imgSrc = data.image_b64 || data.last_result.image_b64 || null;
            if (imgSrc) { setImage(imgSrc); setImageMode("camera"); setCameraActive(false); }
            setResult(data.last_result);
            if (isGuest) pushGuestHistory({ ...data.last_result, mode, timestamp: Date.now(), image_b64: imgSrc || "" });
          }
        } else if (data.running) { setCapturing(true); }
        if (!data.running) { setAutoRunning(false); setCapturing(false); setStartingAuto(false); }
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, [autoRunning, count]);

  // ── Animal: Pi cam capture (calls /capture-camera on Pi) ──
  const singleCaptureAnimal = async () => {
    setSingleBusy(true); setResult(null);
    setImage(null); setImageMode(null); setCameraActive(true);
    try {
      const res = await fetch(`${API}/api/animal/capture-camera`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id || "guest" }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setImage(data.image_b64 || `${API}/api/animal/image/${data.filename}?t=${Date.now()}`);
        setImageMode("camera");
        if (isGuest) pushGuestHistory({ ...data, mode: "animal", timestamp: Date.now() });
      }
    } catch { setResult({ success: false, error: "Bot camera capture failed" }); }
    finally { setSingleBusy(false); setCameraActive(false); }
  };

  // ── Plant: Browser/device camera capture ──
  const singleCapturePlant = async () => {
    setSingleBusy(true); setResult(null);
    setImage(null); setImageMode(null); setCameraActive(true);
    try {
      // getUserMedia requires HTTPS or localhost — check first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setResult({ success: false, error: "Camera not available on HTTP. Please use localhost or connect via HTTPS." });
        setSingleBusy(false); setCameraActive(false);
        return;
      }
      // Use browser getUserMedia to capture from device camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      // Wait a moment for camera to adjust
      await new Promise(r => setTimeout(r, 500));

      const canvas = document.createElement("canvas");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);

      // Stop stream
      stream.getTracks().forEach(t => t.stop());

      const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);
      setImage(imageBase64);
      setImageMode("camera");

      // Send to Flask
      const res = await fetch(`${API}/api/plant/capture-camera`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: imageBase64, user_id: user?.id || "guest" }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        if (data.image_b64) setImage(data.image_b64);
        if (isGuest) pushGuestHistory({ ...data, mode: "plant", timestamp: Date.now() });
      }
    } catch (err: any) {
      setResult({ success: false, error: err?.message || "Camera access failed. Please allow camera permission." });
      setImage(null); setImageMode(null);
    }
    finally { setSingleBusy(false); setCameraActive(false); }
  };

  const startAuto = async () => {
    setStartingAuto(true);
    try {
      const res = await fetch(`${API}/api/auto/start/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id || "guest" }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoRunning(true); setCapturing(true); setCameraActive(true);
        setCount(0); setImage(null); setImageMode(null); setResult(null);
      }
    } catch {}
    finally { setStartingAuto(false); }
  };

  const stopAuto = async () => {
    await fetch(`${API}/api/auto/stop/${mode}`, { method: "POST" });
    setAutoRunning(false); setCapturing(false); setCameraActive(false);
  };

  const dots = Array.from({ length: maxCap }, (_, i) => i < count);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200 space-y-4">

        <div
          className={`border-2 border-dashed rounded-xl overflow-hidden min-h-52 flex items-center justify-center transition-colors duration-200 ${
            image ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40" :
            autoRunning ? "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40" :
            "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500"
          }`}
          onClick={() => { if (!image && !autoRunning && !singleBusy) fileInputRef.current?.click(); }}
          onDrop={(e) => { e.preventDefault(); if (!autoRunning && !singleBusy) { const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleFile(f); } }}
          onDragOver={(e) => e.preventDefault()}
        >
          {image ? (
            <div className="relative w-full">
              <img src={image} alt="Preview" className="w-full max-h-80 object-contain" />
              {autoRunning && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />#{count}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 px-4 pointer-events-none">
              {cameraActive || autoRunning ? (
                <>
                  <Camera className="w-12 h-12 mx-auto mb-3 text-blue-400 dark:text-blue-500 animate-pulse" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {autoRunning ? "Capturing from Pi camera..." : mode === "animal" ? "Capturing from bot camera..." : "Opening device camera..."}
                  </p>
                  {autoRunning && <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Auto mode active</p>}
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Click to upload or drag & drop</p>
                  <p className="text-sm text-gray-400 dark:text-gray-600">PNG, JPG up to 10 MB</p>
                </>
              )}
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

        {image && imageMode === "upload" && (
          <div className="flex gap-2">
            <button onClick={detectImage} disabled={detectBusy}
              className="flex-1 min-w-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
              {detectBusy
                ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" /><span className="truncate">Detecting...</span></>
                : <><AlertTriangle className="w-4 h-4 shrink-0" /><span className="truncate">{mode === "animal" ? "Detect Threats" : "Detect Disease"}</span></>}
            </button>
            <button onClick={resetImage}
              className="px-4 py-2.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors shrink-0">
              Reset
            </button>
          </div>
        )}

        {image && imageMode === "camera" && !autoRunning && (
          <div className="flex justify-end">
            <button onClick={resetImage}
              className="px-4 py-2.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors">
              Reset
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Camera Detection</p>
        </div>

        {!autoRunning ? (
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Capture button — Bot cam for animal, Device cam for plant */}
            <button
              onClick={mode === "animal" ? singleCaptureAnimal : singleCapturePlant}
              disabled={singleBusy}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
              {singleBusy
                ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Capturing...</>
                : mode === "animal"
                  ? <><Bot className="w-4 h-4 shrink-0" />Capture from Camera (Bot)</>
                  : <><Camera className="w-4 h-4 shrink-0" />Capture from Camera (Device)</>}
            </button>
            <button onClick={startAuto} disabled={startingAuto}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
              {startingAuto
                ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Starting...</>
                : <>▶ Start Auto Capture</>}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-medium text-gray-700 dark:text-gray-200">Auto Running</span>
              </div>
              <span className="font-mono text-gray-500 dark:text-gray-400">{count}/{maxCap} · ~{(maxCap - count) * 30}s left</span>
            </div>
            <div className="flex gap-1.5">
              {dots.map((done, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                  done ? "bg-emerald-500" : i === count && capturing ? "bg-blue-500 animate-pulse" : "bg-gray-200 dark:bg-gray-700"
                }`} />
              ))}
            </div>
            <button onClick={stopAuto}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
              <Square className="w-4 h-4" /> Stop Auto Capture
            </button>
          </div>
        )}
      </div>

      {result && <ResultCard result={result} mode={mode} />}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 transition-colors duration-200">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
          {mode === "animal" ? "🐾 About the Animal Model" : "🌿 About the Plant Model"}
        </h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-blue-800 dark:text-blue-400">
          {mode === "animal" ? <>
            <li>Trained deep learning model on a multi-class animal dataset.</li>
            <li>Detects crop threats: birds, monkeys, cows, and wild animals.</li>
            <li>Processes images using computer vision on the Raspberry Pi 4.</li>
            <li>All results are saved to detection history for monitoring.</li>
          </> : <>
            <li>Trained on the PlantVillage dataset with 38 disease classes.</li>
            <li>Supports Apple, Corn, Grape, Tomato, Potato, Peach and more.</li>
            <li>Multi-stage pipeline: plant guard → disease classification.</li>
            <li>All results are saved to detection history for monitoring.</li>
          </>}
        </ul>
      </div>
    </div>
  );
}

export default function DetectionPage() {
  const [tab, setTab] = useState<"animal" | "plant">("animal");
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 pb-12">
      <div className="px-6 pt-6 pb-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Threat Detection</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detect animal threats and plant diseases</p>
      </div>
      <div className="px-6 mb-6 max-w-4xl mx-auto">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
          <button onClick={() => setTab("animal")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${tab === "animal" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
            🐾 Animal Detection
          </button>
          <button onClick={() => setTab("plant")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${tab === "plant" ? "bg-green-600 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
            🌿 Plant Detection
          </button>
        </div>
      </div>
      <div className="px-6">
        <DetectionTab key={tab} mode={tab} />
      </div>
    </div>
  );
}