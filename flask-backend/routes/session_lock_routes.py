from flask import Blueprint, jsonify, request

from services.session_lock_service import (
    acquire_lock,
    get_lock_status,
    heartbeat_lock,
    release_lock,
)


session_lock_bp = Blueprint("session_lock", __name__)


@session_lock_bp.route("/session/status", methods=["GET"])
def lock_status_route():
    session_id = request.args.get("session_id")
    return jsonify({"success": True, "status": get_lock_status(session_id)}), 200


@session_lock_bp.route("/session/acquire", methods=["POST"])
def acquire_lock_route():
    data = request.get_json(silent=True) or {}
    try:
        status = acquire_lock(
            lock_type=data.get("lock_type", ""),
            user_id=data.get("user_id", "guest"),
            session_id=data.get("session_id"),
        )
        return jsonify({"success": True, "status": status}), 200
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc), "status": get_lock_status(data.get("session_id"))}), 423


@session_lock_bp.route("/session/heartbeat", methods=["POST"])
def heartbeat_lock_route():
    data = request.get_json(silent=True) or {}
    try:
        status = heartbeat_lock(data.get("session_id"), data.get("user_id"))
        return jsonify({"success": True, "status": status}), 200
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc), "status": get_lock_status(data.get("session_id"))}), 423


@session_lock_bp.route("/session/release", methods=["POST"])
def release_lock_route():
    data = request.get_json(silent=True) or {}
    try:
        status = release_lock(data.get("session_id"))
        return jsonify({"success": True, "status": status}), 200
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc), "status": get_lock_status(data.get("session_id"))}), 400
