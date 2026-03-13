// "use client";

// import { useState, useRef } from "react";
// import { Camera, Upload, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

// export default function AnimalDetection() {
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [detecting, setDetecting] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setSelectedImage(reader.result as string);
//         setResult(null); // Clear previous results
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const detectAnimal = async () => {

//   if (!selectedImage) return;

//   setDetecting(true);
//   setResult(null);

//   try {

//     const response = await fetch("http://127.0.0.1:5000/api/animal/detect-animal", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         image_base64: selectedImage,
//       }),
//     });

//     const data = await response.json();

//     setResult(data);

//   } catch (error) {

//     setResult({
//       success: false,
//       error: "Backend connection failed",
//     });

//   } finally {

//     setDetecting(false);

//   }

// };

//   const resetDetection = () => {
//     setSelectedImage(null);
//     setResult(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   return (
//     <div className="min-h-screen p-6">
//       <div className="max-w-4xl mx-auto">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Animal Threat Detection
//           </h1>
//           <p className="text-gray-600">
//             Upload an image to detect any animals that may threaten crops or fields
//           </p>
//         </div>

//         {/* Upload Section */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
//           <div className="flex flex-col items-center">
//             {!selectedImage ? (
//               <div className="w-full">
//                 <div
//                   className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-green-500 transition-colors bg-gray-50"
//                   onClick={() => fileInputRef.current?.click()}
//                 >
//                   <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//                   <p className="text-gray-900 mb-2 font-medium">
//                     Click to upload an image or drag and drop
//                   </p>
//                   <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
//                 </div>
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageUpload}
//                   className="hidden"
//                 />
//               </div>
//             ) : (
//               <div className="w-full">
//                 <div className="relative bg-gray-100 rounded-lg p-4 border border-gray-200">
//                   <img
//                     src={selectedImage}
//                     alt="Selected"
//                     className="w-full max-h-96 object-contain rounded-lg"
//                   />
//                 </div>
//                 <div className="flex gap-3 mt-4">
//                   <button
//                     onClick={detectAnimal}
//                     disabled={detecting}
//                     className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
//                   >
//                     {detecting ? (
//                       <>
//                         <Loader2 className="w-5 h-5 animate-spin" />
//                         Detecting...
//                       </>
//                     ) : (
//                       <>
//                         <AlertTriangle className="w-5 h-5" />
//                         Detect Threats
//                       </>
//                     )}
//                   </button>
//                   <button
//                     onClick={resetDetection}
//                     disabled={detecting}
//                     className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors border border-gray-200"
//                   >
//                     Reset
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Results Section */}
//         {result && (
//           <div
//             className={`rounded-lg shadow-sm p-6 border-2 ${
//               result.success && result.threat_detected
//                 ? "bg-red-50 border-red-400"
//                 : result.success
//                 ? "bg-green-50 border-green-400"
//                 : "bg-yellow-50 border-yellow-400"
//             }`}
//           >
//             <div className="flex items-start gap-4">
//               {result.success && result.threat_detected ? (
//                 <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
//               ) : result.success ? (
//                 <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
//               ) : (
//                 <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
//               )}
//               <div className="flex-1">
//                 <h3
//                   className={`text-xl font-bold mb-2 ${
//                     result.success && result.threat_detected
//                       ? "text-red-900"
//                       : result.success
//                       ? "text-green-900"
//                       : "text-yellow-900"
//                   }`}
//                 >
//                   {result.success && result.threat_detected
//                     ? "⚠️ Threat Detected!"
//                     : result.success
//                     ? "✅ All Clear"
//                     : "Error"}
//                 </h3>
//                 <p
//                   className={`mb-4 ${
//                     result.success && result.threat_detected
//                       ? "text-red-800"
//                       : result.success
//                       ? "text-green-800"
//                       : "text-yellow-800"
//                   }`}
//                 >
//                   {result.message || result.error}
//                 </p>
//                 {result.success && result.threat_detected && (
//                   <div className="grid grid-cols-2 gap-4 mt-4">
//                     <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
//                       <p className="text-sm text-gray-600 mb-1">Animal Type</p>
//                       <p className="text-lg font-semibold text-gray-900 capitalize">
//                         {result.animal_type}
//                       </p>
//                     </div>
//                     <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
//                       <p className="text-sm text-gray-600 mb-1">Confidence</p>
//                       <p className="text-lg font-semibold text-gray-900">
//                         {result.confidence}%
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Info Section */}
//         {/* <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5 mt-6 shadow-sm">
//           <h4 className="font-semibold text-blue-900 mb-3 text-base">
//             📋 All Animals Detected as Threats:
//           </h4>
//           <ul className="text-sm text-blue-800 space-y-1.5">
//             <li>• Birds, Cats, Dogs (common crop pests)</li>
//             <li>• Horses, Cows, Sheep (livestock)</li>
//             <li>• Elephants, Bears, Zebras, Giraffes (wildlife)</li>
//             <li>• Any animal detected will trigger an alert</li>
//           </ul>
//         </div> */}
//         <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
//   <h3 className="text-lg font-semibold text-blue-900 mb-3">
//     🐾 Animal Threat Detection Model
//   </h3>

