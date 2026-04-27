from flask import Blueprint, jsonify

from services.notifications_service import get_notifications


notifications_bp = Blueprint("notifications_bp", __name__)


@notifications_bp.route("/notifications", methods=["GET"])
def notifications():
    return jsonify({"success": True, "data": get_notifications()})
