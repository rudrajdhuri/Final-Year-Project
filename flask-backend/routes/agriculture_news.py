from flask import Blueprint, jsonify
from services.agriculture_news_service import get_agriculture_news

agriculture_bp = Blueprint("agriculture_bp", __name__)

@agriculture_bp.route("/agri-news", methods=["GET"])
def agriculture_news():
    news = get_agriculture_news()
    return jsonify(news)
