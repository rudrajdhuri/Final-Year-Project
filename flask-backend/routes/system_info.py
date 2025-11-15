#GET/api/system/info
from flask import Blueprint, jsonify
from services.system_service import get_system_info

system_info_bp = Blueprint("system_info_bp", __name__)

@system_info_bp.route("/info", methods=["GET"])
def system_info():
    data = get_system_info()
    return jsonify(data)
