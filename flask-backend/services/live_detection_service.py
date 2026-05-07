import threading
from datetime import datetime, timedelta
from typing import Any

import cv2
from flask import Response

from services.camera_service import capture_single_frame
from services.session_lock_service import is_lock_owner
from services.time_service import iso_ist, now_ist


SESSION_DURATION_SECONDS = 10 * 60
CAPTURE_INTERVAL_SECONDS = 2.5
STREAM_BOUNDARY = b"--frame"

_lock = threading.RLock()
_flask_app = None

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
    return now_ist()


def _iso(value: datetime | None) -> str | None:
    return iso_ist(value)


def _shared_active() -> bool:
    return any(mode_state["running"] for mode_state in _states.values())


def _refresh_expired_modes(current_time: datetime) -> None:
    for mode_state in _states.values():
        if mode_state["running"] and mode_state["ends_at"] and current_time >= mode_state["ends_at"]:
            mode_state["running"] = False
            mode_state["completed"] = True
            mode_state["completed_at"] = current_time
            mode_state["owner_session_id"] = None


def _viewer_can_access(session_id: str | None) -> bool:
    if not session_id:
        return False
    return bool(is_lock_owner(session_id))


def _encode_frame(frame) -> bytes | None:
    ok, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 88])
    if not ok:
        return None
    return buffer.tobytes()


def start_detection(
    mode: str,
    user_id: str = "guest",
    duration_seconds: int | None = SESSION_DURATION_SECONDS,
    owner_session_id: str | None = None,
) -> dict[str, Any]:
    if mode not in _states:
        raise ValueError("Invalid detection mode")

    current_time = _now()
    with _lock:
        _refresh_expired_modes(current_time)
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

    return get_detection_status(mode, owner_session_id)


def stop_detection(mode: str, owner_session_id: str | None = None) -> dict[str, Any]:
    if mode not in _states and mode != "all":
        raise ValueError("Invalid detection mode")

    current_time = _now()
    with _lock:
        _refresh_expired_modes(current_time)
        targets = list(_states.keys()) if mode == "all" else [mode]
        for target in targets:
            if owner_session_id and _states[target].get("owner_session_id") != owner_session_id:
                continue
            _states[target]["running"] = False
            _states[target]["completed"] = True
            _states[target]["completed_at"] = current_time
            _states[target]["owner_session_id"] = None

    return get_all_detection_status(owner_session_id)


def record_detection_result(
    mode: str,
    payload: dict[str, Any],
    owner_session_id: str | None = None,
    stored: bool = False,
) -> None:
    if mode not in _states:
        return

    current_time = _now()
    with _lock:
        _refresh_expired_modes(current_time)
        mode_state = _states[mode]
        if not mode_state["running"]:
            return
        if owner_session_id and mode_state.get("owner_session_id") != owner_session_id:
            return

        result_payload = dict(payload)
        if not stored:
            result_payload["image_b64"] = ""
        mode_state["last_result"] = result_payload
        mode_state["last_inference_at"] = current_time

        if stored:
            mode_state["last_detection"] = result_payload
            mode_state["last_saved_at"] = current_time
            mode_state["detection_count"] += 1


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
        "frame_skip": 1,
        "duration_seconds": duration_seconds,
        "capture_interval_seconds": CAPTURE_INTERVAL_SECONDS,
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
    return Response(
        "Live stream mode has been removed. Use /api/auto/snapshot polling instead.",
        status=410,
        mimetype="text/plain",
    )


def frame_snapshot_response(viewer_session_id: str | None = None):
    current_time = _now()
    with _lock:
        _refresh_expired_modes(current_time)
        active = _shared_active()

    if not active:
        return Response(status=204)

    if not _viewer_can_access(viewer_session_id):
        return Response(status=423)

    try:
        frame, _ = capture_single_frame()
        encoded = _encode_frame(frame)
        if not encoded:
            return Response(status=500)
        return Response(encoded, mimetype="image/jpeg")
    except Exception as exc:
        return Response(str(exc), status=500, mimetype="text/plain")


def capture_cached_frame(viewer_session_id: str | None = None):
    return None