//   <p className="text-sm text-blue-800 mb-3">
//     This system uses a trained deep learning model to identify animals that may
//     threaten crops or farmland. The model analyzes uploaded images and predicts
//     the animal present in the scene.
//   </p>

//   <ul className="list-disc pl-5 space-y-2 text-sm text-blue-800">
//     <li>The AI model is trained on a multi-class animal dataset.</li>
//     <li>It can detect common crop threats such as birds, monkeys, cows, and wild animals.</li>
//     <li>The system processes uploaded images using computer vision techniques.</li>
//     <li>If a threatening animal is detected, the system generates an alert.</li>
//     <li>All detection results are saved in the detection history for monitoring.</li>
//   </ul>
// </div>
//       </div>
//     </div>
//   );
// }



// "use client";

// import { useState, useRef } from "react";
// import { Camera, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

// export default function AnimalDetection() {
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [detecting, setDetecting] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onloadend = () => { setSelectedImage(reader.result as string); setResult(null); };
//     reader.readAsDataURL(file);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     const file = e.dataTransfer.files?.[0];
//     if (file && file.type.startsWith("image/")) {
//       const reader = new FileReader();
//       reader.onloadend = () => { setSelectedImage(reader.result as string); setResult(null); };
//       reader.readAsDataURL(file);
//     }
//   };
   
//   const detectAnimal = async () => {
//     if (!selectedImage) return;
//     setDetecting(true); setResult(null);
//     try {
//       const res = await fetch("http://127.0.0.1:5000/api/animal/detect-animal", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ image_base64: selectedImage }),
//       });
//       setResult(await res.json());
//     } catch {
//       setResult({ success: false, error: "Backend connection failed" });
//     } finally {
//       setDetecting(false);
//     }
//   };

//   const reset = () => {
//     setSelectedImage(null); setResult(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   // ── result styling ──
//   const msg: string = result?.message || "";
//   const isThreat  = result?.success && msg.includes("✅ Threat") && msg.includes("Animal:");
//   const isPlant   = msg.includes("Plant image given");
//   const isUnclear = msg.includes("⚠");
//   const isError   = result && !result.success;

//   let resultStyle = {
//     wrap:   "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
//     title:  "text-emerald-800 dark:text-emerald-300",
//     body:   "text-emerald-700 dark:text-emerald-400",
//     icon:   <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />,
//     label:  "✅ All Clear",
//   };
//   if (isThreat) {
//     resultStyle = {
//       wrap:  "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20",
//       title: "text-red-800 dark:text-red-300",
//       body:  "text-red-700 dark:text-red-400",
//       icon:  <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />,
//       label: "⚠️ Threat Detected!",
//     };
//   } else if (isUnclear || isError) {
//     resultStyle = {
//       wrap:  "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20",
//       title: "text-amber-800 dark:text-amber-300",
//       body:  "text-amber-700 dark:text-amber-400",
//       icon:  <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />,
//       label: isError ? "⚠️ Error" : "⚠️ Unclear",
//     };
//   } else if (isPlant) {
//     resultStyle = {
//       wrap:  "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
//       title: "text-emerald-800 dark:text-emerald-300",
//       body:  "text-emerald-700 dark:text-emerald-400",
//       icon:  <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />,
//       label: "🌿 Plant Image Given",
//     };
//   }

