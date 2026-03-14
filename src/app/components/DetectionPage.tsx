"use client";

import { useState, useRef } from "react";
import { Camera, Upload, AlertTriangle, CheckCircle, Loader2, HelpCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ─────────────────────────────────────────
// Animal Tab
// ─────────────────────────────────────────
function AnimalTab() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setSelectedImage(reader.result as string); setResult(null); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => { setSelectedImage(reader.result as string); setResult(null); };
      reader.readAsDataURL(file);
    }
  };

  const detectAnimal = async () => {
    if (!selectedImage) return;
    setDetecting(true); setResult(null);
    try {
      const res = await fetch(`${API}/api/animal/detect-animal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: selectedImage }),
      });
      setResult(await res.json());
    } catch {
      setResult({ success: false, error: "Backend connection failed" });
    } finally {
      setDetecting(false);
    }
  };

  const captureCamera = async () => {
    setDetecting(true); setResult(null); setSelectedImage(null);
    try {
      const res = await fetch(`${API}/api/animal/capture-camera`, { method: "POST" });
      const data = await res.json();
      setResult(data);
      if (data.success && data.filename)
        setSelectedImage(`${API}/api/animal/image/${data.filename}`);
    } catch {
      setResult({ success: false, error: "Camera capture failed" });
    } finally {
      setDetecting(false);
    }
  };

  const reset = () => {
    setSelectedImage(null); setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const msg: string = result?.message || "";
  const isThreat  = result?.success && msg.includes("✅ Threat") && msg.includes("Animal:");
  const isPlant   = msg.includes("Plant image given");
  const isUnclear = msg.includes("⚠");
  const isError   = result && !result.success;

  let s = {
    wrap:  "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    title: "text-emerald-800 dark:text-emerald-300",
    body:  "text-emerald-700 dark:text-emerald-400",
    icon:  <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />,
    label: "✅ All Clear",
  };
  if (isThreat)
    s = { wrap: "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20", title: "text-red-800 dark:text-red-300", body: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />, label: "⚠️ Threat Detected!" };
  else if (isUnclear || isError)
    s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: isError ? "⚠️ Error" : "⚠️ Unclear" };
  else if (isPlant)
    s = { wrap: "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", title: "text-emerald-800 dark:text-emerald-300", body: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />, label: "🌿 Plant Image Given" };

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Upload card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
        {!selectedImage ? (
          <>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 sm:p-14 text-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-gray-50 dark:bg-gray-800/40"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Click to upload or drag & drop</p>
              <p className="text-sm text-gray-400 dark:text-gray-600">PNG, JPG up to 10 MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </>
        ) : (
          <>
            <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <img src={selectedImage} alt="Preview" className="w-full max-h-80 sm:max-h-96 object-contain" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={detectAnimal} disabled={detecting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                {detecting ? <><Loader2 className="w-4 h-4 animate-spin" />Detecting...</> : <><AlertTriangle className="w-4 h-4" />Detect Threats</>}
              </button>
              <button onClick={reset} disabled={detecting}
                className="px-5 py-2.5 rounded-lg font-medium text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50">
                Reset
              </button>
            </div>
          </>
        )}
      </div>

      {/* Camera card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">📷 Or capture directly from camera</p>
        <button onClick={captureCamera} disabled={detecting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
          {detecting ? <><Loader2 className="w-4 h-4 animate-spin" />Capturing...</> : <><Camera className="w-4 h-4" />Capture from Camera</>}
        </button>
        <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-2">Pi camera on deployment</p>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border-2 ${s.wrap} p-5 transition-colors duration-200`}>
          <div className="flex items-start gap-4">
            {s.icon}
            <div className="flex-1 min-w-0">
              <p className={`text-base font-bold mb-1 ${s.title}`}>{s.label}</p>
              <p className={`text-sm mb-3 ${s.body}`}>{msg || result.error}</p>
              {isThreat && result.animal_type && result.animal_type !== "Unknown" && (
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: "Animal Type", value: result.animal_type }, { label: "Confidence", value: `${result.confidence}%` }].map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 transition-colors duration-200">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">🐾 About the Detection Model</h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-blue-800 dark:text-blue-400">
          <li>Trained deep learning model on a multi-class animal dataset.</li>
          <li>Detects common crop threats: birds, monkeys, cows, and wild animals.</li>
          <li>Processes images using computer vision on the Raspberry Pi 4.</li>
          <li>All results are saved to detection history for monitoring.</li>
        </ul>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────
// Plant Tab
// ─────────────────────────────────────────
function PlantTab() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setSelectedImage(reader.result as string); setResult(null); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => { setSelectedImage(reader.result as string); setResult(null); };
      reader.readAsDataURL(file);
    }
  };

  const detectPlant = async () => {
    if (!selectedImage) return;
    setDetecting(true); setResult(null);
    try {
      const res = await fetch(`${API}/api/plant/detect-plant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: selectedImage }),
      });
      setResult(await res.json());
    } catch {
      setResult({ success: false, error: "Backend connection failed" });
    } finally {
      setDetecting(false);
    }
  };

  const captureCamera = async () => {
    setDetecting(true); setResult(null); setSelectedImage(null);
    try {
      const res = await fetch(`${API}/api/plant/capture-camera`, { method: "POST" });
      const data = await res.json();
      setResult(data);
      if (data.success && data.filename)
        setSelectedImage(`${API}/api/plant/image/${data.filename}`);
    } catch {
      setResult({ success: false, error: "Camera capture failed" });
    } finally {
      setDetecting(false);
    }
  };

  const reset = () => {
    setSelectedImage(null); setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const msg: string = result?.message || result?.result || "";
  const isUnhealthy = msg.includes("UNHEALTHY") || (msg.includes("Threat Detected") && !msg.includes("No Threat"));
  const isAnimal    = msg.includes("Animal image given");
  const isNotPlant  = msg.includes("Not a plant");
  const isUnclear   = msg.includes("UNCLEAR") || msg.includes("Unclear");
  const isError     = result && !result.success;

  type Style = { wrap: string; title: string; body: string; icon: React.ReactNode; label: string };
  let s: Style = {
    wrap:  "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    title: "text-emerald-800 dark:text-emerald-300",
    body:  "text-emerald-700 dark:text-emerald-400",
    icon:  <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />,
    label: "✅ Healthy Plant",
  };
  if (isUnhealthy)
    s = { wrap: "border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20", title: "text-orange-800 dark:text-orange-300", body: "text-orange-700 dark:text-orange-400", icon: <AlertTriangle className="w-7 h-7 text-orange-500 shrink-0" />, label: "🌿 Unhealthy — Disease Detected" };
  else if (isAnimal)
    s = { wrap: "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20", title: "text-red-800 dark:text-red-300", body: "text-red-700 dark:text-red-400", icon: <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />, label: "⚠️ Animal Image Detected" };
  else if (isNotPlant)
    s = { wrap: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60", title: "text-gray-700 dark:text-gray-300", body: "text-gray-600 dark:text-gray-400", icon: <HelpCircle className="w-7 h-7 text-gray-400 shrink-0" />, label: "❌ Not a Plant" };
  else if (isUnclear || isError)
    s = { wrap: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20", title: "text-amber-800 dark:text-amber-300", body: "text-amber-700 dark:text-amber-400", icon: <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />, label: isError ? "⚠️ Error" : "⚠️ Unclear Image" };

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Upload card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
        {!selectedImage ? (
          <>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 sm:p-14 text-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-gray-50 dark:bg-gray-800/40"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Click to upload or drag & drop</p>
              <p className="text-sm text-gray-400 dark:text-gray-600">PNG, JPG up to 10 MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </>
        ) : (
          <>
            <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <img src={selectedImage} alt="Preview" className="w-full max-h-80 sm:max-h-96 object-contain" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={detectPlant} disabled={detecting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                {detecting ? <><Loader2 className="w-4 h-4 animate-spin" />Detecting...</> : <><AlertTriangle className="w-4 h-4" />Detect Disease</>}
              </button>
              <button onClick={reset} disabled={detecting}
                className="px-5 py-2.5 rounded-lg font-medium text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50">
                Reset
              </button>
            </div>
          </>
        )}
      </div>

      {/* Camera card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">📷 Or capture directly from camera</p>
        <button onClick={captureCamera} disabled={detecting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
          {detecting ? <><Loader2 className="w-4 h-4 animate-spin" />Capturing...</> : <><Camera className="w-4 h-4" />Capture from Camera</>}
        </button>
        <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-2">Pi camera on deployment</p>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border-2 ${s.wrap} p-5 transition-colors duration-200`}>
          <div className="flex items-start gap-4">
            {s.icon}
            <div className="flex-1 min-w-0">
              <p className={`text-base font-bold mb-1 ${s.title}`}>{s.label}</p>
              <p className={`text-sm ${s.body}`}>{msg || result.error}</p>
              {result.confidence > 0 && (
                <div className="mt-3 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 inline-block shadow-sm">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Confidence</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{result.confidence}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 transition-colors duration-200">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">🌿 About the Detection Model</h3>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-blue-800 dark:text-blue-400">
          <li>Trained on the PlantVillage dataset with 38 disease classes.</li>
          <li>Supports Apple, Corn, Grape, Tomato, Potato, Peach and more.</li>
          <li>Multi-stage pipeline: plant guard → disease classification.</li>
          <li>All results are saved to detection history for monitoring.</li>
        </ul>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────
// Main — same layout pattern as History page
// ─────────────────────────────────────────
export default function DetectionPage() {
  const [tab, setTab] = useState<"animal" | "plant">("animal");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 pb-12">

      {/* Page header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          AI Threat Detection
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Detect animal threats and plant diseases
        </p>
      </div>

      {/* Toggle — identical to History page */}
      <div className="px-6 mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
          <button
            onClick={() => setTab("animal")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
              tab === "animal"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            🐾 Animal Detection
          </button>
          <button
            onClick={() => setTab("plant")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
              tab === "plant"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            🌿 Plant Detection
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6">
        {tab === "animal" ? <AnimalTab /> : <PlantTab />}
      </div>

    </div>
  );
}