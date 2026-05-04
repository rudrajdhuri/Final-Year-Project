
# # routes/bots_routes.py

# from flask import Blueprint, jsonify, request
# from services.bots_service import (
#     get_all_bots,
#     get_bot_by_id,
#     add_bot,
#     update_bot,
#     log_bot_command
# )
# from services.autonomous_service import (
#     get_autonomous_status,
#     get_manual_recording_status,
#     get_profiles,
#     start_autonomous,
#     start_manual_recording,
#     stop_autonomous,
#     stop_manual_recording,
# )

# bots_bp = Blueprint("bots_bp", __name__)

# @bots_bp.route("/bots", methods=["GET"])
# def get_bots():
#     return jsonify(get_all_bots()), 200


# @bots_bp.route("/bots/<bot_id>", methods=["GET"])
# def get_bot(bot_id):
#     bot = get_bot_by_id(bot_id)
#     if not bot:
#         return jsonify({"error": "Bot not found"}), 404
#     return jsonify(bot)


# @bots_bp.route("/bots", methods=["POST"])
# def create_bot():
#     data = request.json
#     bot = add_bot(data)
#     return jsonify(bot), 201


# @bots_bp.route("/bots/<bot_id>", methods=["PUT"])
# def update_bot_route(bot_id):
#     data = request.json
#     bot = update_bot(bot_id, data)
#     if not bot:
#         return jsonify({"error": "Bot not found"}), 404
#     return jsonify(bot)


# @bots_bp.route("/bots/command", methods=["POST"])
# def log_bot_command_route():
#     data = request.get_json() or {}
#     payload = log_bot_command(data)
#     return jsonify({"success": True, "data": payload}), 201


# @bots_bp.route("/bots/training/start", methods=["POST"])
# def start_training_route():
#     data = request.get_json(silent=True) or {}
#     try:
#         status = start_manual_recording(data.get("user_id", "guest"))
#         return jsonify({"success": True, "status": status}), 200
#     except RuntimeError as exc:
#         return jsonify({"success": False, "error": str(exc)}), 400


# @bots_bp.route("/bots/training/stop", methods=["POST"])
# def stop_training_route():
#     data = request.get_json(silent=True) or {}
#     try:
#         result = stop_manual_recording(data.get("profile_name", ""))
#         return jsonify(result), 200
#     except RuntimeError as exc:
#         return jsonify({"success": False, "error": str(exc)}), 400


# @bots_bp.route("/bots/training/status", methods=["GET"])
# def training_status_route():
#     return jsonify({"success": True, "status": get_manual_recording_status()}), 200


# @bots_bp.route("/bots/profiles", methods=["GET"])
# def profiles_route():
#     user_id = request.args.get("user_id", "guest")
#     return jsonify({"success": True, "profiles": get_profiles(user_id)}), 200


# @bots_bp.route("/bots/autonomous/start", methods=["POST"])
# def autonomous_start_route():
#     data = request.get_json(silent=True) or {}
#     try:
#         status = start_autonomous(
#             profile_id=data.get("profile_id", ""),
#             user_id=data.get("user_id", "guest"),
#         )
#         return jsonify({"success": True, "status": status}), 200
#     except RuntimeError as exc:
#         return jsonify({"success": False, "error": str(exc)}), 400


# @bots_bp.route("/bots/autonomous/stop", methods=["POST"])
# def autonomous_stop_route():
#     status = stop_autonomous()
#     return jsonify({"success": True, "status": status}), 200


# @bots_bp.route("/bots/autonomous/status", methods=["GET"])
# def autonomous_status_route():
#     return jsonify({"success": True, "status": get_autonomous_status()}), 200



from flask import Blueprint, jsonify, request
from services.bots_service import (
    get_all_bots,
    get_bot_by_id,
    add_bot,
    update_bot,
    log_bot_command,
)
from services.autonomous_service import (
    get_autonomous_status,
    get_manual_recording_status,
    get_profiles,
    start_autonomous,
    start_manual_recording,
    stop_autonomous,
    stop_manual_recording,
)
from services.session_lock_service import acquire_lock, heartbeat_lock, release_lock, require_lock_owner

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


@bots_bp.route("/bots/command", methods=["POST"])
def log_bot_command_route():
    data = request.get_json() or {}
    payload = log_bot_command(data)
    return jsonify({"success": True, "data": payload}), 201


@bots_bp.route("/bots/training/start", methods=["POST"])
def start_training_route():
    data = request.get_json(silent=True) or {}
    try:
        session_id = data.get("session_id")
        require_lock_owner(session_id)
        status = start_manual_recording(data.get("user_id", "guest"), owner_session_id=session_id)
        heartbeat_lock(session_id, data.get("user_id", "guest"))
        return jsonify({"success": True, "status": status}), 200
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc)}), 423


@bots_bp.route("/bots/training/stop", methods=["POST"])
def stop_training_route():
    data = request.get_json(silent=True) or {}
    try:
        require_lock_owner(data.get("session_id"))
        result = stop_manual_recording(data.get("profile_name", ""))
        return jsonify(result), 200
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc)}), 423


@bots_bp.route("/bots/training/status", methods=["GET"])
def training_status_route():
    return jsonify({"success": True, "status": get_manual_recording_status()}), 200


@bots_bp.route("/bots/profiles", methods=["GET"])
def profiles_route():
    user_id = request.args.get("user_id")
    return jsonify({"success": True, "profiles": get_profiles(user_id=user_id, owner_session_id=request.args.get("session_id"))}), 200


@bots_bp.route("/bots/autonomous/start", methods=["POST"])
def autonomous_start_route():
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    lock_acquired = False
    try:
        acquire_lock("autonomous", user_id=data.get("user_id", "guest"), session_id=session_id)
        lock_acquired = True
        status = start_autonomous(
            profile_id=data.get("profile_id", ""),
            user_id=data.get("user_id", "guest"),
            owner_session_id=session_id,
        )
        heartbeat_lock(session_id, data.get("user_id", "guest"))
        return jsonify({"success": True, "status": status}), 200
    except RuntimeError as exc:
        if lock_acquired:
            release_lock(session_id)
        return jsonify({"success": False, "error": str(exc)}), 423


@bots_bp.route("/bots/autonomous/stop", methods=["POST"])
def autonomous_stop_route():
    data = request.get_json(silent=True) or {}
    try:
        require_lock_owner(data.get("session_id"))
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc)}), 423
    status = stop_autonomous()
    release_lock(data.get("session_id"))
    return jsonify({"success": True, "status": status}), 200


@bots_bp.route("/bots/autonomous/status", methods=["GET"])
def autonomous_status_route():
    return jsonify({"success": True, "status": get_autonomous_status(request.args.get("session_id"))}), 200
