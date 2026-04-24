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
function rightRotate(value: number, amount: number) {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Fallback(ascii: string): string {
  const maxWord = Math.pow(2, 32);
  const words: number[] = [];
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  let result = "";
  const asciiBitLength = ascii.length * 8;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor += 1) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  const getFractionalBits = (n: number) => ((n - (n | 0)) * maxWord) | 0;

  for (let candidate = 2; primeCounter < 64; candidate += 1) {
    if (!isPrime(candidate)) continue;
    if (primeCounter < 8) {
      hash[primeCounter] = getFractionalBits(Math.sqrt(candidate));
    }
    k[primeCounter] = getFractionalBits(Math.cbrt(candidate));
    primeCounter += 1;
  }

  ascii += "\x80";
  while ((ascii.length % 64) !== 56) {
    ascii += "\x00";
  }

  for (let i = 0; i < ascii.length; i += 1) {
    words[i >> 2] |= ascii.charCodeAt(i) << ((3 - i) % 4) * 8;
  }

  words[words.length] = Math.floor(asciiBitLength / maxWord);
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i += 1) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i += 1) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i += 1) {
    for (let j = 3; j >= 0; j -= 1) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }

  return result;
}

export async function sha256(str: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  return sha256Fallback(str);
}
