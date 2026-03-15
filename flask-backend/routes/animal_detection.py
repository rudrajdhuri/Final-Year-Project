# from flask import Blueprint, request, jsonify, send_from_directory
# import cv2
# import numpy as np
# import base64
# import os
# import uuid
# from datetime import datetime

# from models.animal_main import predict
# from database import get_collection, COLLECTIONS

# animal_detection_bp = Blueprint('animal_detection', __name__)

# UPLOAD_FOLDER = "uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# def _enforce_user_limit(col, user_id: str, limit: int = 25):
#     """Delete oldest record for this user if over limit."""
#     count = col.count_documents({"user_id": user_id})
#     if count >= limit:
#         oldest = col.find_one({"user_id": user_id}, sort=[("timestamp", 1)])
#         if oldest:
#             col.delete_one({"_id": oldest["_id"]})




# def _image_to_b64(filepath: str, max_size: int = 400) -> str:
#     """Resize image and convert to base64 string for MongoDB storage."""
#     try:
#         img = cv2.imread(filepath)
#         if img is None:
#             return ""
#         h, w = img.shape[:2]
#         if max(h, w) > max_size:
#             scale = max_size / max(h, w)
#             img = cv2.resize(img, (int(w * scale), int(h * scale)))
#         _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 75])
#         return "data:image/jpeg;base64," + base64.b64encode(buf).decode()
#     except:
#         return ""


# def _save_and_cleanup(animal_col, user_id, threat, animal_name, confidence, result_text, filepath, filename):
#     """Save detection to MongoDB with base64 image, then delete local file."""
#     image_b64 = _image_to_b64(filepath)

#     # Enforce per-user limit
#     _enforce_user_limit(animal_col, user_id)

#     animal_col.insert_one({
#         "user_id":         user_id,
#         "threat_detected": threat,
#         "animal_type":     animal_name,
#         "confidence":      confidence,
#         "filename":        filename,
#         "message":         result_text,
#         "image_b64":       image_b64,
#         "timestamp":       datetime.utcnow()
#     })

#     # Delete local file after saving to MongoDB
#     try:
#         if os.path.exists(filepath):
#             os.remove(filepath)
#     except:
#         pass

#     return image_b64


# # ──────────────────────────────────────────
# # Upload-based detection (existing)
# # ──────────────────────────────────────────
# @animal_detection_bp.route('/detect-animal', methods=['POST'])
# def detect_animal():

#     try:

#         if request.is_json and 'image_base64' in request.json:

#             base64_data = request.json['image_base64']

#             if ',' in base64_data:
#                 base64_data = base64_data.split(',')[1]

#             img_bytes = base64.b64decode(base64_data)
#             nparr = np.frombuffer(img_bytes, np.uint8)
#             image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

#         else:
#             return jsonify({"error": "No image provided"}), 400

#         filename = f"{uuid.uuid4()}.jpg"
#         filepath = os.path.join(UPLOAD_FOLDER, filename)
#         cv2.imwrite(filepath, image)

#         result_text = predict(filepath)

#         threat = "Threat" in result_text
#         animal_name = "Unknown"
#         confidence = 0.0

#         if "Animal:" in result_text:
#             parts = result_text.split("Animal:")
#             animal_part = parts[1]
#             animal_name = animal_part.split("(")[0].strip()
#             conf_part = animal_part.split("(")[1]
#             confidence = round(float(conf_part.replace("%)", "")), 2)

#         elif "(" in result_text and "%)" in result_text:
#             try:
#                 conf_part = result_text.split("(")[1]
#                 confidence = round(float(conf_part.replace("%)", "")), 2)
#             except:
#                 confidence = 0.0

#         user_id = "guest"
#         if request.is_json:
#             user_id = request.json.get('user_id', 'guest')

#         animal_col = get_collection(COLLECTIONS['ANIMALS'])
#         image_b64 = _save_and_cleanup(
#             animal_col, user_id, threat, animal_name, confidence, result_text, filepath, filename
#         )

#         return jsonify({
#             "success": True,
#             "threat_detected": threat,
#             "animal_type": animal_name,
#             "confidence": confidence,
#             "filename": filename,
#             "message": result_text,
#             "image_b64": image_b64
#         })

#     except Exception as e:
#         return jsonify({"success": False, "error": str(e)})






# # ──────────────────────────────────────────
# # Webcam capture route (laptop/webcam test)
# # ──────────────────────────────────────────
# @animal_detection_bp.route('/capture-camera', methods=['POST'])
# def capture_camera():

