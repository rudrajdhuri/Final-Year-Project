"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Compass,
  FileStack,
  Gamepad2,
  History,
  Home,
  Info,
  Leaf,
  Loader2,
  MapPin,
  Power,
  ShieldAlert,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { getClientSessionId } from "./AuthContext";

const NAV = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  // { icon: MapPin, label: "Bot Location", href: "/bot-location" },
  { icon: FileStack, label: "Soil Sensor Readings", href: "/soil-sensor-readings" },
  { icon: ShieldAlert, label: "AI Threat Detection", href: "/ai-threat-det" },
  { icon: History, label: "History", href: "/history" },
  { icon: Gamepad2, label: "Bot Control", href: "/bot-control" },
  { icon: Info, label: "About Us", href: "/about-us" },
  // { icon: Compass, label: "Explore More", href: "/explore-more" },
];

export default function Sidebar({ onMobileClose }: { onMobileClose?: () => void }) {
  const pathname = usePathname();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [shutdownLoading, setShutdownLoading] = useState(false);
  const [shutdownError, setShutdownError] = useState<string | null>(null);

  async function openShutdownConfirmation() {
    setShutdownError(null);
    const sessionId = getClientSessionId();
    try {
      const response = await apiFetch(`/api/session/status?session_id=${encodeURIComponent(sessionId)}`);
      const payload = await response.json();
      const status = payload.status;
      if (status?.locked && !status?.owner) {
        setBlockedOpen(true);
        return;
      }
      setConfirmOpen(true);
    } catch {
      setConfirmOpen(true);
    } finally {
      if (window.innerWidth < 1024) onMobileClose?.();
    }
  }

  async function requestShutdown() {
    setShutdownLoading(true);
    setShutdownError(null);
    try {
      const response = await apiFetch("/api/power/shutdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, session_id: getClientSessionId() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || "Shutdown request failed");
      }
      setConfirmOpen(false);
    } catch (error: any) {
      setShutdownError(error.message || "Shutdown request failed");
    } finally {
      setShutdownLoading(false);
    }
  }

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
        <button
          type="button"
          onClick={openShutdownConfirmation}
          className="group flex w-full items-center gap-4 rounded-2xl border border-transparent px-4 py-3 text-left text-lg font-medium text-red-600 transition-all duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:border-red-500/20 dark:hover:bg-red-950/30 dark:hover:text-red-300"
        >
          <Power className="h-5 w-5 shrink-0 text-red-500 transition-colors dark:text-red-400" />
          <span className="truncate">Shutdown</span>
        </button>
      </nav>

      <div className="shrink-0 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
        <p className="text-sm text-gray-400 dark:text-gray-600">Agri Bot v1.0 | Final Year Project</p>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shut Down Agri Bot?</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                    Are you sure you want to shut down Agri Bot?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={shutdownLoading}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close shutdown confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {shutdownError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-950/30 dark:text-red-300">
                {shutdownError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={shutdownLoading}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={requestShutdown}
                disabled={shutdownLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {shutdownLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                Shut Down
              </button>
            </div>
          </div>
        </div>
      )}

      {blockedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl dark:border-amber-500/20 dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bot In Use</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Bot is in use by someone. Please try after sometime.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setBlockedOpen(false)}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
