# from flask import Blueprint, jsonify, request, send_from_directory
# import cv2
# import base64
# import os
# import threading
# import time
# from datetime import datetime

# from models.animal_main import predict as animal_predict
# from models.plant_main import predict as plant_predict
# from database import get_collection, COLLECTIONS

# auto_detection_bp = Blueprint('auto_detection', __name__)


# def _image_to_b64(filepath: str, max_size: int = 400) -> str:
#     try:
#         img = cv2.imread(filepath)
#         if img is None: return ""
#         h, w = img.shape[:2]
#         if max(h, w) > max_size:
#             scale = max_size / max(h, w)
#             img = cv2.resize(img, (int(w * scale), int(h * scale)))
#         _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 75])
#         return "data:image/jpeg;base64," + base64.b64encode(buf).decode()
#     except:
#         return ""


# UPLOAD_FOLDER = "uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# MAX_CAPTURES  = 10
# INTERVAL_SECS = 30

# # ── Per-mode state ──
# _states = {
#     "animal": {"running": False, "count": 0, "max": MAX_CAPTURES, "last_image": None, "last_result": None, "error": None, "user_id": "guest"},
#     "plant":  {"running": False, "count": 0, "max": MAX_CAPTURES, "last_image": None, "last_result": None, "error": None, "user_id": "guest"},
# }
# _lock          = threading.Lock()
# _main_thread   = None   # the thread that owns the camera


# def _enforce_upload_limit():
#     all_files = sorted(
#         [f for f in os.listdir(UPLOAD_FOLDER)],
#         key=lambda f: os.path.getctime(os.path.join(UPLOAD_FOLDER, f))
#     )
#     while len(all_files) > 25:
#         os.remove(os.path.join(UPLOAD_FOLDER, all_files[0]))
#         all_files.pop(0)


# def _enforce_mongo_limit(col):
#     if col.count_documents({}) >= 25:
#         oldest = col.find_one(sort=[("timestamp", 1)])
#         if oldest:
#             col.delete_one({"_id": oldest["_id"]})


# def _capture_frame(prefix):
#     cap = cv2.VideoCapture(0)
#     if not cap.isOpened():
#         return None, None, "Camera not available"

#     ret, frame = cap.read()
#     cap.release()

#     if not ret or frame is None or frame.size == 0:
#         return None, None, "Failed to capture image"

#     existing = [f for f in os.listdir(UPLOAD_FOLDER) if f.startswith(prefix)]
#     number   = len(existing) + 1
#     filename = f"{prefix}{number}.jpg"
#     filepath = os.path.join(UPLOAD_FOLDER, filename)
#     cv2.imwrite(filepath, frame)
#     _enforce_upload_limit()
#     return filename, filepath, None


# def _run_animal(filepath, filename):
#     """Run animal model on filepath, save to MongoDB with base64, delete file."""
#     try:
#         result_text = animal_predict(filepath)
#         threat      = "Threat" in result_text
#         animal_name = "Unknown"
#         confidence  = 0.0

#         if "Animal:" in result_text:
#             parts = result_text.split("Animal:")
#             animal_name = parts[1].split("(")[0].strip()
#             try: confidence = round(float(parts[1].split("(")[1].replace("%)", "")), 2)
#             except: pass
#         elif "(" in result_text and "%)" in result_text:
#             try: confidence = round(float(result_text.split("(")[1].replace("%)", "")), 2)
#             except: pass

#         with _lock:
#             user_id = _states["animal"]["user_id"]

#         image_b64 = _image_to_b64(filepath)
#         col = get_collection(COLLECTIONS['ANIMALS'])
#         _enforce_mongo_limit(col)
#         col.insert_one({
#             "user_id":         user_id,
#             "threat_detected": threat, "animal_type": animal_name,
#             "confidence": confidence, "filename": filename,
#             "message": result_text, "image_b64": image_b64,
#             "timestamp": datetime.utcnow()
#         })
#         with _lock:
#             _states["animal"]["count"]       += 1
#             _states["animal"]["last_image"]   = filename
#             _states["animal"]["last_result"]  = {
#                 "success": True, "threat_detected": threat,
#                 "animal_type": animal_name, "confidence": confidence,
#                 "message": result_text, "filename": filename,
#                 "image_b64": image_b64,
#             }
#     except Exception as e:
#         with _lock:
#             _states["animal"]["error"] = str(e)


