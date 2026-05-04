from flask import Blueprint, jsonify, request, Response

from services.live_detection_service import (
    frame_stream_response,
    frame_snapshot_response,
    get_all_detection_status,
    get_detection_status,
    start_detection,
    stop_detection,
)
from services.session_lock_service import acquire_lock, heartbeat_lock, release_lock, require_lock_owner


auto_detection_bp = Blueprint("auto_detection", __name__)


@auto_detection_bp.route("/start/<mode>", methods=["POST"])
def start_auto(mode):
    if mode not in ("animal", "plant"):
        return jsonify({"success": False, "error": "Invalid mode"}), 400

    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "guest")
    session_id = data.get("session_id")
    lock_acquired = False

    try:
        acquire_lock("model_manual", user_id=user_id, session_id=session_id)
        lock_acquired = True
        status = start_detection(mode, user_id, owner_session_id=session_id)
        heartbeat_lock(session_id, user_id)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except RuntimeError as exc:
        if lock_acquired:
            release_lock(session_id)
        return jsonify({"success": False, "error": str(exc)}), 423
    except Exception as exc:
        if lock_acquired:
            release_lock(session_id)
        return jsonify({"success": False, "error": str(exc)}), 500

    return jsonify({"success": True, "message": f"{mode.title()} detection started", "status": status})


@auto_detection_bp.route("/stop/<mode>", methods=["POST"])
def stop_auto(mode):
    if mode not in ("animal", "plant", "all"):
        return jsonify({"success": False, "error": "Invalid mode"}), 400

    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    try:
        if session_id:
            require_lock_owner(session_id)
        status = stop_detection(mode, owner_session_id=session_id)
        if mode == "all" or not any(item["running"] for item in status.values() if isinstance(item, dict)):
            release_lock(session_id)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc)}), 423

    return jsonify({"success": True, "message": f"Stopped {mode}", "status": status})


@auto_detection_bp.route("/status/<mode>", methods=["GET"])
def get_status(mode):
    if mode not in ("animal", "plant"):
        return jsonify({"success": False, "error": "Invalid mode"}), 400

    try:
        status = get_detection_status(mode, request.args.get("session_id"))
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

    return jsonify(status)


@auto_detection_bp.route("/status", methods=["GET"])
def get_all_status():
    return jsonify(get_all_detection_status(request.args.get("session_id")))


@auto_detection_bp.route("/stream", methods=["GET"])
def live_stream():
    return frame_stream_response(request.args.get("session_id"))


@auto_detection_bp.route("/snapshot", methods=["GET"])
def snapshot():
    return frame_snapshot_response(request.args.get("session_id"))
