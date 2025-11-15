from flask import Blueprint, jsonify
from services.weather_news_service import fetch_weather_news

weather_news_bp = Blueprint("weather_news_bp", __name__)

@weather_news_bp.route("/weather-news", methods=["GET"])
def weather_news():
    try:
        articles = fetch_weather_news()
        return jsonify({"status": "success", "articles": articles})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
