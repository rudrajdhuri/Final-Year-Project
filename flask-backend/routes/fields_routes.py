# routes/fields_routes.py

from flask import Blueprint, jsonify
from services.fields_service import generate_field_data

fields_bp = Blueprint("fields_bp", __name__)

@fields_bp.route("/fields", methods=["GET"])
def get_fields():
    return jsonify(generate_field_data()), 200
