"use client";

import { useEffect, useState } from "react";
import { Cloud, Calendar, ExternalLink, RefreshCw } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  image_url?: string;
  link: string;
  pubDate: string;
}

export default function WeatherNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch("http://localhost:5000/api/weather-news");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.status === "success" && data.results) {
        setArticles(data.results.slice(0, 6));
      } else {
        throw new Error("Failed to fetch news data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" /> Weather Forecast News
          </h2>
        </div>
        <div className="flex items-center justify-center py-8 gap-2 text-gray-500 dark:text-gray-400">
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
          <span className="text-sm">Loading weather news...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" /> Weather Forecast News
          </h2>
          <button onClick={fetchNews} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-red-500 dark:text-red-400 mb-2">⚠️ {error}</p>
          <button onClick={fetchNews} className="text-blue-500 hover:text-blue-600 text-sm">Click to retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-500" /> Weather Forecast News
        </h2>
        <button onClick={fetchNews} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {articles.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {articles.map((article, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:border-gray-600 transition-all bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-3">
                {article.image_url && (
                  <div className="shrink-0">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-1 line-clamp-2">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(article.pubDate)}
                    </div>
                    <a href={article.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs font-medium">
                      Read more <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-600">
          <Cloud className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
          <p className="text-sm">No weather news found.</p>
          <button onClick={fetchNews} className="mt-2 text-blue-500 hover:text-blue-600 text-sm">Try refreshing</button>
        </div>
      )}
    </div>
  );
}