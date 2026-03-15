"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useAuth, clearGuestHistory } from "./AuthContext";

export default function UserAvatar() {
  const { user, logout, isGuest } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name
    ? user.name.trim()[0].toUpperCase()
    : null;

  return (
    <div ref={ref} className="relative">

      {/* Avatar circle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 dark:hover:ring-offset-gray-900 focus:outline-none"
        aria-label="User menu"
      >
        {isGuest ? (
          // Guest — leaf icon with gray bg
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        ) : user?.picture ? (
          // Google user — show profile picture
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-sm" />
        ) : (
          // Manual user — colored circle with initial
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-56 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-50 overflow-hidden">

          {isGuest ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Browsing as Guest</p>
              </div>
              <div className="p-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors font-medium"
                >
                  Sign In
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={async () => {
                    // Stop any running auto capture before logout
                    try {
                      await Promise.all([
                        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/auto/stop/animal`, { method: "POST" }),
                        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/auto/stop/plant`,  { method: "POST" }),
                      ]);
                    } catch {}
                    logout();
                    clearGuestHistory();
                    sessionStorage.clear();
                    setOpen(false);
                    window.location.href = "/";
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}