# def _run_plant(filepath, filename):
#     """Run plant model on filepath, save to MongoDB with base64, delete file."""
#     try:
#         result_text, confidence = plant_predict(filepath)
#         confidence_value = round(float(confidence * 100), 2)

#         with _lock:
#             user_id = _states["plant"]["user_id"]

#         image_b64 = _image_to_b64(filepath)
#         col = get_collection("plantdect_data")
#         _enforce_mongo_limit(col)
#         col.insert_one({
#             "user_id":    user_id,
#             "result":     result_text, "confidence": confidence_value,
#             "filename":   filename, "image_b64": image_b64,
#             "timestamp":  datetime.utcnow()
#         })
#         with _lock:
#             _states["plant"]["count"]      += 1
#             _states["plant"]["last_image"]  = filename
#             _states["plant"]["last_result"] = {
#                 "success": True, "message": result_text,
#                 "confidence": confidence_value, "filename": filename,
#                 "image_b64": image_b64,
#             }
#     except Exception as e:
#         with _lock:
#             _states["plant"]["error"] = str(e)


# def _worker():
#     """
#     Main camera thread.
#     Each iteration:
#       - Check which modes are still running
#       - Capture ONE frame
#       - Run all active models on that frame (in parallel threads)
#       - Wait 30s then repeat
#     Stops when no modes are running OR all modes have hit MAX_CAPTURES.
#     """
#     global _states

#     iteration = 0

#     while True:
#         # Check which modes are active
#         with _lock:
#             animal_active = _states["animal"]["running"] and _states["animal"]["count"] < MAX_CAPTURES
#             plant_active  = _states["plant"]["running"]  and _states["plant"]["count"]  < MAX_CAPTURES

#         if not animal_active and not plant_active:
#             break

#         # Capture one shared frame
#         # Use apicam prefix — both models will reference same file
#         existing = [f for f in os.listdir(UPLOAD_FOLDER) if f.startswith("autocam")]
#         number   = len(existing) + 1
#         filename = f"autocam{number}.jpg"
#         filepath = os.path.join(UPLOAD_FOLDER, filename)

#         cap = cv2.VideoCapture(0)
#         if not cap.isOpened():
#             with _lock:
#                 _states["animal"]["error"] = "Camera not available"
#                 _states["plant"]["error"]  = "Camera not available"
#                 _states["animal"]["running"] = False
#                 _states["plant"]["running"]  = False
#             return

#         ret, frame = cap.read()
#         cap.release()

#         if not ret or frame is None or frame.size == 0:
#             with _lock:
#                 _states["animal"]["error"] = "Failed to capture"
#                 _states["plant"]["error"]  = "Failed to capture"
#             break

#         cv2.imwrite(filepath, frame)
#         _enforce_upload_limit()

#         # Run active models in parallel threads on same frame
#         threads = []
#         if animal_active:
#             t = threading.Thread(target=_run_animal, args=(filepath, filename))
#             t.start()
#             threads.append(t)
#         if plant_active:
#             t = threading.Thread(target=_run_plant, args=(filepath, filename))
#             t.start()
#             threads.append(t)

#         for t in threads:
#             t.join()  # wait for both models to finish

#         # Delete local file after both models processed it
#         try:
#             if os.path.exists(filepath): os.remove(filepath)
#         except: pass

#         iteration += 1

#         # Check if any mode just finished its max captures
#         with _lock:
#             if _states["animal"]["count"] >= MAX_CAPTURES:
#                 _states["animal"]["running"] = False
#             if _states["plant"]["count"] >= MAX_CAPTURES:
#                 _states["plant"]["running"]  = False
#             still_running = _states["animal"]["running"] or _states["plant"]["running"]

#         if not still_running:
#             break

#         # Wait 30s (checking for stop every 0.1s)
#         for _ in range(INTERVAL_SECS * 10):
#             with _lock:
#                 still = _states["animal"]["running"] or _states["plant"]["running"]
#             if not still:
#                 return
#             time.sleep(0.1)

