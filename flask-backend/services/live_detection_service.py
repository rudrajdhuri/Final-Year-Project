import base64
import os
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import cv2
from flask import Response

from database import COLLECTIONS, get_collection, limit_collection
from services.session_lock_service import is_lock_owner


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

SESSION_DURATION_SECONDS = 10 * 60
FRAME_SKIP = 5
CAPTURE_INTERVAL_SECONDS = 0.2
SAVE_COOLDOWN_SECONDS = 8
STREAM_BOUNDARY = b"--frame"
DETECTION_HISTORY_LIMIT = 20

_lock = threading.RLock()
_worker_thread: threading.Thread | None = None
_flask_app = None
_camera_handle = None
_camera_kind: str | None = None
_latest_frame: bytes | None = None
_frame_counter = 0
_animal_predictor = None
_plant_predictor = None

_states: dict[str, dict[str, Any]] = {
    "animal": {
        "running": False,
        "completed": False,
        "started_at": None,
        "ends_at": None,
        "completed_at": None,
        "user_id": "guest",
        "owner_session_id": None,
        "error": None,
        "last_result": None,
        "last_detection": None,
        "last_inference_at": None,
        "last_saved_at": None,
        "detection_count": 0,
    },
    "plant": {
        "running": False,
        "completed": False,
        "started_at": None,
        "ends_at": None,
        "completed_at": None,
        "user_id": "guest",
        "owner_session_id": None,
        "error": None,
        "last_result": None,
        "last_detection": None,
        "last_inference_at": None,
        "last_saved_at": None,
        "detection_count": 0,
    },
}


def bind_live_detection_app(app):
    global _flask_app
    _flask_app = app


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime | None) -> str | None:
    if not value:
        return None
    return value.astimezone(timezone.utc).isoformat()


def _shared_active() -> bool:
    return any(mode_state["running"] for mode_state in _states.values())


def _active_owner_session_id() -> str | None:
    for mode_state in _states.values():
        if mode_state["running"]:
            return mode_state.get("owner_session_id")
    return None


def _viewer_can_see(session_id: str | None) -> bool:
    owner_session_id = _active_owner_session_id()
    return bool(owner_session_id and session_id == owner_session_id and is_lock_owner(session_id))


def _get_animal_predictor():
    global _animal_predictor
    if _animal_predictor is None:
        from models.animal_main import predict as animal_predict

        _animal_predictor = animal_predict
    return _animal_predictor


def _get_plant_predictor():
    global _plant_predictor
    if _plant_predictor is None:
        from models.plant_main import predict as plant_predict

        _plant_predictor = plant_predict
    return _plant_predictor


def _encode_frame(frame) -> bytes | None:
    ok, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 72])
    if not ok:
        return None
    return buffer.tobytes()


def _image_to_b64(frame) -> str:
    encoded = _encode_frame(frame)
    if not encoded:
        return ""
    return "data:image/jpeg;base64," + base64.b64encode(encoded).decode()


def _open_camera() -> None:
    global _camera_handle, _camera_kind

    if _camera_handle is not None:
        return

    try:
        from picamera2 import Picamera2

        camera = Picamera2()
        config = camera.create_video_configuration(main={"size": (640, 480), "format": "RGB888"})
        camera.configure(config)
        camera.start()
        time.sleep(0.4)
        _camera_handle = camera
        _camera_kind = "picamera2"
        return
    except Exception:
        pass

    fallback = cv2.VideoCapture(0)
    fallback.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    fallback.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    if not fallback.isOpened():
        raise RuntimeError("Pi camera could not be opened")
    _camera_handle = fallback
    _camera_kind = "opencv"


def _close_camera() -> None:
    global _camera_handle, _camera_kind

    if _camera_handle is None:
        return

    try:
        if _camera_kind == "picamera2":
            _camera_handle.stop()
            _camera_handle.close()
        else:
            _camera_handle.release()
    except Exception:
        pass
    finally:
        _camera_handle = None
        _camera_kind = None


def _read_frame():
    if _camera_handle is None:
        _open_camera()

    if _camera_kind == "picamera2":
        frame = _camera_handle.capture_array()
        return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

    ok, frame = _camera_handle.read()
    if not ok:
        raise RuntimeError("Failed to read a frame from the camera")
    return frame


