import base64
import os
import uuid

import cv2
import numpy as np
from flask import Blueprint, jsonify, request, send_from_directory

from database import COLLECTIONS, get_collection, limit_collection
from services.buzzer_service import buzz
from services.camera_service import capture_single_frame
from services.time_service import iso_ist, now_ist


plant_detection_bp = Blueprint("plant_detection", __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
_plant_predictor = None


def _get_predictor():
    global _plant_predictor
    if _plant_predictor is None:
        from models.plant_main import predict as plant_predict

        _plant_predictor = plant_predict
    return _plant_predictor


def _image_to_b64(filepath: str, max_size: int = 400) -> str:
    try:
        img = cv2.imread(filepath)
        if img is None:
            return ""
        height, width = img.shape[:2]
        if max(height, width) > max_size:
            scale = max_size / max(height, width)
            img = cv2.resize(img, (int(width * scale), int(height * scale)))
        _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 75])
        return "data:image/jpeg;base64," + base64.b64encode(buffer).decode()
    except Exception:
        return ""


def _save_and_cleanup(user_id, result_text, confidence_value, filepath, filename, owner_session_id=None):
    image_b64 = _image_to_b64(filepath)
    plant_col = get_collection(COLLECTIONS["PLANTS"])
    plant_col.insert_one(
        {
            "user_id": user_id,
            "result": result_text,
            "confidence": confidence_value,
            "filename": filename,
            "image_b64": image_b64,
            "timestamp": now_ist(),
            "owner_session_id": owner_session_id,
            "source": "camera",
        }
    )
    limit_collection(COLLECTIONS["PLANTS"])

    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass

    return image_b64


def _save_frame_and_predict(image, user_id: str, filename_prefix: str, owner_session_id=None):
    filename = f"{filename_prefix}_{uuid.uuid4().hex[:10]}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    cv2.imwrite(filepath, image)

    result_text, confidence = _get_predictor()(filepath)
    confidence_value = round(float(confidence * 100), 2)
    image_b64 = _save_and_cleanup(user_id, result_text, confidence_value, filepath, filename, owner_session_id)

    return {
        "success": True,
        "message": result_text,
        "confidence": confidence_value,
        "filename": filename,
        "image_b64": image_b64,
        "source": "camera",
        "relevant": "UNHEALTHY" in result_text.upper(),
    }


@plant_detection_bp.route("/detect-plant", methods=["POST"])
def detect_plant():
    try:
        if not request.is_json or "image_base64" not in request.json:
            return jsonify({"success": False, "error": "No image provided"}), 400

        base64_data = request.json["image_base64"]
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]

        img_bytes = base64.b64decode(base64_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            return jsonify({"success": False, "error": "Failed to decode image"}), 400

        user_id = request.json.get("user_id", "guest")
        owner_session_id = request.json.get("session_id")
        payload = _save_frame_and_predict(image, user_id, "plant_upload", owner_session_id)
        if payload.get("relevant"):
            buzz(2)
        return jsonify(payload)
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@plant_detection_bp.route("/capture-camera", methods=["POST"])
def capture_camera():
    try:
        frame, source = capture_single_frame()
        user_id = request.json.get("user_id", "guest") if request.is_json and request.json else "guest"
        owner_session_id = request.json.get("session_id") if request.is_json and request.json else None
        payload = _save_frame_and_predict(frame, user_id, "plant_camera", owner_session_id)
        payload["camera_source"] = source
        if payload.get("relevant"):
            buzz(2)
        return jsonify(payload)
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@plant_detection_bp.route("/image/<filename>")
def get_plant_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@plant_detection_bp.route("/history")
def plant_history():
    try:
        user_id = request.args.get("user_id", "guest")
        session_id = request.args.get("session_id")
        plant_col = get_collection(COLLECTIONS["PLANTS"])
        query = {"user_id": user_id}
        if user_id == "guest" and session_id:
            query["owner_session_id"] = session_id
        records = list(plant_col.find(query).sort("timestamp", -1).limit(15))
        for row in records:
            row["_id"] = str(row["_id"])
            row["timestamp"] = iso_ist(row.get("timestamp"))
        return jsonify({"success": True, "data": records})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500
