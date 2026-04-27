// "use client";

// import { useState, useEffect } from "react";
// import { Menu, X } from "lucide-react";
// import Sidebar from "./components/Sidebar";
// import ThemeToggle from "./components/ThemeToggle";
// import UserAvatar from "./components/UserAvatar";
// import Footer from "./components/Footer";
// import FullscreenToggle from "./components/FullscreenToggle";

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   useEffect(() => {
//     const onResize = () => {
//       if (window.innerWidth >= 1024) setSidebarOpen(true);
//     };
//     onResize();
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

//       {/* Sidebar */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-30 w-64
//         lg:static lg:z-auto lg:shrink-0
//         transition-transform duration-300 ease-in-out
//         ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
//         ${!sidebarOpen ? "lg:hidden" : ""}
//       `}>
//         <Sidebar onMobileClose={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }} />
//       </aside>

//       {/* Main content */}
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
//               <FullscreenToggle />
//               <ThemeToggle />
//               <UserAvatar />
//             </div>
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
//           <div className="flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//             {children}
//           </div>
//           <Footer />
//         </main>

//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
  const mainRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Reset scroll to top on every page navigation
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [pathname]);

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
        fixed inset-y-0 left-0 z-30 w-72
        lg:static lg:z-auto lg:shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${!sidebarOpen ? "lg:hidden" : ""}
      `}>
        <Sidebar onMobileClose={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* FIX 7: h-14 matches sidebar header */}
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 shrink-0 transition-colors duration-200 h-14 flex items-center">
          <div className="flex items-center justify-between w-full">
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

        {/* KEY FIX: main scrolls as one unit — content + footer together.
            Footer is BELOW content so only visible when user scrolls down.
            Children fill available space via min-h so short pages push footer down. */}
        <main ref={mainRef} className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="min-h-full flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </div>
        </main>

      </div>
    </div>
  );
}
