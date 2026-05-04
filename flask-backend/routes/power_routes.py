import subprocess
from pathlib import Path

from flask import Blueprint, jsonify, request

from services.session_lock_service import get_lock_status


power_bp = Blueprint("power_bp", __name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SHUTDOWN_SCRIPT = PROJECT_ROOT / "scripts" / "shutdown-agribot.sh"


@power_bp.route("/shutdown", methods=["POST"])
def shutdown_agribot():
    data = request.get_json(silent=True) or {}
    if data.get("confirm") is not True:
        return jsonify({"success": False, "error": "Shutdown confirmation is required"}), 400

    session_id = data.get("session_id")
    lock_status = get_lock_status(session_id)
    if lock_status.get("locked") and not lock_status.get("owner"):
        return jsonify(
            {
                "success": False,
                "error": "Bot is in use by someone. Please try after sometime.",
                "status": lock_status,
            }
        ), 423

    script_path = DEFAULT_SHUTDOWN_SCRIPT
    if not script_path.exists():
        return jsonify({"success": False, "error": f"Shutdown script not found: {script_path}"}), 500

    try:
        subprocess.Popen(
            ["bash", str(script_path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            cwd=str(PROJECT_ROOT),
            start_new_session=True,
        )
        return jsonify({"success": True, "message": "Agri Bot shutdown has been requested"})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500