//   return (
//     <div className="min-h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
//       <div className="max-w-2xl mx-auto space-y-5">

//         {/* ── Page header ── */}
//         <div>
//           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
//             Animal Threat Detection
//           </h1>
//           <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
//             Upload an image to detect animals that may threaten crops or fields
//           </p>
//         </div>

//         {/* ── Upload card ── */}
//         <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
//           {!selectedImage ? (
//             <>
//               <div
//                 className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 sm:p-14 text-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-gray-50 dark:bg-gray-800/40"
//                 onClick={() => fileInputRef.current?.click()}
//                 onDrop={handleDrop}
//                 onDragOver={(e) => e.preventDefault()}
//               >
//                 <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
//                 <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Click to upload or drag & drop</p>
//                 <p className="text-sm text-gray-400 dark:text-gray-600">PNG, JPG up to 10 MB</p>
//               </div>
//               <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
//             </>
//           ) : (
//             <>
//               <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
//                 <img src={selectedImage} alt="Preview" className="w-full max-h-80 sm:max-h-96 object-contain" />
//               </div>
//               <div className="flex gap-3 mt-4">
//                 <button
//                   onClick={detectAnimal}
//                   disabled={detecting}
//                   className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
//                 >
//                   {detecting
//                     ? <><Loader2 className="w-4 h-4 animate-spin" /> Detecting...</>
//                     : <><AlertTriangle className="w-4 h-4" /> Detect Threats</>}
//                 </button>
//                 <button
//                   onClick={reset}
//                   disabled={detecting}
//                   className="px-5 py-2.5 rounded-lg font-medium text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50"
//                 >
//                   Reset
//                 </button>
//               </div>
//             </>
//           )}
//         </div>

//         {/* ── Result card ── */}
//         {result && (
//           <div className={`rounded-xl border-2 ${resultStyle.wrap} p-5 transition-colors duration-200`}>
//             <div className="flex items-start gap-4">
//               {resultStyle.icon}
//               <div className="flex-1 min-w-0">
//                 <p className={`text-base font-bold mb-1 ${resultStyle.title}`}>{resultStyle.label}</p>
//                 <p className={`text-sm mb-3 ${resultStyle.body}`}>{msg || result.error}</p>
//                 {isThreat && result.animal_type && result.animal_type !== "Unknown" && (
//                   <div className="grid grid-cols-2 gap-3">
//                     {[
//                       { label: "Animal Type", value: result.animal_type },
//                       { label: "Confidence",  value: `${result.confidence}%` },
//                     ].map(({ label, value }) => (
//                       <div key={label} className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
//                         <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
//                         <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{value}</p>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ── Info card ── */}
//         <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 transition-colors duration-200">
//           <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">🐾 About the Detection Model</h3>
//           <ul className="list-disc pl-5 space-y-1.5 text-sm text-blue-800 dark:text-blue-400">
//             <li>Trained deep learning model on a multi-class animal dataset.</li>
//             <li>Detects common crop threats: birds, monkeys, cows, and wild animals.</li>
//             <li>Processes images using computer vision techniques on the Raspberry Pi 4.</li>
//             <li>Generates an alert if a threatening animal is detected.</li>
//             <li>All results are saved to detection history for monitoring.</li>
//           </ul>
//         </div>

