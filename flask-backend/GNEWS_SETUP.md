# News APIs Setup Guide

This application uses two APIs to fetch real-time news and weather data:
1. **GNews API** - For agriculture news articles
2. **WeatherAPI** - For weather forecasts with agricultural impact

---

## 1. GNews API Setup (Agriculture News)

### Steps to Get Your API Key:

1. **Visit GNews.io**: Go to [https://gnews.io/](https://gnews.io/)

2. **Sign Up for Free**: Click "Get API Key" or "Sign Up" button
   - Free tier includes: **100 requests per day**
   - No credit card required

3. **Get Your API Key**: After signing up, you'll receive your API key on the dashboard

4. **Add to .env File**: Open `flask-backend/.env` and replace the placeholder:
   ```
   GNEWS_API_KEY=your_actual_api_key_here
   ```

### How It Works:

- Fetches agriculture news using the keyword **"agriculture"**
- Results are limited to **10 articles** per request
- Articles include: title, description, source, image, publish date, and URL
- If API fails or key is invalid, fallback news data is shown

---

## 2. WeatherAPI Setup (Weather Forecast News)

### Steps to Get Your API Key:

1. **Visit WeatherAPI.com**: Go to [https://www.weatherapi.com/](https://www.weatherapi.com/)

2. **Sign Up for Free**: Click "Sign Up" button
   - Free tier includes: **1,000,000 API calls per month**
   - No credit card required

3. **Get Your API Key**: After signing up, find your API key in the dashboard

4. **Add to .env File**: Open `flask-backend/.env` and replace the placeholder:
   ```
   WEATHER_API_KEY=your_actual_api_key_here
   ```

### How It Works:

- Fetches 3-day weather forecasts for major agricultural regions:
  - Iowa (Corn/Soybean)
  - California (Fruits/Vegetables)
  - Texas (Cotton/Cattle)
  - Kansas (Wheat)
  - Nebraska (Corn/Cattle)
- Provides agricultural impact assessments:
  - ⚠️ High precipitation warnings
  - 🌡️ Temperature alerts
  - ❄️ Frost risk notifications
  - ✅ Favorable conditions indicators
- Falls back to weather news articles if WeatherAPI key not configured

---

## Complete .env File Example:

```env
# GNews API Configuration
GNEWS_API_KEY=28d5f21bc8eb5af67404cde44da7cc94

# WeatherAPI Configuration  
WEATHER_API_KEY=your_actual_weather_api_key_here
```

---

## Test the APIs:

1. Make sure both API keys are set in `.env`
2. Restart Flask server if running
3. Go to http://localhost:3000/agriculture-news
4. You should see:
   - **Agriculture News** section with real news from GNews
   - **Weather Forecast News** section with weather data from WeatherAPI

---

## API Comparison:

### GNews API
| Feature | Free Tier |
|---------|-----------|
| Requests/day | 100 |
| Article limit | 10 per request |
| Search queries | Yes |
| Images | Yes |
| Historical data | No |

### WeatherAPI
| Feature | Free Tier |
|---------|-----------|
| Requests/month | 1,000,000 |
| Forecast days | 3 days |
| Historical data | No |
| Weather alerts | Yes |
| Hourly forecast | Yes |

---

## Troubleshooting:

### Agriculture News Issues:
- **No articles shown**: Check that GNEWS_API_KEY is correct in `.env`
- **Rate limit exceeded**: Free tier has 100 requests/day limit
- **Fallback data shown**: API key not configured or API request failed

### Weather News Issues:
- **Shows news articles instead of forecasts**: WEATHER_API_KEY not configured (will use NewsData API fallback)
- **No weather data**: Check that WEATHER_API_KEY is correct in `.env`
- **API error**: Verify API key is active on WeatherAPI dashboard

### General Issues:
- **Error message**: Ensure Flask server is running
- **"Failed to fetch"**: Check `.env` file exists in `flask-backend/` folder
- **Changes not appearing**: Restart Flask server to reload environment variables

---

## Next Steps:

Both free tiers are generous enough for development and testing. For production:
- Consider caching responses to reduce API calls
- Monitor usage on respective dashboards
- Upgrade to paid plans if needed for higher limits

