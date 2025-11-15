import requests

API_KEY = "pub_ebfad28c3bf24c49919265631c02a657"
BASE_URL = "https://newsdata.io/api/1/latest"

def fetch_weather_news():
    params = {
        "apikey": API_KEY,
        "q": "weather forecast agriculture"
    }
    
    response = requests.get(BASE_URL, params=params, timeout=10)
    
    if response.status_code != 200:
        raise Exception(f"Failed with status {response.status_code}")
    
    data = response.json()
    
    if data.get("status") != "success":
        raise Exception("News API returned an error")
    
    # limit 8 articles
    articles = data.get("results", [])[:8] 
    
    # standardize structure
    formatted = []
    for item in articles:
        formatted.append({
            "title": item.get("title"),
            "description": item.get("description"),
            "link": item.get("link"),
            "pubDate": item.get("pubDate"),
            "image_url": item.get("image_url")
        })
    
    return formatted
