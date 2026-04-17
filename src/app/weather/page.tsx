"use client";

import { useEffect, useState } from "react";
import { CloudSun, MapPin, RefreshCw, Wifi, WifiOff } from "lucide-react";

const DEFAULT_CITY = "New Delhi";
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "";

export default function WeatherPage() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [query, setQuery] = useState(DEFAULT_CITY);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<any>(null);

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

  const fetchWeather = async (targetCity: string) => {
    if (!isOnline) {
      setError("No Internet - These features require internet");
      return;
    }

    if (!WEATHER_API_KEY) {
      setError("Weather API key is missing.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetCity)}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch weather");
      }
      setWeather(data);
      setCity(targetCity);
    } catch (err: any) {
      setError(err.message || "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchWeather(DEFAULT_CITY);
    }
  }, [isOnline]);

  return (
    <div className="min-h-full bg-gray-50 p-4 transition-colors duration-200 dark:bg-gray-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
            <CloudSun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weather API</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Live weather updates for field planning when internet is available.
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

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter city"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-amber-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={() => fetchWeather(query)}
              disabled={!isOnline || loading}
              className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
            >
              {loading ? "Loading..." : "Check Weather"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {weather && !error && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  {weather.name}, {weather.sys?.country}
                </div>
                <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{weather.main?.temp} C</h2>
                <p className="text-sm capitalize text-gray-500 dark:text-gray-400">
                  {weather.weather?.[0]?.description || "Weather summary unavailable"}
                </p>
              </div>
              <button
                onClick={() => fetchWeather(city)}
                disabled={!isOnline || loading}
                className="rounded-xl border border-gray-200 p-3 text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Feels Like", value: `${weather.main?.feels_like ?? "--"} C` },
                { label: "Humidity", value: `${weather.main?.humidity ?? "--"}%` },
                { label: "Wind", value: `${weather.wind?.speed ?? "--"} m/s` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/70">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
