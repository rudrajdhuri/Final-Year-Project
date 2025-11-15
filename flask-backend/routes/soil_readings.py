#GET/api/soil/readings=>live soil data
from flask import Blueprint, jsonify
from services.soil_service import get_soil_readings

soil_readings_bp = Blueprint("soil_readings_bp", __name__)

@soil_readings_bp.route("/readings", methods=["GET"])
def soil_readings():
    data = get_soil_readings()
    return jsonify(data)
