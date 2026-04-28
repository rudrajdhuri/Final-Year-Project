"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Compass, FileStack, Gamepad2, History, Home, Leaf, MapPin, ShieldAlert } from "lucide-react";

const NAV = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: MapPin, label: "Bot Location", href: "/bot-location" },
  { icon: FileStack, label: "Soil Sensor Readings", href: "/soil-sensor-readings" },
  { icon: ShieldAlert, label: "AI Threat Detection", href: "/ai-threat-det" },
  { icon: History, label: "History", href: "/history" },
  { icon: Gamepad2, label: "Bot Control", href: "/bot-control" },
  // { icon: Compass, label: "Explore More", href: "/explore-more" },
];

export default function Sidebar({ onMobileClose }: { onMobileClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-72 flex-col border-r border-gray-200 bg-white transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-5 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-wide text-gray-900 dark:text-white">
            AGRI BOT
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onClick={() => {
                if (window.innerWidth < 1024) onMobileClose?.();
              }}
              className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-lg font-medium transition-all duration-150 ${
                active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-600/25 dark:bg-emerald-600/15 dark:text-emerald-400"
                  : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  active
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400 group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-300"
                }`}
              />
              <span className="truncate">{label}</span>
              {active && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
        <p className="text-sm text-gray-400 dark:text-gray-600">Agri Bot v1.0 | Final Year Project</p>
      </div>
    </div>
  );
}
