// "use client";

// import { useState } from "react";
// import { Menu, X } from "lucide-react";
// import Sidebar from "./components/Sidebar";
// import ThemeToggle from "./components/ThemeToggle";

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">

//       {/* Mobile backdrop */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 z-20 bg-black/50 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar — overlay on mobile, static on desktop */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-30 w-64
//         lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:block
//         transition-transform duration-300 ease-in-out
//         ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
//       `}>
//         <Sidebar />
//       </aside>

//       <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

//         <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 shrink-0 transition-colors duration-200">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="lg:hidden p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//               >
//                 {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//               </button>
//               <span className="text-sm text-gray-600 dark:text-gray-400">Home</span>
//             </div>
//             <div className="flex items-center gap-3">
//               <ThemeToggle />
//               <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
//             </div>
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto">
//           {children}
//         </main>

//       </div>
//     </div>
//   );
// }



// "use client";

// import { useState } from "react";
// import { Menu, X } from "lucide-react";
// import Sidebar from "./components/Sidebar";
// import ThemeToggle from "./components/ThemeToggle";
// import UserAvatar from "./components/UserAvatar";

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">

//       {/* Mobile backdrop */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 z-20 bg-black/50 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar — overlay on mobile, static on desktop */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-30 w-64
//         lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:block
//         transition-transform duration-300 ease-in-out
//         ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
//       `}>
//         <Sidebar />
//       </aside>

//       <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

//         <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 shrink-0 transition-colors duration-200">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="lg:hidden p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//               >
//                 {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//               </button>
//               <span className="text-sm text-gray-600 dark:text-gray-400">Home</span>
//             </div>
//             <div className="flex items-center gap-3">
//               <ThemeToggle />
//               <UserAvatar />
//             </div>
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto">
//           {children}
//         </main>

//       </div>
//     </div>
//   );
// }


// "use client";

// import { useState, useEffect } from "react";
// import { Menu, X } from "lucide-react";
// import Sidebar from "./components/Sidebar";
// import ThemeToggle from "./components/ThemeToggle";
// import UserAvatar from "./components/UserAvatar";

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false); // mobile: closed by default
//   // On desktop, sidebar is always shown when sidebarOpen=true
//   // Use useEffect to open on desktop by default
//   useEffect(() => {
//     const onResize = () => {
//       if (window.innerWidth >= 1024) setSidebarOpen(true);
//     };
//     onResize(); // run on mount
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);

//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">

//       {/* Mobile backdrop */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 z-20 bg-black/50 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar:
//           Mobile  — fixed overlay, slides in/out
//           Desktop — always visible in flex row, hamburger toggles it  */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-30 w-64
//         lg:static lg:z-auto lg:shrink-0
//         transition-transform duration-300 ease-in-out
//         ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
//         ${!sidebarOpen ? "lg:hidden" : ""}
//       `}>
//         <Sidebar onMobileClose={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }} />
//       </aside>

//       <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

//         <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 shrink-0 transition-colors duration-200">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//               >
//                 {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//               </button>
//               <span className="text-sm text-gray-600 dark:text-gray-400">Home</span>
//             </div>
//             <div className="flex items-center gap-3">
//               <ThemeToggle />
//               <UserAvatar />
//             </div>
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto">
//           {children}
//         </main>

//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";
import UserAvatar from "./components/UserAvatar";
import Footer from "./components/Footer";
import FullscreenToggle from "./components/FullscreenToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64
        lg:static lg:z-auto lg:shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${!sidebarOpen ? "lg:hidden" : ""}
      `}>
        <Sidebar onMobileClose={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 shrink-0 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Home</span>
            </div>
            <div className="flex items-center gap-3">
              <FullscreenToggle />
              <ThemeToggle />
              <UserAvatar />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {children}
          </div>
          <Footer />
        </main>

      </div>
    </div>
  );
}