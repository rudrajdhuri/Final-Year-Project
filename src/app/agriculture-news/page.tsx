'use client';

import { Newspaper, Calendar, ExternalLink, Cloud, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || "http://10.42.0.1:5000";
console.log("Using API:", API);

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  image: string;
  publishedAt: string;
  content: string;
}

interface WeatherNewsArticle {
  title: string;
  description: string;
  image_url?: string;
  link: string;
  pubDate: string;
}

export default function AgricultureNewsPage() {
  const [agriNews, setAgriNews]         = useState<NewsArticle[]>([]);
  const [agriLoading, setAgriLoading]   = useState(true);
  const [agriError, setAgriError]       = useState<string | null>(null);

  const [weatherNews, setWeatherNews]       = useState<WeatherNewsArticle[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError]     = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Agriculture', 'Weather'];

  const fetchAgricultureNews = async () => {
    try {
      setAgriLoading(true); setAgriError(null);
      const res = await fetch(`${API}/api/agri-news`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setAgriNews(await res.json());
    } catch (err) {
      setAgriError(err instanceof Error ? err.message : "Failed to fetch agriculture news");
    } finally {
      setAgriLoading(false);
    }
  };

  const fetchWeatherNews = async () => {
    try {
      setWeatherLoading(true); setWeatherError(null);
      const res = await fetch(`${API}/api/weather-news`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.status === "success" && data.results) {
        setWeatherNews(data.results.slice(0, 8));
      } else {
        throw new Error("Failed to fetch weather news data");
      }
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : "Failed to fetch weather news");
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchAgricultureNews();
    fetchWeatherNews();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Newspaper className="h-7 w-7 text-gray-700 dark:text-gray-300" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Agriculture News</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Stay informed with the latest agricultural developments and innovations
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                cat === selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Agriculture News ── */}
        {(selectedCategory === 'All' || selectedCategory === 'Agriculture') && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Agriculture News</h2>
              </div>
              <button
                onClick={fetchAgricultureNews}
                disabled={agriLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${agriLoading ? 'animate-spin' : ''}`} />
                {agriLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {agriLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200 dark:bg-gray-800" />
                    <div className="p-5 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : agriError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 text-center">
                <p className="text-red-600 dark:text-red-400 text-sm mb-2">⚠️ {agriError}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Make sure Flask server is running</p>
                <button onClick={fetchAgricultureNews} className="text-blue-600 dark:text-blue-400 text-sm font-medium">Try Again</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {agriNews.map((article, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md dark:hover:border-gray-700 transition-all duration-200">
                    {article.image && (
                      <div className="h-44 overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-medium px-2 py-0.5 rounded-full">
                        {article.source}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-2 mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-3">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <a href={article.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium">
                          Read More <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Weather News ── */}
        {(selectedCategory === 'All' || selectedCategory === 'Weather') && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Weather Forecast News</h2>
              </div>
              <button
                onClick={fetchWeatherNews}
                disabled={weatherLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
                {weatherLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {weatherLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2 w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : weatherError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 text-center">
                <p className="text-red-600 dark:text-red-400 text-sm mb-2">⚠️ {weatherError}</p>
                <button onClick={fetchWeatherNews} className="text-blue-600 dark:text-blue-400 text-sm font-medium">Try Again</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {weatherNews.map((article, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md dark:hover:border-gray-700 transition-all duration-200">
                    {article.image_url && (
                      <div className="h-32 overflow-hidden">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
                        Weather
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mt-2 mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-3">
                          {article.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(article.pubDate)}
                        </div>
                        <a href={article.link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 text-xs font-medium">
                          Read <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}