'use client';

import { Newspaper, Calendar, User, ExternalLink, Cloud, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import DashboardLayout from '../layout-with-sidebar';

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
  const [agriNews, setAgriNews] = useState<NewsArticle[]>([]);
  const [agriLoading, setAgriLoading] = useState(true);
  const [agriError, setAgriError] = useState<string | null>(null);
  
  const [weatherNews, setWeatherNews] = useState<WeatherNewsArticle[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Agriculture', 'Weather'];

  const fetchAgricultureNews = async () => {
    try {
      setAgriLoading(true);
      setAgriError(null);
      
      const res = await fetch("http://127.0.0.1:5000/api/agri-news");
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setAgriNews(data);
    } catch (err) {
      setAgriError(err instanceof Error ? err.message : "Failed to fetch agriculture news");
      console.error("Agriculture news fetch error:", err);
    } finally {
      setAgriLoading(false);
    }
  };

  const fetchWeatherNews = async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      
      const res = await fetch("http://localhost:5000/api/weather-news");

      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setWeatherNews(data.articles);

      
      if (data.status === "success" && data.results) {
        setWeatherNews(data.results.slice(0, 8)); // Limit to 8 articles
      } else {
        throw new Error("Failed to fetch weather news data");
      }
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : "Failed to fetch weather news");
      console.error("Weather news fetch error:", err);
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
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };
  return (
    <DashboardLayout>
      <div className="bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Newspaper className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Agriculture News</h1>
          </div>
          <p className="text-gray-600">Stay informed with the latest agricultural developments and innovations</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === selectedCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Agriculture News Section */}
        {(selectedCategory === 'All' || selectedCategory === 'Agriculture') && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Newspaper className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Agriculture News</h2>
              </div>
              <button
                onClick={fetchAgricultureNews}
                disabled={agriLoading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${agriLoading ? 'animate-spin' : ''}`} />
                {agriLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {agriLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : agriError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 mb-2">⚠️ {agriError}</p>
                <p className="text-sm text-gray-600 mb-3">Make sure Flask server is running and GNews API key is configured</p>
                <button
                  onClick={fetchAgricultureNews}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agriNews.map((article, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {article.image && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={article.image} 
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f3f4f6" width="400" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" dy="50%25" dx="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="mb-3">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          {article.source}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(article.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Read More
                          <ExternalLink className="h-4 w-4 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Weather Forecast News Section */}
        {(selectedCategory === 'All' || selectedCategory === 'Weather') && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Cloud className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900">Weather Forecast News</h2>
              </div>
              <button
                onClick={fetchWeatherNews}
                disabled={weatherLoading}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${weatherLoading ? 'animate-spin' : ''}`} />
                {weatherLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {weatherLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : weatherError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 mb-2">⚠️ {weatherError}</p>
                <button
                  onClick={fetchWeatherNews}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {weatherNews.map((article, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    {article.image_url && (
                      <div className="h-32 overflow-hidden rounded-t-lg">
                        <img 
                          src={article.image_url} 
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          Weather
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-gray-600 text-xs mb-3" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
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
                          Read
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Load More Button - only show for Agriculture news */}
        {selectedCategory === 'Agriculture' && agriNews.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">Showing {agriNews.length} articles</p>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}