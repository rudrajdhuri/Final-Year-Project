// "use client";

// import { useEffect, useState } from "react";

// export default function HistoryContent() {

//   const [records, setRecords] = useState<any[]>([]);
//   const [type, setType] = useState<"animal" | "plant">("animal");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {

//     setLoading(true);

//     const url =
//       type === "animal"
//         ? "http://127.0.0.1:5000/api/animal/history"
//         : "http://127.0.0.1:5000/api/plant/history";

//     fetch(url)
//       .then((res) => res.json())
//       .then((data) => {

//         if (data.success) {
//           setRecords(data.data);
//         }

//       })
//       .finally(() => setLoading(false));

//   }, [type]);


//   return (

//     <div>

//       <h1 className="text-2xl font-bold mb-6">
//         Detection History
//       </h1>


//       {/* Toggle buttons */}

//       <div className="flex gap-4 mb-6">

//         <button
//           onClick={() => setType("animal")}
//           className={`px-4 py-2 rounded ${
//             type === "animal"
//               ? "bg-green-600 text-white"
//               : "bg-gray-700 text-white"
//           }`}
//         >
//           Animal History
//         </button>

//         <button
//           onClick={() => setType("plant")}
//           className={`px-4 py-2 rounded ${
//             type === "plant"
//               ? "bg-green-600 text-white"
//               : "bg-gray-700 text-white"
//           }`}
//         >
//           Plant History
//         </button>

//       </div>


//       {loading && <p>Loading...</p>}


//       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

//         {records.map((item) => (

//           <div
//             key={item._id}
//             className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border"
//           >

//             {/* ANIMAL HISTORY */}

//             {type === "animal" && (

//               <>
//                 <p className="font-semibold mb-2">
//                   {item.threat_detected ? "⚠️ Threat" : "✅ Safe"}
//                 </p>

//                 <p>
//                   <strong>Type:</strong> {item.animal_type || "Unknown"}
//                 </p>

//                 <p>
//                   <strong>Confidence:</strong> {item.confidence}%
//                 </p>
//               </>

//             )}

//             {/* PLANT HISTORY */}

//             {type === "plant" && (

//               <>
//                 <p className="font-semibold mb-2">
//                   🌿 Plant Detection
//                 </p>

//                 <p>
//                   <strong>Disease:</strong> {item.result}
//                 </p>

//                 <p>
//                   <strong>Confidence:</strong> {item.confidence}%
//                 </p>
//               </>

//             )}


//             <p className="text-sm text-gray-500 mt-2">
//               {item.timestamp
//                 ? new Date(item.timestamp).toLocaleString()
//                 : "No date"}
//             </p>


//             {item.filename && (

//               <img
//                 src={`http://127.0.0.1:5000/api/${type}/image/${item.filename}`}
//                 className="mt-3 rounded border w-full h-40 object-cover"
//               />

//             )}

//           </div>

//         ))}

//       </div>

//     </div>

//   );

// }

"use client";

import { useEffect, useState } from "react";

