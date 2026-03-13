// "use client";

// import { Menu } from 'lucide-react';
// import Sidebar from './components/Sidebar';
// import ThemeToggle from './components/ThemeToggle';

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar */}
//       <Sidebar />
      
//       {/* Main Content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Header */}
//         <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <button className="lg:hidden">
//                 <Menu className="h-6 w-6 text-gray-600" />
//               </button>
//               <nav className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
//                 <span>Home</span>
//               </nav>
//             </div>
//             <div className="flex items-center space-x-4">
//               {/* <div className="flex items-center space-x-2">
//                 <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">5</span>
//                 <span className="bg-yellow-500 text-white text-xs rounded-full px-2 py-1">5</span>
//                 <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">7</span>
//               </div> */}
//               <div className="flex items-center space-x-3">
//                 <ThemeToggle />
//                 <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* Page Content */}
//         <main className="flex-1 overflow-y-auto">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }



"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">

      {/* Sidebar — fixed, toggled by state */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content — shifts right when sidebar open */}
      <div
        className={`
          flex flex-col flex-1 min-w-0 overflow-hidden
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "ml-64" : "ml-0"}
        `}
      >
        {/* ── Header — unchanged look, just hamburger added ── */}
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4 shrink-0 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Hamburger — toggles sidebar */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <nav className="hidden lg:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Home</span>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}