'use client';

import { Newspaper, Calendar, User, ExternalLink, Cloud, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import DashboardLayout from '../layout-with-sidebar';

interface WeatherNewsArticle {
  title: string;
  description: string;
  image_url?: string;
  link: string;
  pubDate: string;
}

const newsArticles = [
  {
    id: 1,
    title: 'Revolutionary AI-Powered Crop Monitoring System Increases Yield by 25%',
    excerpt: 'New artificial intelligence technology helps farmers optimize irrigation and detect diseases early, leading to significant improvements in crop production.',
    author: 'Dr. Sarah Johnson',
    date: 'September 23, 2025',
    readTime: '5 min read',
    category: 'Technology',
    image: '/api/placeholder/400/200',
    featured: true
  },
  {
    id: 2,
    title: 'Sustainable Farming Practices Gain Momentum Worldwide',
    excerpt: 'Farmers across the globe are adopting eco-friendly methods that reduce environmental impact while maintaining productivity.',
    author: 'Michael Chen',
    date: 'September 22, 2025',
    readTime: '3 min read',
    category: 'Sustainability',
    image: '/api/placeholder/400/200'
  },
  {
    id: 3,
    title: 'Weather Patterns Show Promising Conditions for Winter Crops',
    excerpt: 'Meteorologists predict favorable weather conditions for the upcoming winter planting season across major agricultural regions.',
    author: 'Emma Rodriguez',
    date: 'September 21, 2025',
    readTime: '4 min read',
    category: 'Weather',
    image: '/api/placeholder/400/200'
  },
  {
    id: 4,
    title: 'Precision Agriculture Drones Reduce Water Usage by 30%',
    excerpt: 'Advanced drone technology equipped with multispectral cameras helps farmers apply water and nutrients more efficiently.',
    author: 'James Wilson',
    date: 'September 20, 2025',
    readTime: '6 min read',
    category: 'Technology',
    image: '/api/placeholder/400/200'
  },
  {
    id: 5,
    title: 'Organic Produce Demand Reaches All-Time High',
    excerpt: 'Consumer preference for organic foods continues to drive market growth, creating new opportunities for sustainable farmers.',
    author: 'Lisa Thompson',
    date: 'September 19, 2025',
    readTime: '4 min read',
    category: 'Market Trends',
    image: '/api/placeholder/400/200'
  }
];

const categories = ['All', 'Technology', 'Sustainability', 'Weather', 'Market Trends'];

export default function AgricultureNewsPage() {
  const [weatherNews, setWeatherNews] = useState<WeatherNewsArticle[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

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

        {/* Featured Article */}
        {(selectedCategory === 'All' || selectedCategory === newsArticles[0].category) && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="h-64 md:h-full bg-gradient-to-br from-green-400 to-blue-500"></div>
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      Featured
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {newsArticles[0].category}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {newsArticles[0].title}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {newsArticles[0].excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{newsArticles[0].author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{newsArticles[0].date}</span>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                      <span>Read More</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
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

        {/* Regular News Grid */}
        {selectedCategory === 'All' && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Agriculture News</h2>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsArticles.slice(1)
            .filter(article => selectedCategory === 'All' || article.category === selectedCategory)
            .map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
              <div className="p-6">
                <div className="mb-3">
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                    {article.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                  <span>{article.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Load More {selectedCategory === 'All' ? 'Articles' : selectedCategory + ' Articles'}
          </button>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}