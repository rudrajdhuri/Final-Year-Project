"use client";

const HOTSPOT_API_URL = "http://10.42.0.1:5000";
const DEV_API_URL = "http://127.0.0.1:5000";
const CACHE_KEY = "agribot_api_target";
const PROBE_PATH = "/api/bots";

type ApiTarget =
  | { mode: "local"; base: string }
  | { mode: "proxy"; base: "" };

let resolvedTarget: ApiTarget | null = null;
let resolvingPromise: Promise<ApiTarget> | null = null;

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

function candidateLocalBases() {
  const savedUrl = typeof window !== "undefined"
    ? sanitizeUrl(sessionStorage.getItem(CACHE_KEY) || "")
    : "";
  const hostUrl = typeof window !== "undefined" && window.location.hostname
    ? sanitizeUrl(`http://${window.location.hostname}:5000`)
    : "";

  return [savedUrl, HOTSPOT_API_URL, hostUrl, DEV_API_URL].filter(
    (url, index, arr) => url && arr.indexOf(url) === index
  );
}

function isHostedSecureFrontend() {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:";
}

export async function resolveApiTarget(forceRefresh = false) {
  if (!forceRefresh && resolvedTarget) return resolvedTarget;
  if (!forceRefresh && resolvingPromise) return resolvingPromise;

  resolvingPromise = (async () => {
    if (!isHostedSecureFrontend()) {
      for (const base of candidateLocalBases()) {
        if (await probe(base)) {
          resolvedTarget = { mode: "local", base: sanitizeUrl(base) };
          if (typeof window !== "undefined") {
            sessionStorage.setItem(CACHE_KEY, resolvedTarget.base);
          }
          return resolvedTarget;
        }
      }
    }

    resolvedTarget = { mode: "proxy", base: "" };
    return resolvedTarget;
  })();

  try {
    return await resolvingPromise;
  } finally {
    resolvingPromise = null;
  }
}

export async function resolveApiBase(forceRefresh = false) {
  const target = await resolveApiTarget(forceRefresh);
  if (target.mode === "local") {
    return target.base;
  }
  return "";
}

export async function getApiUrl(path: string, forceRefresh = false) {
  const target = await resolveApiTarget(forceRefresh);
  if (target.mode === "local") {
    return `${target.base}${path}`;
  }
  return `/api/proxy${path}`;
}

export async function apiFetch(path: string, init?: RequestInit, forceRefresh = false) {
  const url = await getApiUrl(path, forceRefresh);
  return fetch(url, init);
}

export function startGoogleSignIn(callbackUrl = "/auth/google-callback") {
  window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
