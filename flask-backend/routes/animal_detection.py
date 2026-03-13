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

#         animal_col = get_collection(COLLECTIONS['ANIMALS'])

#         animal_col.insert_one({

#             "threat_detected": threat,
#             "animal_type": animal_name,
#             "confidence": confidence,
#             "filename": filename,
#             "timestamp": datetime.utcnow()

#         })


#         return jsonify({

#             "success": True,
#             "threat_detected": threat,
#             "animal_type": animal_name,
#             "confidence": confidence,
#             "filename": filename,
#             "message": result_text

#         })


#     except Exception as e:

#         return jsonify({
#             "success": False,
#             "error": str(e)
#         })


# @animal_detection_bp.route("/image/<filename>")
# def get_image(filename):

#     return send_from_directory(UPLOAD_FOLDER, filename)


# @animal_detection_bp.route('/history')
# def animal_history():

#     try:

#         animal_col = get_collection(COLLECTIONS['ANIMALS'])

#         records = list(animal_col.find().sort("timestamp", -1))

#         for r in records:

#             r["_id"] = str(r["_id"])
#             r["timestamp"] = r["timestamp"].isoformat()

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

# # from models.animal_main import predict
# # from database import get_collection, COLLECTIONS

# # animal_detection_bp = Blueprint('animal_detection', __name__)

# # UPLOAD_FOLDER = "uploads"
# # os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# # @animal_detection_bp.route('/detect-animal', methods=['POST'])
# # def detect_animal_endpoint():

# #     try:

# #         image = None

# #         # -------- File Upload --------
# #         if 'image' in request.files:

# #             file = request.files['image']

# #             if file.filename == '':
# #                 return jsonify({'error': 'No file selected'}), 400

# #             file_bytes = np.frombuffer(file.read(), np.uint8)
# #             image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

# #         # -------- Base64 Upload --------
# #         elif request.is_json and 'image_base64' in request.json:

# #             base64_data = request.json['image_base64']

# #             if ',' in base64_data:
# #                 base64_data = base64_data.split(',')[1]

# #             img_bytes = base64.b64decode(base64_data)
# #             nparr = np.frombuffer(img_bytes, np.uint8)
# #             image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# #         else:
# #             return jsonify({'error': 'No image provided'}), 400


# #         if image is None:
# #             return jsonify({'error': 'Invalid image format'}), 400


# #         # -------- Save Image --------
# #         filename = f"{uuid.uuid4()}.jpg"
# #         filepath = os.path.join(UPLOAD_FOLDER, filename)

# #         cv2.imwrite(filepath, image)


# #         # -------- Run Model --------
# #         result_text = predict(filepath)

# #         threat = "Threat" in result_text
# #         animal_name = "Unknown"
# #         confidence = 0


# #         if "Animal:" in result_text:

# #             parts = result_text.split("Animal:")
# #             animal_part = parts[1]

# #             animal_name = animal_part.split("(")[0].strip()

# #             conf_part = animal_part.split("(")[1]
# #             confidence = float(conf_part.replace("%)", ""))


# #         # -------- Save To MongoDB --------
# #         animal_col = get_collection(COLLECTIONS['ANIMALS'])

# #         animal_col.insert_one({

# #             "threat_detected": threat,
# #             "animal_type": animal_name,
# #             "confidence": float(confidence),
# #             "filename": filename,
# #             "timestamp": datetime.utcnow()

# #         })


# #         return jsonify({

# #             "success": True,
# #             "threat_detected": threat,
# #             "animal_type": animal_name,
# #             "confidence": float(confidence),
# #             "filename": filename,
# #             "message": result_text

# #         })


# #     except Exception as e:

# #         return jsonify({
# #             "success": False,
# #             "error": str(e)
# #         }), 500



# # # ---------- Serve Images ----------

# # @animal_detection_bp.route("/image/<filename>")
# # def get_image(filename):

# #     return send_from_directory(UPLOAD_FOLDER, filename)



# # # ---------- History ----------

# # @animal_detection_bp.route('/history', methods=['GET'])
# # def get_history():

# #     try:

# #         animal_col = get_collection(COLLECTIONS['ANIMALS'])

# #         records = list(animal_col.find().sort("timestamp", -1))

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





# # from flask import Blueprint, request, jsonify
# # import cv2
# # import numpy as np
# # import base64
# # from datetime import datetime

# # from models.animal import detect_animal
# # from database import get_collection, COLLECTIONS

# # animal_detection_bp = Blueprint('animal_detection', __name__)


# # @animal_detection_bp.route('/detect-animal', methods=['POST'])
# # def detect_animal_endpoint():
# #     try:
# #         # -------- image input handling --------
# #         if 'image' in request.files:
# #             file = request.files['image']
# #             if file.filename == '':
# #                 return jsonify({'error': 'No file selected'}), 400

# #             file_bytes = np.frombuffer(file.read(), np.uint8)
# #             image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

