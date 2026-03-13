// // 'use client';

// // import { useState } from 'react';
// // import Link from 'next/link';
// // import { usePathname, useRouter } from 'next/navigation';
// // import { Leaf } from "lucide-react";
// // import { 
// //   Home, 
// //   Code, 
// //   Palette, 
// //   Type, 
// //   Layers, 
// //   Zap, 
// //   PieChart, 
// //   FileText, 
// //   Star, 
// //   Bell, 
// //   Layout,
// //   FileStack,
// //   ChevronDown,
// //   ChevronRight,
// //   Newspaper,
// //   MapPin,
// //   Camera
// // } from 'lucide-react';

// // const sidebarItems = [
// //   { icon: Home, label: 'Dashboard', badge: 'NEW', href: '/' },
// //   { icon: Bell, label: 'Notifications', href: '/notifications' },
// //   { icon: Newspaper, label: 'Agriculture News', href: '/agriculture-news' },
// //   { icon: MapPin, label: 'Bot Location', href: '/bot-location' },
// //   { icon: FileStack, label: 'Soil Sensor Readings', href: '/soil-sensor-readings' },
// //   { icon: Camera, label: 'Animal Detection', href: '/animal-detection' },
// //   { icon: Leaf, label: 'Plant Disease Detection', href: '/plant-detection' },
// // ];

// // interface SidebarItemProps {
// //   icon: React.ComponentType<{ className?: string }>;
// //   label: string;
// //   badge?: string;
// //   href?: string;
// //   expandable?: boolean;
// // }

// // function SidebarItem({ icon: Icon, label, badge, href, expandable }: SidebarItemProps) {
// //   const [isExpanded, setIsExpanded] = useState(false);
// //   const pathname = usePathname();
// //   const router = useRouter();
// //   const isActive = pathname === href;

// //   const handleClick = () => {
// //     console.log(`Clicked on ${label}`);
    
// //     if (expandable) {
// //       setIsExpanded(!isExpanded);
// //       console.log(`Toggled ${label} expansion: ${!isExpanded}`);
// //     } else if (href) {
// //       console.log(`Navigating to ${href}`);
// //       router.push(href);
// //     }
// //   };

// //   const content = (
// //     <div
// //       className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-all duration-200 ${
// //         isActive 
// //           ? 'bg-gray-800 text-white shadow-md' 
// //           : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-sm'
// //       } active:scale-95`}
// //       onClick={handleClick}
// //     >
// //       <div className="flex items-center space-x-3">
// //         <Icon className="h-4 w-4" />
// //         <span>{label}</span>
// //       </div>
// //       <div className="flex items-center space-x-2">
// //         {badge && (
// //           <span className={`text-xs px-2 py-1 rounded ${
// //             badge === 'NEW' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
// //           }`}>
// //             {badge}
// //           </span>
// //         )}
// //         {expandable && (
// //           isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
// //         )}
// //       </div>
// //     </div>
// //   );

// //   if (href && !expandable) {
// //     return (
// //       <Link href={href}>
// //         {content}
// //       </Link>
// //     );
// //   }

// //   return <div>{content}</div>;
// // }

// // export default function Sidebar() {
// //   return (
// //     <div className="w-64 bg-gray-900 dark:bg-gray-900 text-white flex flex-col">
// //       {/* Logo */}
// //       <div className="p-4 border-b border-gray-700">
// //         <div className="flex items-center space-x-2">
// //           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
// //             <div className="w-4 h-4 bg-white rounded-sm"></div>
// //           </div>
// //           <span className="text-lg font-semibold">AGRI BOT</span>
// //         </div>
// //       </div>

// //       {/* Navigation */}
// //       <div className="flex-1 overflow-y-auto p-3 space-y-6">
// //         {/* Main Items */}
// //         <div className="space-y-1">
// //           {sidebarItems.map((item, index) => (
// //             <SidebarItem key={index} {...item} />
// //           ))}
// //         </div>


// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import { usePathname, useRouter } from "next/navigation";
// import {
//   Home,
//   Bell,
//   Newspaper,
//   MapPin,
//   FileStack,
//   Camera,
//   Leaf,
//   History
// } from "lucide-react";

// const sidebarItems = [
//   { icon: Home, label: "Dashboard", href: "/" },
//   { icon: Bell, label: "Notifications", href: "/notifications" },
//   { icon: Newspaper, label: "Agriculture News", href: "/agriculture-news" },
//   { icon: MapPin, label: "Bot Location", href: "/bot-location" },
//   { icon: FileStack, label: "Soil Sensor Readings", href: "/soil-sensor-readings" },
//   { icon: Camera, label: "Animal Detection", href: "/animal-detection" },
//   { icon: Leaf, label: "Plant Disease Detection", href: "/plant-detection" },

//   // 👇 ADD THIS
//   { icon: History, label: "Detection History", href: "/history" },
// ];

// export default function Sidebar() {
//   const pathname = usePathname();
//   const router = useRouter();

//   return (
//     <div className="w-64 bg-gray-900 text-white flex flex-col">

//       {/* Logo */}
//       <div className="p-4 border-b border-gray-700">
//         <span className="text-lg font-semibold">AGRI BOT</span>
//       </div>

//       {/* Navigation */}
//       <div className="flex-1 p-3 space-y-2">
//         {sidebarItems.map((item, i) => {
//           const Icon = item.icon;
//           const isActive = pathname === item.href;

//           return (
//             <div
//               key={i}
//               onClick={() => router.push(item.href)}
//               className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition
//               ${isActive ? "bg-gray-800" : "hover:bg-gray-800"}`}
//             >
//               <Icon className="h-4 w-4 mr-3" />
//               {item.label}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }



"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Home, Bell, Newspaper, MapPin,
  FileStack, Camera, Leaf, History, X,
} from "lucide-react";

const NAV = [
  { icon: Home,      label: "Dashboard",              href: "/" },
  { icon: Bell,      label: "Notifications",           href: "/notifications" },
  { icon: Newspaper, label: "Agriculture News",        href: "/agriculture-news" },
  { icon: MapPin,    label: "Bot Location",            href: "/bot-location" },
  { icon: FileStack, label: "Soil Sensor Readings",    href: "/soil-sensor-readings" },
  { icon: Camera,    label: "Animal Detection",        href: "/animal-detection" },
  { icon: Leaf,      label: "Plant Disease Detection", href: "/plant-detection" },
  { icon: History,   label: "Detection History",       href: "/history" },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const go = (href: string) => {
    router.push(href);
  };

  return (
    <div className="w-64 h-full flex flex-col bg-gray-900 border-r border-gray-800">

      {/* Logo row */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold tracking-wide text-sm">AGRI BOT</span>
        </div>

        {/* X button — always visible, closes sidebar */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => go(href)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 text-left group
                ${active
                  ? "bg-emerald-600/15 text-emerald-400 border border-emerald-600/25"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent"
                }
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-emerald-400" : "text-gray-600 group-hover:text-gray-300"}`} />
              <span className="truncate">{label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800 shrink-0">
        <p className="text-xs text-gray-700">Agri Bot v1.0 · Final Year Project</p>
      </div>

    </div>
  );
}