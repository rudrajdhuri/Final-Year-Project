# #GET/api/soil/readings=>live soil data
# from flask import Blueprint, jsonify, request
# from services.esp32_bridge import get_sensor_history
# from services.soil_service import get_soil_readings

# soil_readings_bp = Blueprint("soil_readings_bp", __name__)

# @soil_readings_bp.route("/readings", methods=["GET"])
# def soil_readings():
#     user_id = request.args.get("user_id")
#     data = get_soil_readings(user_id=user_id if user_id and user_id != "guest" else None)
#     return jsonify(data)


# @soil_readings_bp.route("/history", methods=["GET"])
# def soil_history():
#     user_id = request.args.get("user_id")
#     limit = int(request.args.get("limit", "10"))
#     return jsonify({"success": True, "data": get_sensor_history(limit, user_id=user_id if user_id and user_id != "guest" else None)})



from flask import Blueprint, jsonify, request
from services.esp32_bridge import get_sensor_history
from services.soil_service import get_soil_readings

soil_readings_bp = Blueprint("soil_readings_bp", __name__)


@soil_readings_bp.route("/readings", methods=["GET"])
def soil_readings():
    user_id = request.args.get("user_id")
    session_id = request.args.get("session_id")
    data = get_soil_readings(
        user_id=user_id if user_id and user_id != "guest" else None,
        owner_session_id=session_id,
    )
    return jsonify(data)


@soil_readings_bp.route("/history", methods=["GET"])
def soil_history():
    user_id = request.args.get("user_id")
    session_id = request.args.get("session_id")
    limit = int(request.args.get("limit", "10"))
    return jsonify(
        {
            "success": True,
            "data": get_sensor_history(
                limit,
                user_id=user_id if user_id and user_id != "guest" else None,
                owner_session_id=session_id,
            ),
        }
    )
