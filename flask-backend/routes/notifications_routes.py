# from flask import Blueprint, jsonify, request

# from services.notifications_service import get_notifications


# notifications_bp = Blueprint("notifications_bp", __name__)


# @notifications_bp.route("/notifications", methods=["GET"])
# def notifications():
#     user_id = request.args.get("user_id")
#     return jsonify({"success": True, "data": get_notifications(user_id=user_id)})


from flask import Blueprint, jsonify, request
from services.notifications_service import get_notifications

notifications_bp = Blueprint("notifications_bp", __name__)

@notifications_bp.route("/notifications", methods=["GET"])
def notifications():
    user_id = request.args.get("user_id")
    session_id = request.args.get("session_id")
    return jsonify({"success": True, "data": get_notifications(user_id=user_id, session_id=session_id)})
