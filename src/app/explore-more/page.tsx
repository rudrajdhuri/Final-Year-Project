"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, CloudSun, Newspaper, Sparkles, Wifi, WifiOff } from "lucide-react";

const FEATURES = [
  {
    href: "/ai-chat",
    title: "AI Expert",
    description: "Ask crop, pest, irrigation, and farming questions with Groq AI.",
    icon: Sparkles,
    accent: "from-emerald-500 to-lime-500",
  },
  {
    href: "/agriculture-news",
    title: "Agricultural News",
    description: "Read the latest agriculture headlines when internet is available.",
    icon: Newspaper,
    accent: "from-blue-500 to-cyan-500",
  },
  {
    href: "/weather",
    title: "Weather API",
    description: "Check live weather updates and forecasts from online weather services.",
    icon: CloudSun,
    accent: "from-amber-500 to-orange-500",
  },
];

export default function ExploreMorePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const syncStatus = () => setIsOnline(navigator.onLine);
    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);
    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  return (
    <div className="min-h-full bg-gray-50 p-4 transition-colors duration-200 dark:bg-gray-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Explore More</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Internet-based features separated from the offline core app.
            </p>
          </div>
        </div>

        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            isOnline
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {isOnline ? "Internet Connected" : "No Internet - These features require internet"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map(({ href, title, description, icon: Icon, accent }) =>
            isOnline ? (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</p>
              </Link>
            ) : (
              <div
                key={href}
                className="cursor-not-allowed rounded-2xl border border-gray-200 bg-gray-100 p-5 opacity-70 dark:border-gray-800 dark:bg-gray-900/70"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
                <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</p>
                <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-300">Enable internet to use this feature.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