// --------------------------------------------------
// Parse Animal Card
// --------------------------------------------------
function parseAnimalCard(item: any) {
  const msg: string = item.message || "";

  let statusLabel = "";
  let statusColor = "";
  let borderColor = "";
  let headerBg = "";
  let badgeBg = "";
  let typeDisplay = "";

  if (msg.includes("✅ Threat") && msg.includes("Animal:")) {
    statusLabel = "⚠️ Threat Detected";
    statusColor = "text-red-500 dark:text-red-400";
    borderColor = "border-red-400 dark:border-red-600";
    headerBg = "bg-red-50 dark:bg-red-900/30";
    badgeBg = "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
    typeDisplay = item.animal_type || "Unknown Animal";
  } else if (msg.includes("Plant image given") || msg.includes("This is a plant")) {
    statusLabel = "🌿 Plant Detected";
    statusColor = "text-emerald-600 dark:text-emerald-400";
    borderColor = "border-emerald-400 dark:border-emerald-600";
    headerBg = "bg-emerald-50 dark:bg-emerald-900/20";
    badgeBg = "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
    typeDisplay = "Plant (Not a Threat)";
  } else if (msg.includes("Not an animal")) {
    statusLabel = "✅ Not an Animal";
    statusColor = "text-slate-500 dark:text-slate-400";
    borderColor = "border-slate-300 dark:border-slate-600";
    headerBg = "bg-slate-50 dark:bg-slate-800/60";
    badgeBg = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
    typeDisplay = "Not an Animal";
  } else if (msg.includes("very unclear") || msg.includes("species ambiguous") || msg.includes("No animal detected") || msg.includes("Uncertain")) {
    statusLabel = msg.includes("Uncertain") ? "⚠️ Uncertain Object" : "⚠️ Unclear Image";
    statusColor = "text-amber-600 dark:text-amber-400";
    borderColor = "border-amber-400 dark:border-amber-600";
    headerBg = "bg-amber-50 dark:bg-amber-900/20";
    badgeBg = "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
    typeDisplay = "Unclear Image";
  } else if (item.threat_detected) {
    statusLabel = "⚠️ Threat Detected";
    statusColor = "text-red-500 dark:text-red-400";
    borderColor = "border-red-400 dark:border-red-600";
    headerBg = "bg-red-50 dark:bg-red-900/30";
    badgeBg = "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
    typeDisplay = item.animal_type || "Unknown Animal";
  } else {
    statusLabel = "✅ All Clear";
    statusColor = "text-emerald-600 dark:text-emerald-400";
    borderColor = "border-emerald-400 dark:border-emerald-600";
    headerBg = "bg-emerald-50 dark:bg-emerald-900/20";
    badgeBg = "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
    typeDisplay = item.animal_type !== "Unknown" ? item.animal_type : "No Animal";
  }

  return { statusLabel, statusColor, borderColor, headerBg, badgeBg, typeDisplay };
}

// --------------------------------------------------
// Parse Plant Card
// --------------------------------------------------
function parsePlantCard(item: any) {
  const result: string = item.result || "";

  let statusLabel = "";
  let statusColor = "";
  let borderColor = "";
  let headerBg = "";
  let badgeBg = "";
  let typeDisplay = "";

  if (result.includes("Animal image given")) {
    statusLabel = "⚠️ Animal Detected";
    statusColor = "text-red-500 dark:text-red-400";
    borderColor = "border-red-400 dark:border-red-600";
    headerBg = "bg-red-50 dark:bg-red-900/30";
    badgeBg = "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
    typeDisplay = "Animal (Threat)";
  } else if (result.includes("UNHEALTHY") || result.includes("Threat Detected")) {
    statusLabel = "🌿 Unhealthy Plant";
    statusColor = "text-orange-600 dark:text-orange-400";
    borderColor = "border-orange-400 dark:border-orange-600";
    headerBg = "bg-orange-50 dark:bg-orange-900/20";
    badgeBg = "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300";
    typeDisplay = "Plant — Unhealthy (Disease Detected)";
  } else if (result.includes("HEALTHY") || result.includes("No Threat Detected")) {
    statusLabel = "🌿 Healthy Plant";
    statusColor = "text-emerald-600 dark:text-emerald-400";
    borderColor = "border-emerald-400 dark:border-emerald-600";
    headerBg = "bg-emerald-50 dark:bg-emerald-900/20";
    badgeBg = "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
    typeDisplay = "Plant — Healthy";
  } else if (result.includes("Not a plant")) {
    statusLabel = "❌ Not a Plant";
    statusColor = "text-slate-500 dark:text-slate-400";
    borderColor = "border-slate-300 dark:border-slate-600";
    headerBg = "bg-slate-50 dark:bg-slate-800/60";
    badgeBg = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
    typeDisplay = "Not a Plant";
  } else if (result.includes("UNCLEAR") || result.includes("Unclear")) {
    statusLabel = "⚠️ Unclear Image";
    statusColor = "text-amber-600 dark:text-amber-400";
    borderColor = "border-amber-400 dark:border-amber-600";
    headerBg = "bg-amber-50 dark:bg-amber-900/20";
    badgeBg = "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
    typeDisplay = "Unclear Image";
  } else {
    statusLabel = "🌿 Plant Detection";
    statusColor = "text-emerald-600 dark:text-emerald-400";
    borderColor = "border-emerald-400 dark:border-emerald-600";
    headerBg = "bg-emerald-50 dark:bg-emerald-900/20";
    badgeBg = "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
    typeDisplay = result || "Unknown";
  }

  return { statusLabel, statusColor, borderColor, headerBg, badgeBg, typeDisplay };
}