def _annotate_frame(frame, title: str, detail: str, color: tuple[int, int, int]):
    annotated = frame.copy()
    cv2.rectangle(annotated, (16, 16), (624, 104), (18, 24, 38), -1)
    cv2.rectangle(annotated, (16, 16), (624, 104), color, 2)
    cv2.putText(annotated, title, (32, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.85, color, 2, cv2.LINE_AA)
    cv2.putText(annotated, detail, (32, 84), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (240, 248, 255), 2, cv2.LINE_AA)
    return annotated


def _parse_animal_result(result_text: str) -> dict[str, Any]:
    threat = "Threat" in result_text
    animal_name = "Unknown"
    confidence = 0.0

    if "Animal:" in result_text:
        try:
            animal_part = result_text.split("Animal:")[1]
            animal_name = animal_part.split("(")[0].strip()
            confidence = round(float(animal_part.split("(")[1].replace("%)", "")), 2)
        except Exception:
            confidence = 0.0
    elif "(" in result_text and "%)" in result_text:
        try:
            confidence = round(float(result_text.split("(")[1].replace("%)", "")), 2)
        except Exception:
            confidence = 0.0

    return {
        "success": True,
        "message": result_text,
        "threat_detected": threat,
        "animal_type": animal_name,
        "confidence": confidence,
        "relevant": threat,
    }


def _parse_plant_result(result_text: str, confidence: float) -> dict[str, Any]:
    confidence_value = round(float(confidence * 100), 2)
    relevant = "UNHEALTHY" in result_text
    return {
        "success": True,
        "message": result_text,
        "confidence": confidence_value,
        "relevant": relevant,
    }


def _should_save(mode: str, current_time: datetime) -> bool:
    last_saved = _states[mode].get("last_saved_at")
    if not last_saved:
        return True
    return (current_time - last_saved).total_seconds() >= SAVE_COOLDOWN_SECONDS


def _save_detection(mode: str, parsed: dict[str, Any], frame, current_time: datetime) -> dict[str, Any]:
    if _flask_app is None:
        raise RuntimeError("Live detection service is not bound to the Flask app")

    filename = f"{mode}_live_{uuid.uuid4().hex[:10]}.jpg"
    image_b64 = _image_to_b64(frame)
    user_id = _states[mode]["user_id"]

    with _flask_app.app_context():
        if mode == "animal":
            collection = get_collection(COLLECTIONS["ANIMALS"])
            inserted = collection.insert_one(
                {
                    "user_id": user_id,
                    "threat_detected": parsed["threat_detected"],
                    "animal_type": parsed["animal_type"],
                    "confidence": parsed["confidence"],
                    "filename": filename,
                    "message": parsed["message"],
                    "image_b64": image_b64,
                    "timestamp": current_time,
                }
            )
            limit_collection(COLLECTIONS["ANIMALS"], DETECTION_HISTORY_LIMIT)
            payload = {
                "record_id": str(inserted.inserted_id),
                "success": True,
                "threat_detected": parsed["threat_detected"],
                "animal_type": parsed["animal_type"],
                "confidence": parsed["confidence"],
                "filename": filename,
                "message": parsed["message"],
                "image_b64": image_b64,
                "timestamp": _iso(current_time),
            }
        else:
            collection = get_collection(COLLECTIONS["PLANTS"])
            inserted = collection.insert_one(
                {
                    "user_id": user_id,
                    "result": parsed["message"],
                    "confidence": parsed["confidence"],
                    "filename": filename,
                    "image_b64": image_b64,
                    "timestamp": current_time,
                }
            )
            limit_collection(COLLECTIONS["PLANTS"], DETECTION_HISTORY_LIMIT)
            payload = {
                "record_id": str(inserted.inserted_id),
                "success": True,
                "confidence": parsed["confidence"],
                "filename": filename,
                "message": parsed["message"],
                "image_b64": image_b64,
                "timestamp": _iso(current_time),
            }

    return payload


def _refresh_expired_modes(current_time: datetime) -> None:
    for mode, mode_state in _states.items():
        if mode_state["running"] and mode_state["ends_at"] and current_time >= mode_state["ends_at"]:
            mode_state["running"] = False
            mode_state["completed"] = True
            mode_state["completed_at"] = current_time
            mode_state["owner_session_id"] = None


def _run_worker():
    global _latest_frame, _worker_thread, _frame_counter

    try:
        _open_camera()
    except Exception as exc:
        with _lock:
            for mode_state in _states.values():
                if mode_state["running"]:
                    mode_state["running"] = False
                    mode_state["error"] = str(exc)
                    mode_state["completed"] = False
        return

    try:
        while True:
            current_time = _now()
            with _lock:
                _refresh_expired_modes(current_time)
                active_modes = [mode for mode, state in _states.items() if state["running"]]

            if not active_modes:
                break

            try:
                frame = _read_frame()
            except Exception as exc:
                with _lock:
                    for mode in active_modes:
                        _states[mode]["running"] = False
                        _states[mode]["error"] = str(exc)
                break

            if frame is None or getattr(frame, "size", 0) == 0:
                with _lock:
                    for mode in active_modes:
                        _states[mode]["error"] = "Camera returned an empty frame"
                time.sleep(CAPTURE_INTERVAL_SECONDS)
                continue

            display_frame = frame.copy()
            encoded_preview = _encode_frame(display_frame)
            if encoded_preview:
                with _lock:
                    _latest_frame = encoded_preview

            _frame_counter += 1
            if _frame_counter % FRAME_SKIP != 0:
                time.sleep(CAPTURE_INTERVAL_SECONDS)
                continue

            temp_filename = f"live_session_{uuid.uuid4().hex[:10]}.jpg"
            temp_path = os.path.join(UPLOAD_FOLDER, temp_filename)
            cv2.imwrite(temp_path, frame)

            annotations: list[tuple[str, str, tuple[int, int, int]]] = []
            try:
                for mode in active_modes:
                    parsed: dict[str, Any]
                    if mode == "animal":
                        parsed = _parse_animal_result(_get_animal_predictor()(temp_path))
                    else:
                        plant_message, plant_confidence = _get_plant_predictor()(temp_path)
                        parsed = _parse_plant_result(plant_message, plant_confidence)

                    with _lock:
                        _states[mode]["last_result"] = {
                            **parsed,
                            "timestamp": _iso(current_time),
                        }
                        _states[mode]["last_inference_at"] = current_time

                    if not parsed["relevant"]:
                        continue

                    with _lock:
                        can_save = _should_save(mode, current_time)

                    if not can_save:
                        continue

                    if mode == "animal":
                        label = parsed.get("animal_type") or "Animal"
                        annotated = _annotate_frame(
                            frame,
                            "Animal threat detected",
                            f"{label} | {parsed['confidence']}%",
                            (35, 35, 220),
                        )
                        annotations.append(("Animal threat", label, (35, 35, 220)))
                    else:
                        annotated = _annotate_frame(
                            frame,
                            "Plant disease detected",
                            f"Confidence {parsed['confidence']}%",
                            (0, 145, 255),
                        )
                        annotations.append(("Plant disease", parsed["message"], (0, 145, 255)))

                    saved = _save_detection(mode, parsed, annotated, current_time)
                    with _lock:
                        _states[mode]["last_detection"] = saved
                        _states[mode]["last_saved_at"] = current_time
                        _states[mode]["detection_count"] += 1

                if annotations:
                    for title, detail, color in annotations:
                        display_frame = _annotate_frame(display_frame, title, detail[:60], color)
                    encoded_annotated = _encode_frame(display_frame)
                    if encoded_annotated:
                        with _lock:
                            _latest_frame = encoded_annotated
            finally:
                try:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                except Exception:
                    pass

            time.sleep(CAPTURE_INTERVAL_SECONDS)
    finally:
        _close_camera()
        with _lock:
            _worker_thread = None


def start_detection(
    mode: str,
    user_id: str = "guest",
    duration_seconds: int | None = SESSION_DURATION_SECONDS,
    owner_session_id: str | None = None,
) -> dict[str, Any]:
    global _worker_thread

    if mode not in _states:
        raise ValueError("Invalid detection mode")

    current_time = _now()
    with _lock:
        _states[mode]["running"] = True
        _states[mode]["completed"] = False
        _states[mode]["started_at"] = current_time
        _states[mode]["ends_at"] = current_time + timedelta(seconds=duration_seconds) if duration_seconds else None
        _states[mode]["completed_at"] = None
        _states[mode]["user_id"] = user_id
        _states[mode]["owner_session_id"] = owner_session_id
        _states[mode]["error"] = None
        _states[mode]["last_result"] = None
        _states[mode]["last_detection"] = None
        _states[mode]["last_inference_at"] = None
        _states[mode]["last_saved_at"] = None
        _states[mode]["detection_count"] = 0

        should_start_thread = _worker_thread is None or not _worker_thread.is_alive()

    if should_start_thread:
        _worker_thread = threading.Thread(target=_run_worker, name="live-detection-worker", daemon=True)
        _worker_thread.start()

    return get_detection_status(mode, owner_session_id)


def stop_detection(mode: str, owner_session_id: str | None = None) -> dict[str, Any]:
    if mode not in _states and mode != "all":
        raise ValueError("Invalid detection mode")

    current_time = _now()
    with _lock:
        targets = list(_states.keys()) if mode == "all" else [mode]
        for target in targets:
            if owner_session_id and _states[target].get("owner_session_id") != owner_session_id:
                continue
            _states[target]["running"] = False
            _states[target]["completed"] = True
            _states[target]["completed_at"] = current_time
            _states[target]["owner_session_id"] = None

    return get_all_detection_status(owner_session_id)


def update_owner_user_id(owner_session_id: str | None, user_id: str) -> None:
    if not owner_session_id or not user_id:
        return
    with _lock:
        for mode_state in _states.values():
            if mode_state.get("owner_session_id") == owner_session_id:
                mode_state["user_id"] = user_id


def stop_all_for_lock_release() -> None:
    try:
        stop_detection("all")
    except Exception:
        pass


def get_detection_status(mode: str, viewer_session_id: str | None = None) -> dict[str, Any]:
    if mode not in _states:
        raise ValueError("Invalid detection mode")

    current_time = _now()
    with _lock:
        _refresh_expired_modes(current_time)
        mode_state = dict(_states[mode])
        shared_active = _shared_active()
        active_modes = [name for name, state in _states.items() if state["running"]]
        owner = bool(
            viewer_session_id
            and mode_state.get("owner_session_id") == viewer_session_id
            and is_lock_owner(viewer_session_id)
        )

    remaining_seconds = 0
    if mode_state["running"] and mode_state["ends_at"]:
        remaining_seconds = max(0, int((mode_state["ends_at"] - current_time).total_seconds()))

    duration_seconds = None
    if mode_state["started_at"] and mode_state["ends_at"]:
        duration_seconds = int((mode_state["ends_at"] - mode_state["started_at"]).total_seconds())

    return {
        "mode": mode,
        "running": mode_state["running"],
        "completed": mode_state["completed"],
        "started_at": _iso(mode_state["started_at"]),
        "ends_at": _iso(mode_state["ends_at"]),
        "completed_at": _iso(mode_state["completed_at"]),
        "remaining_seconds": remaining_seconds,
        "detection_count": mode_state["detection_count"],
        "last_result": mode_state["last_result"] if owner else None,
        "last_detection": mode_state["last_detection"] if owner else None,
        "last_inference_at": _iso(mode_state["last_inference_at"]) if owner else None,
        "error": mode_state["error"],
        "stream_active": shared_active,
        "active_modes": active_modes,
        "frame_skip": FRAME_SKIP,
        "duration_seconds": duration_seconds,
        "owner": owner,
        "blocked": mode_state["running"] and not owner,
    }


def get_all_detection_status(viewer_session_id: str | None = None) -> dict[str, Any]:
    return {
        "animal": get_detection_status("animal", viewer_session_id),
        "plant": get_detection_status("plant", viewer_session_id),
        "stream_active": any(get_detection_status(mode, viewer_session_id)["running"] for mode in _states),
    }


def frame_stream_response(viewer_session_id: str | None = None):
    def generator():
        while True:
            with _lock:
                frame = _latest_frame if _viewer_can_see(viewer_session_id) else None
                active = _shared_active()

            if frame is not None:
                yield (
                    STREAM_BOUNDARY
                    + b"\r\nContent-Type: image/jpeg\r\nContent-Length: "
                    + str(len(frame)).encode()
                    + b"\r\n\r\n"
                    + frame
                    + b"\r\n"
                )

            if not active and frame is None:
                time.sleep(0.2)
            else:
                time.sleep(0.1)

    return Response(generator(), mimetype="multipart/x-mixed-replace; boundary=frame")


def frame_snapshot_response(viewer_session_id: str | None = None):
    with _lock:
        frame = _latest_frame if _viewer_can_see(viewer_session_id) else None
        active = _shared_active()

    if frame is None:
        status = 204 if active else 404
        return Response(status=status)

    return Response(frame, mimetype="image/jpeg")
