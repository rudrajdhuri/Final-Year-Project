"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id:       string;
  name:     string;
  email:    string;
  picture?: string;
  provider?: "manual" | "google";
}

interface AuthContextType {
  user:    User | null;
  loading: boolean;
  login:   (user: User) => void;
  logout:  () => void;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  login: () => {}, logout: () => {},
  isGuest: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [hydrated,  setHydrated]  = useState(false);

  useEffect(() => {
    // Restore from localStorage
    try {
      const stored = localStorage.getItem("agribot_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  const login = (u: User) => {
    const withProvider = { ...u, provider: u.provider || "manual" as const };
    setUser(withProvider);
    localStorage.setItem("agribot_user", JSON.stringify(withProvider));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("agribot_user");
    clearGuestHistory();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading: !hydrated,
      login,
      logout,
      isGuest: !user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

// ── Guest history ──
export function getGuestHistory(): any[] {
  try { return JSON.parse(sessionStorage.getItem("agribot_guest_history") || "[]"); }
  catch { return []; }
}

export function pushGuestHistory(record: any) {
  const arr    = getGuestHistory();
  arr.push(record);
  const last10 = arr.slice(-10);
  sessionStorage.setItem("agribot_guest_history", JSON.stringify(last10));
  return last10;
}

export function clearGuestHistory() {
  sessionStorage.removeItem("agribot_guest_history");
}

// ── SHA-256 ──
export async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