#     # Done
#     with _lock:
#         _states["animal"]["running"] = False
#         _states["plant"]["running"]  = False


# @auto_detection_bp.route('/start/<mode>', methods=['POST'])
# def start_auto(mode):
#     global _main_thread

#     if mode not in ("animal", "plant"):
#         return jsonify({"success": False, "error": "Invalid mode"}), 400

#     data = request.get_json(silent=True) or {}
#     user_id = data.get('user_id', 'guest')

#     with _lock:
#         # Reset this mode's state
#         _states[mode]["running"]     = True
#         _states[mode]["count"]       = 0
#         _states[mode]["max"]         = MAX_CAPTURES
#         _states[mode]["last_image"]  = None
#         _states[mode]["last_result"] = None
#         _states[mode]["error"]       = None
#         _states[mode]["user_id"]     = user_id

#         # Start main thread only if not already running
#         thread_needed = _main_thread is None or not _main_thread.is_alive()

#     if thread_needed:
#         _main_thread = threading.Thread(target=_worker, daemon=True)
#         _main_thread.start()

#     return jsonify({"success": True, "message": f"Auto {mode} detection started"})


# @auto_detection_bp.route('/stop/<mode>', methods=['POST'])
# def stop_auto(mode):
#     if mode not in ("animal", "plant", "all"):
#         return jsonify({"success": False, "error": "Invalid mode"}), 400
#     with _lock:
#         if mode == "all":
#             _states["animal"]["running"] = False
#             _states["plant"]["running"]  = False
#         else:
#             _states[mode]["running"] = False
#     return jsonify({"success": True, "message": f"Stopped {mode}"})


# @auto_detection_bp.route('/status/<mode>', methods=['GET'])
# def get_status(mode):
#     if mode not in ("animal", "plant"):
#         return jsonify({"success": False, "error": "Invalid mode"}), 400

#     with _lock:
#         s = dict(_states[mode])
#         s["mode"] = mode

#     if s["last_image"]:
#         s["last_image_url"] = f"/api/auto/image/{s['last_image']}"
#     else:
#         s["last_image_url"] = None

#     # Also expose image_b64 at top level for easy frontend access
#     if s.get("last_result") and s["last_result"].get("image_b64"):
#         s["image_b64"] = s["last_result"]["image_b64"]
#     else:
#         s["image_b64"] = None

#     return jsonify(s)


# @auto_detection_bp.route('/image/<filename>')
# def get_auto_image(filename):
#     return send_from_directory(UPLOAD_FOLDER, filename)


from flask import Blueprint, jsonify, request, send_from_directory
import cv2
import base64
import os
import threading
import time
from datetime import datetime

from models.animal_main import predict as animal_predict
from models.plant_main import predict as plant_predict
from database import get_collection, COLLECTIONS

auto_detection_bp = Blueprint('auto_detection', __name__)


def _image_to_b64(filepath: str, max_size: int = 400) -> str:
    try:
        img = cv2.imread(filepath)
        if img is None: return ""
        h, w = img.shape[:2]
        if max(h, w) > max_size:
            scale = max_size / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)))
        _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 75])
        return "data:image/jpeg;base64," + base64.b64encode(buf).decode()
    except:
        return ""


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MAX_CAPTURES  = 10
INTERVAL_SECS = 30

# ── Per-mode state ──
_states = {
    "animal": {"running": False, "count": 0, "max": MAX_CAPTURES, "last_image": None, "last_result": None, "error": None, "user_id": "guest"},
    "plant":  {"running": False, "count": 0, "max": MAX_CAPTURES, "last_image": None, "last_result": None, "error": None, "user_id": "guest"},
}
_lock          = threading.Lock()
_main_thread   = None   # the thread that owns the camera


def _enforce_upload_limit():
    all_files = sorted(
        [f for f in os.listdir(UPLOAD_FOLDER)],
        key=lambda f: os.path.getctime(os.path.join(UPLOAD_FOLDER, f))
    )
    while len(all_files) > 25:
        os.remove(os.path.join(UPLOAD_FOLDER, all_files[0]))
        all_files.pop(0)


