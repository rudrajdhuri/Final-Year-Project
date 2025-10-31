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
      setLoading(true);
      setError(null);
      
      const res = await fetch(
        "https://newsdata.io/api/1/latest?apikey=pub_ebfad28c3bf24c49919265631c02a657&q=weather forecast agriculture"
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.status === "success" && data.results) {
        setArticles(data.results.slice(0, 6)); // Limit to 6 articles
      } else {
        throw new Error("Failed to fetch news data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather news");
      console.error("Weather news fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Cloud className="mr-2 h-5 w-5 text-blue-500" />
            Weather Forecast News
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 text-blue-500 animate-spin mr-2" />
          <span className="text-gray-600">Loading weather news...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Cloud className="mr-2 h-5 w-5 text-blue-500" />
            Weather Forecast News
          </h2>
          <button
            onClick={fetchNews}
            className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️ {error}</div>
          <button
            onClick={fetchNews}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            Click to retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Cloud className="mr-2 h-5 w-5 text-blue-500" />
          Weather Forecast News
        </h2>
        <button
          onClick={fetchNews}
          className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      {articles.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {articles.map((article, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {article.image_url && (
                  <div className="flex-shrink-0">
                    <img 
                      src={article.image_url} 
                      alt={article.title}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-gray-600 text-xs mb-2" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(article.pubDate)}
                    </div>
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-500 hover:text-blue-600 text-xs font-medium"
                    >
                      Read more
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Cloud className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No weather news found.</p>
          <button
            onClick={fetchNews}
            className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
          >
            Try refreshing
          </button>
        </div>
      )}
    </div>
  );
}