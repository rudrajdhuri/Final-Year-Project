# from flask import Blueprint, request, jsonify, send_from_directory
# import cv2
# import numpy as np
# import base64
# import os
# import uuid
# from datetime import datetime

# from models.plant_main import predict
# from database import get_collection

# plant_detection_bp = Blueprint('plant_detection', __name__)

# UPLOAD_FOLDER = "uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# @plant_detection_bp.route('/detect-plant', methods=['POST'])
# def detect_plant():

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


#         result_text, confidence = predict(filepath)

#         # convert numpy.float32 → python float
#         confidence_value = round(float(confidence * 100), 2)


#         plant_col = get_collection("plantdect_data")

#         plant_col.insert_one({

#             "result": result_text,
#             "confidence": confidence_value,
#             "filename": filename,
#             "timestamp": datetime.utcnow()

#         })


#         return jsonify({

#             "success": True,
#             "message": result_text,
#             "confidence": round(confidence_value, 2),
#             "filename": filename

#         })


#     except Exception as e:

#         return jsonify({
#             "success": False,
#             "error": str(e)
#         })


# @plant_detection_bp.route("/image/<filename>")
# def get_plant_image(filename):

#     return send_from_directory(UPLOAD_FOLDER, filename)


# @plant_detection_bp.route('/history')
# def plant_history():

#     try:

#         plant_col = get_collection("plantdect_data")

#         records = list(plant_col.find().sort("timestamp", -1))

#         for r in records:

#             r["_id"] = str(r["_id"])

#             if "timestamp" in r:
#                 r["timestamp"] = r["timestamp"].isoformat()

#         return jsonify({
#             "success": True,
#             "data": records
#         })

#     except Exception as e:

#         return jsonify({
#             "success": False,
#             "error": str(e)
#         })


# # from flask import Blueprint, request, jsonify, send_from_directory
# # import cv2
# # import numpy as np
# # import base64
# # import os
# # import uuid
# # from datetime import datetime

# # from models.plant_main import predict
# # from database import get_collection

# # plant_detection_bp = Blueprint('plant_detection', __name__)

# # UPLOAD_FOLDER = "uploads"
# # os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# # # ---------- Detect Plant ----------

# # @plant_detection_bp.route('/detect-plant', methods=['POST'])
# # def detect_plant():

# #     try:

# #         if request.is_json and 'image_base64' in request.json:

# #             base64_data = request.json['image_base64']

# #             if ',' in base64_data:
# #                 base64_data = base64_data.split(',')[1]

# #             img_bytes = base64.b64decode(base64_data)
# #             nparr = np.frombuffer(img_bytes, np.uint8)
# #             image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# #         else:
# #             return jsonify({"error": "No image provided"}), 400


# #         filename = f"{uuid.uuid4()}.jpg"
# #         filepath = os.path.join(UPLOAD_FOLDER, filename)

# #         cv2.imwrite(filepath, image)


# #         result_text, confidence = predict(filepath)


# #         plant_col = get_collection("plantdect_data")

# #         plant_col.insert_one({

# #             "result": result_text,
# #             "confidence": float(confidence * 100),
# #             "filename": filename,
# #             "timestamp": datetime.utcnow()

# #         })


# #         return jsonify({

# #             "success": True,
# #             "message": result_text,
# #             "confidence": float(round(confidence * 100, 2)),
# #             "filename": filename

# #         })


# #     except Exception as e:

# #         return jsonify({

# #             "success": False,
# #             "error": str(e)

# #         })


# # # ---------- Serve Image ----------

# # @plant_detection_bp.route("/image/<filename>")
# # def get_plant_image(filename):

# #     return send_from_directory(UPLOAD_FOLDER, filename)


# # # ---------- Plant History ----------

# # @plant_detection_bp.route('/history', methods=['GET'])
# # def plant_history():

# #     try:

# #         plant_col = get_collection("plantdect_data")

# #         records = list(plant_col.find().sort("timestamp", -1))

# #         for r in records:

# #             r["_id"] = str(r["_id"])

# #             if "timestamp" in r:
# #                 r["timestamp"] = r["timestamp"].isoformat()

# #         return jsonify({

# #             "success": True,
# #             "data": records

# #         })

# #     except Exception as e:

# #         return jsonify({

# #             "success": False,
# #             "error": str(e)

# #         })



# from flask import Blueprint, request, jsonify, send_from_directory
# import cv2
# import numpy as np
# import base64
# import os
# import uuid
# from datetime import datetime

# from models.plant_main import predict
# from database import get_collection

# plant_detection_bp = Blueprint('plant_detection', __name__)

# UPLOAD_FOLDER = "uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# @plant_detection_bp.route('/detect-plant', methods=['POST'])
# def detect_plant():

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

#         result_text, confidence = predict(filepath)

#         # convert numpy.float32 → python float
#         confidence_value = round(float(confidence * 100), 2)

#         plant_col = get_collection("plantdect_data")

#         plant_col.insert_one({
#             "result": result_text,
#             "confidence": confidence_value,
#             "filename": filename,
#             "timestamp": datetime.utcnow()
#         })

#         return jsonify({
#             "success": True,
#             "message": result_text,
#             "confidence": round(confidence_value, 2),
#             "filename": filename
#         })

#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e)
#         })


# @plant_detection_bp.route("/image/<filename>")
# def get_plant_image(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)


# @plant_detection_bp.route('/history')
# def plant_history():

#     try:

#         plant_col = get_collection("plantdect_data")

#         records = list(plant_col.find().sort("timestamp", -1))

#         for r in records:
#             r["_id"] = str(r["_id"])
#             if "timestamp" in r:
#                 r["timestamp"] = r["timestamp"].isoformat()

#         return jsonify({
#             "success": True,
#             "data": records
#         })

#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e)
#         })



from flask import Blueprint, request, jsonify, send_from_directory
import cv2
import numpy as np
import base64
import os
import uuid
from datetime import datetime

from models.plant_main import predict
from database import get_collection

plant_detection_bp = Blueprint('plant_detection', __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ──────────────────────────────────────────
# Upload-based detection (existing)
# ──────────────────────────────────────────
@plant_detection_bp.route('/detect-plant', methods=['POST'])
def detect_plant():

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

        result_text, confidence = predict(filepath)
        confidence_value = round(float(confidence * 100), 2)

        plant_col = get_collection("plantdect_data")

        plant_col.insert_one({
            "result": result_text,
            "confidence": confidence_value,
            "filename": filename,
            "timestamp": datetime.utcnow()
        })

        return jsonify({
            "success": True,
            "message": result_text,
            "confidence": round(confidence_value, 2),
            "filename": filename
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


# ──────────────────────────────────────────
# Pi/Laptop camera capture route (NEW)
# ──────────────────────────────────────────
@plant_detection_bp.route('/capture-camera', methods=['POST'])
def capture_camera():

    try:

        from picamera2 import Picamera2
        import time

        cam = Picamera2()
        cam.start()
        time.sleep(0.5)  # brief warm-up for exposure

        frame = cam.capture_array()
        cam.stop()

        if frame is None or frame.size == 0:
            return jsonify({"success": False, "error": "Failed to capture image"})

        # Picamera2 returns RGB — convert to BGR for OpenCV
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

        # Sequential filename: ppicam1.jpg, ppicam2.jpg ...
        existing = [f for f in os.listdir(UPLOAD_FOLDER) if f.startswith("ppicam")]
        number = len(existing) + 1
        filename = f"ppicam{number}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        cv2.imwrite(filepath, frame)

        result_text, confidence = predict(filepath)
        confidence_value = round(float(confidence * 100), 2)

        plant_col = get_collection("plantdect_data")

        plant_col.insert_one({
            "result": result_text,
            "confidence": confidence_value,
            "filename": filename,
            "timestamp": datetime.utcnow()
        })

        return jsonify({
            "success": True,
            "message": result_text,
            "confidence": confidence_value,
            "filename": filename
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@plant_detection_bp.route("/image/<filename>")
def get_plant_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@plant_detection_bp.route('/history')
def plant_history():

    try:

        plant_col = get_collection("plantdect_data")
        records = list(plant_col.find().sort("timestamp", -1))

        for r in records:
            r["_id"] = str(r["_id"])
            if "timestamp" in r:
                r["timestamp"] = r["timestamp"].isoformat()

        return jsonify({"success": True, "data": records})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})