def _enforce_mongo_limit(col):
    if col.count_documents({}) >= 25:
        oldest = col.find_one(sort=[("timestamp", 1)])
        if oldest:
            col.delete_one({"_id": oldest["_id"]})


def _capture_frame(prefix):
    # ── Pi Camera ──
    try:
        from picamera2 import Picamera2
        import time as _time
        cam = Picamera2()
        cam.start()
        _time.sleep(0.5)
        frame = cam.capture_array()
        cam.stop()
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
    except Exception as cam_err:
        return None, None, f"Camera error: {cam_err}"

    if frame is None or frame.size == 0:
        return None, None, "Failed to capture image"

    existing = [f for f in os.listdir(UPLOAD_FOLDER) if f.startswith(prefix)]
    number   = len(existing) + 1
    filename = f"{prefix}{number}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    cv2.imwrite(filepath, frame)
    _enforce_upload_limit()
    return filename, filepath, None


def _run_animal(filepath, filename):
    """Run animal model on filepath, save to MongoDB with base64, delete file."""
    try:
        result_text = animal_predict(filepath)
        threat      = "Threat" in result_text
        animal_name = "Unknown"
        confidence  = 0.0

        if "Animal:" in result_text:
            parts = result_text.split("Animal:")
            animal_name = parts[1].split("(")[0].strip()
            try: confidence = round(float(parts[1].split("(")[1].replace("%)", "")), 2)
            except: pass
        elif "(" in result_text and "%)" in result_text:
            try: confidence = round(float(result_text.split("(")[1].replace("%)", "")), 2)
            except: pass

        with _lock:
            user_id = _states["animal"]["user_id"]

        image_b64 = _image_to_b64(filepath)
        col = get_collection(COLLECTIONS['ANIMALS'])
        _enforce_mongo_limit(col)
        col.insert_one({
            "user_id":         user_id,
            "threat_detected": threat, "animal_type": animal_name,
            "confidence": confidence, "filename": filename,
            "message": result_text, "image_b64": image_b64,
            "timestamp": datetime.utcnow()
        })
        with _lock:
            _states["animal"]["count"]       += 1
            _states["animal"]["last_image"]   = filename
            _states["animal"]["last_result"]  = {
                "success": True, "threat_detected": threat,
                "animal_type": animal_name, "confidence": confidence,
                "message": result_text, "filename": filename,
                "image_b64": image_b64,
            }
    except Exception as e:
        with _lock:
            _states["animal"]["error"] = str(e)


def _run_plant(filepath, filename):
    """Run plant model on filepath, save to MongoDB with base64, delete file."""
    try:
        result_text, confidence = plant_predict(filepath)
        confidence_value = round(float(confidence * 100), 2)

        with _lock:
            user_id = _states["plant"]["user_id"]

        image_b64 = _image_to_b64(filepath)
        col = get_collection("plantdect_data")
        _enforce_mongo_limit(col)
        col.insert_one({
            "user_id":    user_id,
            "result":     result_text, "confidence": confidence_value,
            "filename":   filename, "image_b64": image_b64,
            "timestamp":  datetime.utcnow()
        })
        with _lock:
            _states["plant"]["count"]      += 1
            _states["plant"]["last_image"]  = filename
            _states["plant"]["last_result"] = {
                "success": True, "message": result_text,
                "confidence": confidence_value, "filename": filename,
                "image_b64": image_b64,
            }
    except Exception as e:
        with _lock:
            _states["plant"]["error"] = str(e)