// --------------------------------------------------
// Format timestamp
// --------------------------------------------------
function formatTime(ts: string) {
  if (!ts) return "No date";
  try {
    const date = new Date(ts.endsWith("Z") ? ts : ts + "Z");
    return date.toLocaleString();
  } catch {
    return ts;
  }
}

// --------------------------------------------------
// Card Component
// --------------------------------------------------
function DetectionCard({
  statusLabel,
  statusColor,
  borderColor,
  headerBg,
  badgeBg,
  typeDisplay,
  confidence,
  timestamp,
  imageUrl,
}: {
  statusLabel: string;
  statusColor: string;
  borderColor: string;
  headerBg: string;
  badgeBg: string;
  typeDisplay: string;
  confidence: number;
  timestamp: string;
  imageUrl?: string;
}) {
  return (
    <div
      className={`
        rounded-xl border ${borderColor} overflow-hidden
        bg-white dark:bg-gray-900
        shadow-sm hover:shadow-md
        transition-shadow duration-200
      `}
    >
      {/* Header */}
      <div className={`${headerBg} px-4 py-3 flex items-center justify-between border-b ${borderColor}`}>
        <span className={`font-semibold text-sm ${statusColor}`}>
          {statusLabel}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {formatTime(timestamp)}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 shrink-0">
            Type
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeBg}`}>
            {typeDisplay}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 shrink-0">
            Confidence
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {confidence > 0 ? `${confidence}%` : "—"}
          </span>
        </div>
      </div>

      {/* Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          className="w-full h-40 object-cover"
          alt="detection"
        />
      )}
    </div>
  );
}

// --------------------------------------------------
// Main Component
// --------------------------------------------------
export default function HistoryContent() {
  const [records, setRecords] = useState<any[]>([]);
  const [type, setType] = useState<"animal" | "plant">("animal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url =
      type === "animal"
        ? "http://127.0.0.1:5000/api/animal/history"
        : "http://127.0.0.1:5000/api/plant/history";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRecords(data.data);
      })
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">

      {/* Page Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Detection History
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          All past animal and plant detection results
        </p>
      </div>

      {/* Toggle */}
      <div className="px-6 mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 gap-1">
          <button
            onClick={() => setType("animal")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
              type === "animal"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            🐾 Animal History
          </button>
          <button
            onClick={() => setType("plant")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
              type === "plant"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            🌿 Plant History
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 animate-pulse"
              >
                <div className="h-12 bg-gray-100 dark:bg-gray-800" />
                <div className="px-4 py-3 space-y-2">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
                <div className="h-40 bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && records.length === 0 && (
        <div className="px-6 flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <p className="text-4xl mb-3">{type === "animal" ? "🐾" : "🌿"}</p>
          <p className="text-sm font-medium">No {type} detection history yet</p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && records.length > 0 && (
        <div className="px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* ANIMAL CARDS */}
          {type === "animal" &&
            records.map((item) => {
              const parsed = parseAnimalCard(item);
              return (
                <DetectionCard
                  key={item._id}
                  {...parsed}
                  confidence={item.confidence}
                  timestamp={item.timestamp}
                  imageUrl={
                    item.filename
                      ? `http://127.0.0.1:5000/api/animal/image/${item.filename}`
                      : undefined
                  }
                />
              );
            })}

          {/* PLANT CARDS */}
          {type === "plant" &&
            records.map((item) => {
              const parsed = parsePlantCard(item);
              return (
                <DetectionCard
                  key={item._id}
                  {...parsed}
                  confidence={item.confidence}
                  timestamp={item.timestamp}
                  imageUrl={
                    item.filename
                      ? `http://127.0.0.1:5000/api/plant/image/${item.filename}`
                      : undefined
                  }
                />
              );
            })}

        </div>
      )}

    </div>
  );
}