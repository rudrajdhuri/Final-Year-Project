"use client";

const HOTSPOT_API_URL = "http://192.168.4.10:5000";
const DEV_API_URL = "http://127.0.0.1:5000";
const CACHE_KEY = "agribot_api_base";
const PROBE_PATH = "/api/bots";

let resolvedBase: string | null = null;
let resolvingPromise: Promise<string> | null = null;

function sanitizeUrl(value?: string) {
  return (value || "").trim().replace(/\/+$/, "");
}

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function probe(base: string) {
  const clean = sanitizeUrl(base);
  if (!clean) return false;

  const { signal, clear } = timeoutSignal(2500);
  try {
    const res = await fetch(`${clean}${PROBE_PATH}`, {
      method: "GET",
      signal,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clear();
  }
}

function candidateBases() {
  const envUrl = sanitizeUrl(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE);
  const savedUrl = typeof window !== "undefined"
    ? sanitizeUrl(sessionStorage.getItem(CACHE_KEY) || "")
    : "";
  const hostUrl = typeof window !== "undefined" && window.location.hostname
    ? sanitizeUrl(`http://${window.location.hostname}:5000`)
    : "";

  return [savedUrl, envUrl, hostUrl, HOTSPOT_API_URL, DEV_API_URL].filter(
    (url, index, arr) => url && arr.indexOf(url) === index
  );
}

export async function resolveApiBase(forceRefresh = false) {
  if (!forceRefresh && resolvedBase) return resolvedBase;
  if (!forceRefresh && resolvingPromise) return resolvingPromise;

  resolvingPromise = (async () => {
    for (const base of candidateBases()) {
      if (await probe(base)) {
        resolvedBase = sanitizeUrl(base);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(CACHE_KEY, resolvedBase);
        }
        return resolvedBase;
      }
    }

    const fallback = sanitizeUrl(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE) || HOTSPOT_API_URL;
    resolvedBase = fallback;
    return fallback;
  })();

  try {
    return await resolvingPromise;
  } finally {
    resolvingPromise = null;
  }
}

export async function getApiUrl(path: string, forceRefresh = false) {
  const base = await resolveApiBase(forceRefresh);
  return `${base}${path}`;
}

export async function apiFetch(path: string, init?: RequestInit, forceRefresh = false) {
  const url = await getApiUrl(path, forceRefresh);
  return fetch(url, init);
}

export function startGoogleSignIn(callbackUrl = "/auth/google-callback") {
  window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