//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useRef } from "react";
import { Camera, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function AnimalDetection() {
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
      const res = await fetch("http://127.0.0.1:5000/api/animal/detect-animal", {
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

  // ── Camera capture ──
  const captureCamera = async () => {
    setDetecting(true);
    setResult(null);
    setSelectedImage(null);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/animal/capture-camera", {
        method: "POST",
      });
      const data = await res.json();
      setResult(data);
      // Show the captured image in preview
      if (data.success && data.filename) {
        setSelectedImage(`http://127.0.0.1:5000/api/animal/image/${data.filename}`);
      }
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

  // ── result styling ──
  const msg: string = result?.message || "";
  const isThreat  = result?.success && msg.includes("✅ Threat") && msg.includes("Animal:");
  const isPlant   = msg.includes("Plant image given");
  const isUnclear = msg.includes("⚠");
  const isError   = result && !result.success;

  let resultStyle = {
    wrap:  "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    title: "text-emerald-800 dark:text-emerald-300",
    body:  "text-emerald-700 dark:text-emerald-400",
    icon:  <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />,
    label: "✅ All Clear",
  };
  if (isThreat) {
    resultStyle = {
      wrap:  "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20",
      title: "text-red-800 dark:text-red-300",
      body:  "text-red-700 dark:text-red-400",
      icon:  <AlertTriangle className="w-7 h-7 text-red-500 shrink-0" />,
      label: "⚠️ Threat Detected!",
    };
  } else if (isUnclear || isError) {
    resultStyle = {
      wrap:  "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20",
      title: "text-amber-800 dark:text-amber-300",
      body:  "text-amber-700 dark:text-amber-400",
      icon:  <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0" />,
      label: isError ? "⚠️ Error" : "⚠️ Unclear",
    };
  } else if (isPlant) {
    resultStyle = {
      wrap:  "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
      title: "text-emerald-800 dark:text-emerald-300",
      body:  "text-emerald-700 dark:text-emerald-400",
      icon:  <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />,
      label: "🌿 Plant Image Given",
    };
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Page header ── */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Animal Threat Detection
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload an image or capture from camera to detect animal threats
          </p>
        </div>

        {/* ── Upload card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
          {!selectedImage ? (
            <>
              {/* Drop zone */}
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
                <button
                  onClick={detectAnimal}
                  disabled={detecting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  {detecting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Detecting...</>
                    : <><AlertTriangle className="w-4 h-4" /> Detect Threats</>}
                </button>
                <button
                  onClick={reset}
                  disabled={detecting}
                  className="px-5 py-2.5 rounded-lg font-medium text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Camera capture card — always visible ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            📷 Or capture directly from camera
          </p>
          <button
            onClick={captureCamera}
            disabled={detecting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
          >
            {detecting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Capturing...</>
              : <><Camera className="w-4 h-4" /> Capture from Camera</>}
          </button>
          <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-2">
            Uses laptop camera now · Pi camera on deployment
          </p>
        </div>

        {/* ── Result card ── */}
        {result && (
          <div className={`rounded-xl border-2 ${resultStyle.wrap} p-5 transition-colors duration-200`}>
            <div className="flex items-start gap-4">
              {resultStyle.icon}
              <div className="flex-1 min-w-0">
                <p className={`text-base font-bold mb-1 ${resultStyle.title}`}>{resultStyle.label}</p>
                <p className={`text-sm mb-3 ${resultStyle.body}`}>{msg || result.error}</p>
                {isThreat && result.animal_type && result.animal_type !== "Unknown" && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Animal Type", value: result.animal_type },
                      { label: "Confidence",  value: `${result.confidence}%` },
                    ].map(({ label, value }) => (
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

        {/* ── Info card ── */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 transition-colors duration-200">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">🐾 About the Detection Model</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-blue-800 dark:text-blue-400">
            <li>Trained deep learning model on a multi-class animal dataset.</li>
            <li>Detects common crop threats: birds, monkeys, cows, and wild animals.</li>
            <li>Processes images using computer vision techniques on the Raspberry Pi 4.</li>
            <li>Generates an alert if a threatening animal is detected.</li>
            <li>All results are saved to detection history for monitoring.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}