from flask import Blueprint, jsonify, request

from services.live_detection_service import (
    frame_stream_response,
    get_all_detection_status,
    get_detection_status,
    start_detection,
    stop_detection,
)


auto_detection_bp = Blueprint("auto_detection", __name__)


@auto_detection_bp.route("/start/<mode>", methods=["POST"])
def start_auto(mode):
    if mode not in ("animal", "plant"):
        return jsonify({"success": False, "error": "Invalid mode"}), 400

    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "guest")

    try:
        status = start_detection(mode, user_id)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500

    return jsonify({"success": True, "message": f"{mode.title()} detection started", "status": status})


@auto_detection_bp.route("/stop/<mode>", methods=["POST"])
def stop_auto(mode):
    if mode not in ("animal", "plant", "all"):
        return jsonify({"success": False, "error": "Invalid mode"}), 400

    try:
        status = stop_detection(mode)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

    return jsonify({"success": True, "message": f"Stopped {mode}", "status": status})


@auto_detection_bp.route("/status/<mode>", methods=["GET"])
def get_status(mode):
    if mode not in ("animal", "plant"):
        return jsonify({"success": False, "error": "Invalid mode"}), 400

    try:
        status = get_detection_status(mode)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

    return jsonify(status)


@auto_detection_bp.route("/status", methods=["GET"])
def get_all_status():
    return jsonify(get_all_detection_status())


@auto_detection_bp.route("/stream", methods=["GET"])
def live_stream():
    return frame_stream_response()