#     try:

#         cap = cv2.VideoCapture(0)

#         if not cap.isOpened():
#             return jsonify({"success": False, "error": "Camera not available"})

#         # Read a few frames to flush buffer — gets fresher image faster
#         for _ in range(3):
#             ret, frame = cap.read()
#         cap.release()

#         if not ret or frame is None or frame.size == 0:
#             return jsonify({"success": False, "error": "Failed to capture image"})

#         # Sequential filename: apicam1.jpg, apicam2.jpg ...
#         existing = [f for f in os.listdir(UPLOAD_FOLDER) if f.startswith("apicam")]
#         number = len(existing) + 1
#         filename = f"apicam{number}.jpg"
#         filepath = os.path.join(UPLOAD_FOLDER, filename)

#         cv2.imwrite(filepath, frame)

#         # Enforce 25 image limit
#         all_files = sorted(
#             [f for f in os.listdir(UPLOAD_FOLDER)],
#             key=lambda f: os.path.getctime(os.path.join(UPLOAD_FOLDER, f))
#         )
#         if len(all_files) > 25:
#             os.remove(os.path.join(UPLOAD_FOLDER, all_files[0]))

#         result_text = predict(filepath)

#         threat = "Threat" in result_text
#         animal_name = "Unknown"
#         confidence = 0.0

#         if "Animal:" in result_text:
#             parts = result_text.split("Animal:")
#             animal_part = parts[1]
#             animal_name = animal_part.split("(")[0].strip()
#             conf_part = animal_part.split("(")[1]
#             confidence = round(float(conf_part.replace("%)", "")), 2)

#         elif "(" in result_text and "%)" in result_text:
#             try:
#                 conf_part = result_text.split("(")[1]
#                 confidence = round(float(conf_part.replace("%)", "")), 2)
#             except:
#                 confidence = 0.0

#         user_id = request.json.get('user_id', 'guest') if request.is_json and request.json else 'guest'

#         animal_col = get_collection(COLLECTIONS['ANIMALS'])
#         image_b64 = _save_and_cleanup(
#             animal_col, user_id, threat, animal_name, confidence, result_text, filepath, filename
#         )

#         return jsonify({
#             "success": True,
#             "threat_detected": threat,
#             "animal_type": animal_name,
#             "confidence": confidence,
#             "filename": filename,
#             "message": result_text,
#             "image_b64": image_b64
#         })

#     except Exception as e:
#         return jsonify({"success": False, "error": str(e)})

# @animal_detection_bp.route("/image/<filename>")
# def get_image(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)


# @animal_detection_bp.route('/history')
# def animal_history():

#     try:
#         user_id = request.args.get('user_id', 'guest')
#         animal_col = get_collection(COLLECTIONS['ANIMALS'])
#         records = list(animal_col.find({"user_id": user_id}).sort("timestamp", -1))

#         for r in records:
#             r["_id"] = str(r["_id"])
#             r["timestamp"] = r["timestamp"].isoformat()

#         return jsonify({"success": True, "data": records})

#     except Exception as e:
#         return jsonify({"success": False, "error": str(e)})


from flask import Blueprint, request, jsonify, send_from_directory
import cv2
import numpy as np
import base64
import os
import uuid
from datetime import datetime

from models.animal_main import predict
from database import get_collection, COLLECTIONS

animal_detection_bp = Blueprint('animal_detection', __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def _enforce_user_limit(col, user_id: str, limit: int = 25):
    count = col.count_documents({"user_id": user_id})
    if count >= limit:
        oldest = col.find_one({"user_id": user_id}, sort=[("timestamp", 1)])
        if oldest:
            col.delete_one({"_id": oldest["_id"]})

def _image_to_b64(filepath: str, max_size: int = 400) -> str:
    try:
        img = cv2.imread(filepath)
        if img is None:
            return ""
        h, w = img.shape[:2]
        if max(h, w) > max_size:
            scale = max_size / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)))
        _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 75])
        return "data:image/jpeg;base64," + base64.b64encode(buf).decode()
    except:
        return ""

def _save_and_cleanup(animal_col, user_id, threat, animal_name, confidence, result_text, filepath, filename):
    image_b64 = _image_to_b64(filepath)
    _enforce_user_limit(animal_col, user_id)
    animal_col.insert_one({
        "user_id":         user_id,
        "threat_detected": threat,
        "animal_type":     animal_name,
        "confidence":      confidence,
        "filename":        filename,
        "message":         result_text,
        "image_b64":       image_b64,
        "timestamp":       datetime.utcnow()
    })
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except:
        pass
    return image_b64


