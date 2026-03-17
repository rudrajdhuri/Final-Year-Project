// "use client";

// import SoilCard from '../components/SoilCard';

// export default function SoilSensorPage() {
//   return (
//     <div className="min-h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
//       <div className="max-w-3xl mx-auto">

//         {/* Header */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Soil Sensor Readings</h1>
//           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Live soil measurements from SoilNode-01</p>
//         </div>

//         <div className="space-y-5">

//           {/* Main soil card */}
//           <SoilCard />

//           {/* Sensor info */}
//           <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
//             <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Sensor Info</h2>
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               {[
//                 { label: "Model",      value: "SoilNode-01" },
//                 { label: "Battery",    value: "86%" },
//                 { label: "Last Sync",  value: "A few seconds ago" },
//               ].map(({ label, value }) => (
//                 <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
//                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
//                   <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
//                 </div>
//               ))}
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import SoilCard from '../components/SoilCard';

export default function SoilSensorPage() {
  return (
    // FIX 2: exact viewport height like ai-chat so footer stays hidden until scroll
    <div className="bg-gray-50 dark:bg-gray-950 transition-colors duration-200 p-4 sm:p-6 lg:p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ height: "calc(100vh - 56px)" }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Soil Sensor Readings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Live soil measurements from SoilNode-01</p>
        </div>

        <div className="space-y-5">

          {/* Main soil card */}
          <SoilCard />

          {/* Sensor info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 transition-colors duration-200">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Sensor Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Model",     value: "SoilNode-01" },
                { label: "Battery",   value: "86%" },
                { label: "Last Sync", value: "A few seconds ago" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}