def _worker():
    """
    Main camera thread.
    Each iteration:
      - Check which modes are still running
      - Capture ONE frame
      - Run all active models on that frame (in parallel threads)
      - Wait 30s then repeat
    Stops when no modes are running OR all modes have hit MAX_CAPTURES.
    """
    global _states

    iteration = 0

    while True:
        # Check which modes are active
        with _lock:
            animal_active = _states["animal"]["running"] and _states["animal"]["count"] < MAX_CAPTURES
            plant_active  = _states["plant"]["running"]  and _states["plant"]["count"]  < MAX_CAPTURES

        if not animal_active and not plant_active:
            break

        # Capture one shared frame
        # Use apicam prefix — both models will reference same file
        existing = [f for f in os.listdir(UPLOAD_FOLDER) if f.startswith("autocam")]
        number   = len(existing) + 1
        filename = f"autocam{number}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        # ── Pi Camera ──
        try:
            from picamera2 import Picamera2
            import time as _time
            cam = Picamera2()
            cam.start()
            _time.sleep(0.5)
            frame = cam.capture_array()
            cam.stop()
            frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        except Exception as cam_err:
            with _lock:
                _states["animal"]["error"] = f"Camera error: {cam_err}"
                _states["plant"]["error"]  = f"Camera error: {cam_err}"
                _states["animal"]["running"] = False
                _states["plant"]["running"]  = False
            return

        if frame is None or frame.size == 0:
            with _lock:
                _states["animal"]["error"] = "Failed to capture"
                _states["plant"]["error"]  = "Failed to capture"
            break

        cv2.imwrite(filepath, frame)
        _enforce_upload_limit()

        # Run active models in parallel threads on same frame
        threads = []
        if animal_active:
            t = threading.Thread(target=_run_animal, args=(filepath, filename))
            t.start()
            threads.append(t)
        if plant_active:
            t = threading.Thread(target=_run_plant, args=(filepath, filename))
            t.start()
            threads.append(t)

        for t in threads:
            t.join()  # wait for both models to finish

        # Delete local file after both models processed it
        try:
            if os.path.exists(filepath): os.remove(filepath)
        except: pass

        iteration += 1

        # Check if any mode just finished its max captures
        with _lock:
            if _states["animal"]["count"] >= MAX_CAPTURES:
                _states["animal"]["running"] = False
            if _states["plant"]["count"] >= MAX_CAPTURES:
                _states["plant"]["running"]  = False
            still_running = _states["animal"]["running"] or _states["plant"]["running"]

        if not still_running:
            break

        # Wait 30s (checking for stop every 0.1s)
        for _ in range(INTERVAL_SECS * 10):
            with _lock:
                still = _states["animal"]["running"] or _states["plant"]["running"]
            if not still:
                return
            time.sleep(0.1)

    # Done
    with _lock:
        _states["animal"]["running"] = False
        _states["plant"]["running"]  = False


@auto_detection_bp.route('/start/<mode>', methods=['POST'])
def start_auto(mode):
    global _main_thread

    if mode not in ("animal", "plant"):
        return jsonify({"success": False, "error": "Invalid mode"}), 400

    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'guest')

    with _lock:
        # Reset this mode's state
        _states[mode]["running"]     = True
        _states[mode]["count"]       = 0
        _states[mode]["max"]         = MAX_CAPTURES
        _states[mode]["last_image"]  = None
        _states[mode]["last_result"] = None
        _states[mode]["error"]       = None
        _states[mode]["user_id"]     = user_id

        # Start main thread only if not already running
        thread_needed = _main_thread is None or not _main_thread.is_alive()

    if thread_needed:
        _main_thread = threading.Thread(target=_worker, daemon=True)
        _main_thread.start()

    return jsonify({"success": True, "message": f"Auto {mode} detection started"})


@auto_detection_bp.route('/stop/<mode>', methods=['POST'])
def stop_auto(mode):
    if mode not in ("animal", "plant", "all"):
        return jsonify({"success": False, "error": "Invalid mode"}), 400
    with _lock:
        if mode == "all":
            _states["animal"]["running"] = False
            _states["plant"]["running"]  = False
        else:
            _states[mode]["running"] = False
    return jsonify({"success": True, "message": f"Stopped {mode}"})


@auto_detection_bp.route('/status/<mode>', methods=['GET'])
def get_status(mode):
    if mode not in ("animal", "plant"):
        return jsonify({"success": False, "error": "Invalid mode"}), 400

    with _lock:
        s = dict(_states[mode])
        s["mode"] = mode

    if s["last_image"]:
        s["last_image_url"] = f"/api/auto/image/{s['last_image']}"
    else:
        s["last_image_url"] = None

    # Also expose image_b64 at top level for easy frontend access
    if s.get("last_result") and s["last_result"].get("image_b64"):
        s["image_b64"] = s["last_result"]["image_b64"]
    else:
        s["image_b64"] = None

    return jsonify(s)


@auto_detection_bp.route('/image/<filename>')
def get_auto_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)