# ──────────────────────────────────────────
# Upload-based detection (unchanged)
# ──────────────────────────────────────────
@animal_detection_bp.route('/detect-animal', methods=['POST'])
def detect_animal():
    try:
        if request.is_json and 'image_base64' in request.json:
            base64_data = request.json['image_base64']
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            img_bytes = base64.b64decode(base64_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            return jsonify({"error": "No image provided"}), 400

        filename = f"{uuid.uuid4()}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        cv2.imwrite(filepath, image)

        result_text = predict(filepath)
        threat = "Threat" in result_text
        animal_name = "Unknown"
        confidence = 0.0

        if "Animal:" in result_text:
            parts = result_text.split("Animal:")
            animal_part = parts[1]
            animal_name = animal_part.split("(")[0].strip()
            conf_part = animal_part.split("(")[1]
            confidence = round(float(conf_part.replace("%)", "")), 2)
        elif "(" in result_text and "%)" in result_text:
            try:
                conf_part = result_text.split("(")[1]
                confidence = round(float(conf_part.replace("%)", "")), 2)
            except:
                confidence = 0.0

        user_id = "guest"
        if request.is_json:
            user_id = request.json.get('user_id', 'guest')

        animal_col = get_collection(COLLECTIONS['ANIMALS'])
        image_b64 = _save_and_cleanup(
            animal_col, user_id, threat, animal_name, confidence, result_text, filepath, filename
        )

        return jsonify({
            "success": True,
            "threat_detected": threat,
            "animal_type": animal_name,
            "confidence": confidence,
            "filename": filename,
            "message": result_text,
            "image_b64": image_b64
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


# ──────────────────────────────────────────
# Pi Camera capture route
# ──────────────────────────────────────────
@animal_detection_bp.route('/capture-camera', methods=['POST'])
def capture_camera():
    try:
        # ── Pi Camera ──
        from picamera2 import Picamera2
        import time

        cam = Picamera2()
        cam.start()
        time.sleep(0.5)          # warm-up
        frame = cam.capture_array()
        cam.stop()

        # Picamera2 gives RGB — convert to BGR for OpenCV/cv2.imwrite
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

        if frame is None or frame.size == 0:
            return jsonify({"success": False, "error": "Failed to capture image"})

        # Sequential filename: apicam1.jpg, apicam2.jpg ...
        existing = [f for f in os.listdir(UPLOAD_FOLDER) if f.startswith("apicam")]
        number = len(existing) + 1
        filename = f"apicam{number}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        cv2.imwrite(filepath, frame)

        result_text = predict(filepath)
        threat = "Threat" in result_text
        animal_name = "Unknown"
        confidence = 0.0

        if "Animal:" in result_text:
            parts = result_text.split("Animal:")
            animal_part = parts[1]
            animal_name = animal_part.split("(")[0].strip()
            conf_part = animal_part.split("(")[1]
            confidence = round(float(conf_part.replace("%)", "")), 2)
        elif "(" in result_text and "%)" in result_text:
            try:
                conf_part = result_text.split("(")[1]
                confidence = round(float(conf_part.replace("%)", "")), 2)
            except:
                confidence = 0.0

        user_id = request.json.get('user_id', 'guest') if request.is_json and request.json else 'guest'

        animal_col = get_collection(COLLECTIONS['ANIMALS'])
        image_b64 = _save_and_cleanup(
            animal_col, user_id, threat, animal_name, confidence, result_text, filepath, filename
        )

        return jsonify({
            "success": True,
            "threat_detected": threat,
            "animal_type": animal_name,
            "confidence": confidence,
            "filename": filename,
            "message": result_text,
            "image_b64": image_b64
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@animal_detection_bp.route("/image/<filename>")
def get_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@animal_detection_bp.route('/history')
def animal_history():
    try:
        user_id = request.args.get('user_id', 'guest')
        animal_col = get_collection(COLLECTIONS['ANIMALS'])
        records = list(animal_col.find({"user_id": user_id}).sort("timestamp", -1))
        for r in records:
            r["_id"] = str(r["_id"])
            r["timestamp"] = r["timestamp"].isoformat()
        return jsonify({"success": True, "data": records})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})