# #         elif request.is_json and 'image_base64' in request.json:
# #             base64_data = request.json['image_base64']
# #             if ',' in base64_data:
# #                 base64_data = base64_data.split(',')[1]

# #             img_bytes = base64.b64decode(base64_data)
# #             nparr = np.frombuffer(img_bytes, np.uint8)
# #             image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# #         else:
# #             return jsonify({'error': 'No image provided'}), 400

# #         if image is None:
# #             return jsonify({'error': 'Invalid image format'}), 400

# #         # -------- ML inference --------
# #         is_threat, class_name, confidence = detect_animal(image)

# #         # -------- DB insert (SAFE, NON-BLOCKING) --------
# #         try:
# #             animal_col = get_collection(COLLECTIONS['ANIMALS'])
# #             animal_col.insert_one({
# #                 "threat_detected": is_threat,
# #                 "animal_type": class_name,
# #                 "confidence": round(confidence * 100, 2) if confidence else 0,
# #                 "timestamp": datetime.utcnow()
# #             })
# #         except Exception as db_error:
# #             # DB failure should NEVER block ML response
# #             print("DB insert failed (animal_detection):", db_error)

# #         # -------- response --------
# #         return jsonify({
# #             'success': True,
# #             'threat_detected': is_threat,
# #             'animal_type': class_name,
# #             'confidence': round(confidence * 100, 2) if confidence else 0,
# #             'message': (
# #                 f"⚠️ {class_name} detected with "
# #                 f"{round(confidence * 100, 2)}% confidence!"
# #                 if is_threat else "No threats detected"
# #             )
# #         }), 200

# #     except Exception as e:
# #         return jsonify({
# #             'success': False,
# #             'error': str(e)
# #         }), 500


# # @animal_detection_bp.route('/detect-animal/test', methods=['GET'])
# # def test_endpoint():
# #     return jsonify({
# #         'status': 'Animal detection API is running'
# #     }), 200




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

#         # extract confidence for non-animal results too
#         elif "(" in result_text and "%)" in result_text:
#             try:
#                 conf_part = result_text.split("(")[1]
#                 confidence = round(float(conf_part.replace("%)", "")), 2)
#             except:
#                 confidence = 0.0

#         animal_col = get_collection(COLLECTIONS['ANIMALS'])

#         animal_col.insert_one({
#             "threat_detected": threat,
#             "animal_type": animal_name,
#             "confidence": confidence,
#             "filename": filename,
#             "message": result_text,        # ← ADDED: saves full result text
#             "timestamp": datetime.utcnow()
#         })

#         return jsonify({
#             "success": True,
#             "threat_detected": threat,
#             "animal_type": animal_name,
#             "confidence": confidence,
#             "filename": filename,
#             "message": result_text
#         })

#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e)
#         })


# @animal_detection_bp.route("/image/<filename>")
# def get_image(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)


# @animal_detection_bp.route('/history')
# def animal_history():

#     try:

#         animal_col = get_collection(COLLECTIONS['ANIMALS'])

#         records = list(animal_col.find().sort("timestamp", -1))

#         for r in records:
#             r["_id"] = str(r["_id"])
#             r["timestamp"] = r["timestamp"].isoformat()

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

from models.animal_main import predict
from database import get_collection, COLLECTIONS

animal_detection_bp = Blueprint('animal_detection', __name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ──────────────────────────────────────────
# Upload-based detection (existing)
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

        animal_col = get_collection(COLLECTIONS['ANIMALS'])

        animal_col.insert_one({
            "threat_detected": threat,
            "animal_type": animal_name,
            "confidence": confidence,
            "filename": filename,
            "message": result_text,
            "timestamp": datetime.utcnow()
        })

        return jsonify({
            "success": True,
            "threat_detected": threat,
            "animal_type": animal_name,
            "confidence": confidence,
            "filename": filename,
            "message": result_text
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


# ──────────────────────────────────────────
# Pi/Laptop camera capture route (NEW)
# ──────────────────────────────────────────
@animal_detection_bp.route('/capture-camera', methods=['POST'])
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

        animal_col = get_collection(COLLECTIONS['ANIMALS'])

        animal_col.insert_one({
            "threat_detected": threat,
            "animal_type": animal_name,
            "confidence": confidence,
            "filename": filename,
            "message": result_text,
            "timestamp": datetime.utcnow()
        })

        return jsonify({
            "success": True,
            "threat_detected": threat,
            "animal_type": animal_name,
            "confidence": confidence,
            "filename": filename,
            "message": result_text
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@animal_detection_bp.route("/image/<filename>")
def get_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@animal_detection_bp.route('/history')
def animal_history():

    try:

        animal_col = get_collection(COLLECTIONS['ANIMALS'])
        records = list(animal_col.find().sort("timestamp", -1))

        for r in records:
            r["_id"] = str(r["_id"])
            r["timestamp"] = r["timestamp"].isoformat()

        return jsonify({"success": True, "data": records})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})