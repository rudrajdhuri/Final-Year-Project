// "use client";

// import React, { useEffect, useState } from 'react';

// interface Readings {
//   moisture: number;   // %
//   temperature: number; // °C
//   ph: number;          // pH
// }

// export default function SoilCard({ initial }: { initial?: Readings }) {

//   const [readings, setReadings] = useState<Readings>(
//     initial || { moisture: 32.5, temperature: 24.3, ph: 6.8 }
//   );

//   const [loading, setLoading] = useState(true);

//   // ----------------------------------------
//   // 1️⃣ Fetch from Flask backend first
//   // ----------------------------------------
//   useEffect(() => {
//     fetch("http://localhost:5000/api/soil/readings")
//       .then((res) => res.json())
//       .then((data) => {
//         setReadings({
//           moisture: data.moisture,
//           temperature: data.temperature,
//           ph: data.ph,
//         });
//         setLoading(false);
//       })
//       .catch(() => {
//         console.warn("Backend not reachable — using simulated values.");
//         setLoading(false); // show card anyway
//       });
//   }, []);

//   // ----------------------------------------
//   // 2️⃣ Continue live simulated updates every 5 sec
//   //    (these are small adjustments, natural-looking)
//   // ----------------------------------------
//   useEffect(() => {
//     const id = setInterval(() => {
//       setReadings(prev => ({
//         moisture: Math.min(100, Math.max(0, +(prev.moisture + (Math.random() - 0.5) * 2).toFixed(1))),
//         temperature: +(prev.temperature + (Math.random() - 0.5) * 0.6).toFixed(1),
//         ph: +(prev.ph + (Math.random() - 0.5) * 0.05).toFixed(2)
//       }));
//     }, 5000);

//     return () => clearInterval(id);
//   }, []);

//   // ----------------------------------------
//   // 3️⃣ Loading state
//   // ----------------------------------------
//   if (loading) {
//     return (
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
//         <p className="text-gray-500 text-sm">Fetching real-time soil readings…</p>
//       </div>
//     );
//   }

//   // ----------------------------------------
//   // 4️⃣  UI 
//   // ----------------------------------------
//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-gray-900 w-full">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-semibold">Soil Sensor Readings</h3>
//         <span className="text-xs text-gray-500">
//           Live • <span className="font-mono">●</span>
//         </span>
//       </div>

//       <div className="grid grid-cols-3 gap-4">
//         <div className="bg-gray-50 p-4 rounded text-center">
//           <div className="text-xs text-gray-500">Moisture</div>
//           <div className="text-2xl font-bold text-green-600">{readings.moisture}%</div>
//         </div>

//         <div className="bg-gray-50 p-4 rounded text-center">
//           <div className="text-xs text-gray-500">Temp</div>
//           <div className="text-2xl font-bold text-orange-600">{readings.temperature}°C</div>
//         </div>

//         <div className="bg-gray-50 p-4 rounded text-center">
//           <div className="text-xs text-gray-500">pH</div>
//           <div className="text-2xl font-bold text-yellow-600">{readings.ph}</div>
//         </div>
//       </div>

//       <div className="mt-4 text-sm text-gray-600">
//         Sensor: <span className="text-gray-900 font-medium">SoilNode-01</span>
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState } from 'react';

interface Readings {
  moisture: number;
  temperature: number;
  ph: number;
}

export default function SoilCard({ initial }: { initial?: Readings }) {
  const [readings, setReadings] = useState<Readings>(
    initial || { moisture: 32.5, temperature: 24.3, ph: 6.8 }
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/soil/readings")
      .then((res) => res.json())
      .then((data) => {
        setReadings({ moisture: data.moisture, temperature: data.temperature, ph: data.ph });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setReadings(prev => ({
        moisture: Math.min(100, Math.max(0, +(prev.moisture + (Math.random() - 0.5) * 2).toFixed(1))),
        temperature: +(prev.temperature + (Math.random() - 0.5) * 0.6).toFixed(1),
        ph: +(prev.ph + (Math.random() - 0.5) * 0.05).toFixed(2),
      }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const cardBg = "rounded-xl border shadow-sm p-6 w-full transition-colors duration-200 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white";
  const innerBg = "p-4 rounded-lg text-center border bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700";

  if (loading) {
    return (
      <div className={cardBg}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Fetching real-time soil readings…</p>
      </div>
    );
  }

  return (
    <div className={cardBg}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Soil Sensor Readings</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={innerBg}>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Moisture</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{readings.moisture}%</div>
        </div>
        <div className={innerBg}>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Temp</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{readings.temperature}°C</div>
        </div>
        <div className={innerBg}>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">pH</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{readings.ph}</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Sensor: <span className="text-gray-900 dark:text-white font-medium">SoilNode-01</span>
      </div>
    </div>
  );
}