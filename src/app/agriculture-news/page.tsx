'use client';

import { useEffect, useState } from 'react';
import { Calendar, ExternalLink, Newspaper, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const GNEWS_API_KEY = process.env.NEXT_PUBLIC_GNEWS_API_KEY || '';

interface NewsArticle {
  title: string;
  description: string;
  source?: { name?: string };
  url: string;
  image?: string;
  publishedAt: string;
}

export default function AgricultureNewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const fetchAgricultureNews = async () => {
    if (!isOnline) {
      setError("No Internet - These features require internet");
      return;
    }
    if (!GNEWS_API_KEY) {
      setError("GNews API key is missing.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `https://gnews.io/api/v4/search?q=agriculture%20OR%20farming%20OR%20crop&lang=en&country=in&max=9&apikey=${GNEWS_API_KEY}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.errors?.[0] || "Failed to fetch agriculture news");
      }
      setNews(data.articles || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch agriculture news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchAgricultureNews();
    }
  }, [isOnline]);

  return (
    <div className="min-h-full bg-gray-50 p-4 transition-colors duration-200 dark:bg-gray-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-3">
            <Newspaper className="h-7 w-7 text-gray-700 dark:text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Agricultural News</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Live headlines for agriculture and farming when internet is available.
          </p>
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

        <div className="mb-6 flex items-center justify-end">
          <button
            onClick={fetchAgricultureNews}
            disabled={!isOnline || loading}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">Warning: {error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((article, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
                {article.image && (
                  <div className="h-44 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    {article.source?.name || "GNews"}
                  </span>
                  <h3 className="mt-2 mb-1 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {article.title}
                  </h3>
                  <p className="mb-3 line-clamp-3 text-xs text-gray-500 dark:text-gray-400">
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Read More <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
