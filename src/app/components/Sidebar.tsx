"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Bell, Newspaper, MapPin,
  FileStack, ShieldAlert, History, X, Leaf,
} from "lucide-react";

const NAV = [
  { icon: Home,        label: "Dashboard",           href: "/" },
  { icon: Bell,        label: "Notifications",        href: "/notifications" },
  { icon: Newspaper,   label: "Agriculture News",     href: "/agriculture-news" },
  { icon: MapPin,      label: "Bot Location",         href: "/bot-location" },
  { icon: FileStack,   label: "Soil Sensor Readings", href: "/soil-sensor-readings" },
  { icon: ShieldAlert, label: "AI Threat Detection",  href: "/ai-threat-det" },
  { icon: History,     label: "Detection History",    href: "/history" },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors duration-200">

      {/* Logo row */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 dark:text-white font-semibold tracking-wide text-sm">AGRI BOT</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              prefetch={true}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group
                ${active
                  ? "bg-emerald-50 dark:bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-600/25"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border border-transparent"
                }
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-300"
              }`} />
              <span className="truncate">{label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <p className="text-xs text-gray-400 dark:text-gray-700">Agri Bot v1.0 · Final Year Project</p>
      </div>

    </div>
  );
}