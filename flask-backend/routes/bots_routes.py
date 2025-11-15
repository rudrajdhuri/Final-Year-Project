
# routes/bots_routes.py

from flask import Blueprint, jsonify, request
from services.bots_service import (
    get_all_bots,
    get_bot_by_id,
    add_bot,
    update_bot
)

bots_bp = Blueprint("bots_bp", __name__)

@bots_bp.route("/bots", methods=["GET"])
def get_bots():
    return jsonify(get_all_bots()), 200


@bots_bp.route("/bots/<bot_id>", methods=["GET"])
def get_bot(bot_id):
    bot = get_bot_by_id(bot_id)
    if not bot:
        return jsonify({"error": "Bot not found"}), 404
    return jsonify(bot)


@bots_bp.route("/bots", methods=["POST"])
def create_bot():
    data = request.json
    bot = add_bot(data)
    return jsonify(bot), 201


@bots_bp.route("/bots/<bot_id>", methods=["PUT"])
def update_bot_route(bot_id):
    data = request.json
    bot = update_bot(bot_id, data)
    if not bot:
        return jsonify({"error": "Bot not found"}), 404
    return jsonify(bot)
