import json
import threading
import time
from datetime import datetime
from typing import Any

from bson import ObjectId

from database import COLLECTIONS, get_collection, limit_collection
from services.live_detection_service import start_detection, stop_detection
from services.runtime_state import clear_arm, set_autonomous_motion
from services.time_service import iso_ist, now_ist

try:
    from websockets.sync.client import connect as ws_connect
except Exception:
    ws_connect = None


ESP32_CONTROL_WS_URL = "ws://192.168.4.1/CarInput"
AUTONOMOUS_SPEED = 200
MIN_SEGMENT_MS = 250
PROFILE_LIMIT = 10
ESP32_RESPONSE_TIMEOUT = 4.0

COMMAND_TO_VALUE = {
    "F": 1,
    "B": 2,
    "L": 4,
    "R": 3,
    "S": 0,
}

VALUE_TO_DIRECTION = {value: key for key, value in COMMAND_TO_VALUE.items()}

COMMAND_TO_RAW = {
    direction: f"MoveCar,{value}"
    for direction, value in COMMAND_TO_VALUE.items()
}


class ESP32ControlClient:
    def __init__(self):
        self._lock = threading.Lock()
        self._socket = None

    def _ensure_connection(self):
        if self._socket is not None:
            return
        if ws_connect is None:
            raise RuntimeError("WebSocket sync client is unavailable in this Python environment")
        self._socket = ws_connect(ESP32_CONTROL_WS_URL, open_timeout=3, close_timeout=1)

    def _close_unlocked(self):
        if self._socket is None:
            return
        try:
            self._socket.close()
        except Exception:
            pass
        finally:
            self._socket = None

    def _recv_json(self, timeout: float, expected_kind: str | None = None) -> dict[str, Any]:
        deadline = time.time() + max(0.5, timeout)
        while time.time() < deadline:
            remaining = max(0.1, deadline - time.time())
            try:
                raw = self._socket.recv(timeout=remaining)
            except TypeError:
                raw = self._socket.recv()
            except Exception as exc:
                raise RuntimeError(f"ESP32 response failed: {exc}") from exc

            if not isinstance(raw, str):
                continue

            try:
                payload = json.loads(raw)
            except Exception:
                continue

            if expected_kind and payload.get("kind") != expected_kind:
                continue
            return payload

        raise RuntimeError("Timed out waiting for ESP32 response")

    def send(self, message: str):
        with self._lock:
            for attempt in range(2):
                try:
                    self._ensure_connection()
                    self._socket.send(message)
                    return
                except Exception:
                    self._close_unlocked()
                    if attempt == 1:
                        raise

    def request_json(self, message: str, expected_kind: str, timeout: float = ESP32_RESPONSE_TIMEOUT) -> dict[str, Any]:
        with self._lock:
            for attempt in range(2):
                try:
                    self._ensure_connection()
                    self._socket.send(message)
                    return self._recv_json(timeout, expected_kind)
                except Exception:
                    self._close_unlocked()
                    if attempt == 1:
                        raise

        raise RuntimeError("ESP32 request failed")

    def set_speed(self, value: int):
        self.send(f"Speed,{int(value)}")

    def move(self, direction: str):
        self.send(COMMAND_TO_RAW.get(direction, COMMAND_TO_RAW["S"]))

    def stop(self):
        self.move("S")

    def mode_record(self):
        self.send("Mode,record")

    def mode_play(self):
        self.send("Mode,play")

    def mode_stop(self):
        self.send("Mode,stop")

    def clear_path(self):
        self.send("Path,clear")

    def append_path_action(self, command: int, timestamp_ms: int):
        self.send(f"Path,append,{int(command)},{int(timestamp_ms)}")

    def load_path(self, actions: list[dict[str, int]]):
        self.mode_stop()
        self.clear_path()
        for action in actions:
            self.append_path_action(action["command"], action["timestamp_ms"])

    def export_path(self) -> dict[str, Any]:
        return self.request_json("Path,export", expected_kind="path_export")

    def get_status(self) -> dict[str, Any]:
        return self.request_json("Status,get", expected_kind="status")

    def close(self):
        with self._lock:
            self._close_unlocked()


_control_client = ESP32ControlClient()
_state_lock = threading.Lock()
_auto_thread: threading.Thread | None = None

_recording_state: dict[str, Any] = {
    "active": False,
    "user_id": "guest",
    "owner_session_id": None,
    "started_at": None,
    "last_event_at": None,
    "last_direction": None,
    "segments": [],
}

_autonomous_state: dict[str, Any] = {
    "running": False,
    "completed": False,
    "profile_id": None,
    "profile_name": None,
    "started_at": None,
    "completed_at": None,
    "paused_reason": None,
    "current_direction": "S",
    "current_segment_index": -1,
    "total_segments": 0,
    "progress_ms": 0,
    "total_duration_ms": 0,
    "path_action_count": 0,
    "mode_status": "MANUAL",
    "playback_paused": False,
    "user_id": "guest",
    "owner_session_id": None,
    "error": None,
    "obstacle": False,
}


def _now() -> datetime:
    return now_ist()


def _iso(value: datetime | None) -> str | None:
    return iso_ist(value)


def _duration_ms(start: datetime, end: datetime) -> int:
    return max(0, int((end - start).total_seconds() * 1000))


def _normalize_path_actions(actions: list[dict[str, Any]] | None) -> list[dict[str, int]]:
    normalized: list[dict[str, int]] = []
    last_timestamp = 0

    for action in actions or []:
        try:
            command = int(action.get("command"))
            timestamp_ms = int(action.get("timestamp_ms", action.get("timestamp", 0)))
        except Exception:
            continue

        if command not in VALUE_TO_DIRECTION:
            continue

        timestamp_ms = max(last_timestamp, max(0, timestamp_ms))
        normalized.append({"command": command, "timestamp_ms": timestamp_ms})
        last_timestamp = timestamp_ms

    return normalized


def _segments_from_actions(actions: list[dict[str, int]]) -> list[dict[str, int | str]]:
    segments: list[dict[str, int | str]] = []
    if len(actions) < 2:
        return segments

    for index, action in enumerate(actions[:-1]):
        next_action = actions[index + 1]
        direction = VALUE_TO_DIRECTION.get(int(action["command"]), "S")
        duration_ms = max(0, int(next_action["timestamp_ms"]) - int(action["timestamp_ms"]))

        if direction == "S" or duration_ms < MIN_SEGMENT_MS:
            continue

        if segments and segments[-1]["direction"] == direction:
            segments[-1]["duration_ms"] = int(segments[-1]["duration_ms"]) + duration_ms
        else:
            segments.append({"direction": direction, "duration_ms": duration_ms})

    return segments


def _legacy_path_from_segments(segments: list[dict[str, Any]] | None) -> list[dict[str, int]]:
    actions: list[dict[str, int]] = []
    elapsed_ms = 0

    for segment in segments or []:
        direction = str(segment.get("direction") or "S")
        duration_ms = max(0, int(segment.get("duration_ms", 0)))
        command_value = COMMAND_TO_VALUE.get(direction)
        if command_value is None or duration_ms <= 0:
            continue

        actions.append({"command": command_value, "timestamp_ms": elapsed_ms})
        elapsed_ms += duration_ms
        actions.append({"command": COMMAND_TO_VALUE["S"], "timestamp_ms": elapsed_ms})

    return _normalize_path_actions(actions)


def _profile_path_actions(row: dict[str, Any]) -> list[dict[str, int]]:
    movement_path = _normalize_path_actions(row.get("movement_path"))
    if movement_path:
        return movement_path
    return _legacy_path_from_segments(row.get("segments"))


def _path_duration_ms(actions: list[dict[str, int]]) -> int:
    if not actions:
        return 0
    return max(0, int(actions[-1]["timestamp_ms"]))


def _current_segment_index(segments: list[dict[str, Any]], progress_ms: int) -> int:
    if not segments:
        return -1

    elapsed = 0
    for index, segment in enumerate(segments):
        elapsed += max(0, int(segment.get("duration_ms", 0)))
        if progress_ms < elapsed:
            return index
    return len(segments) - 1


def _flush_recording_segment(current_time: datetime):
    if not _recording_state["active"]:
        return

    last_direction = _recording_state["last_direction"]
    last_event_at = _recording_state["last_event_at"]
    if not last_direction or not last_event_at:
        return

    duration_ms = _duration_ms(last_event_at, current_time)
    if duration_ms <= 0:
        _recording_state["last_event_at"] = current_time
        return

    if last_direction != "S" and duration_ms >= MIN_SEGMENT_MS:
        segments = _recording_state["segments"]
        if segments and segments[-1]["direction"] == last_direction:
            segments[-1]["duration_ms"] += duration_ms
        else:
            segments.append({"direction": last_direction, "duration_ms": duration_ms})
    _recording_state["last_event_at"] = current_time


def start_manual_recording(user_id: str = "guest", owner_session_id: str | None = None) -> dict[str, Any]:
    with _state_lock:
        if _autonomous_state["running"]:
            raise RuntimeError("Stop autonomous mode before starting a new training profile")
        if _recording_state["active"]:
            raise RuntimeError("Manual profile recording is already active")

    try:
        _control_client.set_speed(AUTONOMOUS_SPEED)
        _control_client.stop()
        _control_client.clear_path()
        _control_client.mode_record()
    except Exception as exc:
        raise RuntimeError(f"Could not start ESP32 training recorder: {exc}") from exc

    with _state_lock:
        current_time = _now()
        _recording_state["active"] = True
        _recording_state["user_id"] = user_id
        _recording_state["owner_session_id"] = owner_session_id
        _recording_state["started_at"] = current_time
        _recording_state["last_event_at"] = current_time
        _recording_state["last_direction"] = "S"
        _recording_state["segments"] = []

    return get_manual_recording_status()


def stop_manual_recording(profile_name: str) -> dict[str, Any]:
    name = (profile_name or "").strip()
    if not name:
        raise RuntimeError("A profile name is required")

    with _state_lock:
        if not _recording_state["active"]:
            raise RuntimeError("No manual profile recording is active")

        current_time = _now()
        _flush_recording_segment(current_time)
        user_id = _recording_state["user_id"]
        owner_session_id = _recording_state.get("owner_session_id")

    try:
        _control_client.mode_stop()
        exported = _control_client.export_path()
    except Exception as exc:
        with _state_lock:
            _recording_state["active"] = False
            _recording_state["started_at"] = None
            _recording_state["last_event_at"] = None
            _recording_state["last_direction"] = None
            _recording_state["owner_session_id"] = None
            _recording_state["segments"] = []
        raise RuntimeError(f"Could not save the ESP32 training path: {exc}") from exc

    with _state_lock:
        _recording_state["active"] = False
        _recording_state["started_at"] = None
        _recording_state["last_event_at"] = None
        _recording_state["last_direction"] = None
        _recording_state["owner_session_id"] = None
        _recording_state["segments"] = []

    movement_path = _normalize_path_actions(exported.get("actions"))
    segments = _segments_from_actions(movement_path)
    total_duration_ms = max(
        int(exported.get("totalDurationMs", 0) or 0),
        _path_duration_ms(movement_path),
    )

    if not movement_path or total_duration_ms <= 0 or not segments:
        raise RuntimeError("No movement was recorded. Drive the bot manually before saving.")

    current_time = _now()
    profile_doc = {
        "name": name,
        "user_id": user_id,
        "owner_session_id": owner_session_id,
        "movement_path": movement_path,
        "path_action_count": len(movement_path),
        "segments": segments,
        "segment_count": len(segments),
        "breakpoints_ms": [],
        "speed_pwm": AUTONOMOUS_SPEED,
        "total_duration_ms": total_duration_ms,
        "timestamp": current_time,
        "created_at": current_time,
        "updated_at": current_time,
    }

    collection = get_collection(COLLECTIONS["PROFILES"])
    inserted = collection.insert_one(profile_doc)
    limit_collection(COLLECTIONS["PROFILES"], PROFILE_LIMIT)

    return {
        "success": True,
        "profile_id": str(inserted.inserted_id),
        "profile": _serialize_profile({**profile_doc, "_id": inserted.inserted_id}),
    }


def record_manual_command(command: dict[str, Any]):
    if command.get("type") != "movement":
        return

    direction = command.get("direction")
    if direction not in {"F", "B", "L", "R", "S"}:
        return

    with _state_lock:
        if not _recording_state["active"]:
            return
        current_time = _now()
        _flush_recording_segment(current_time)
        _recording_state["last_direction"] = direction
        _recording_state["last_event_at"] = current_time


def get_manual_recording_status() -> dict[str, Any]:
    with _state_lock:
        active = _recording_state["active"]
        started_at = _recording_state["started_at"]
        last_event_at = _recording_state["last_event_at"]
        last_direction = _recording_state["last_direction"]
        segments = list(_recording_state["segments"])

    current_time = _now()
    buffered_duration_ms = 0
    if active and last_event_at:
        buffered_duration_ms = _duration_ms(last_event_at, current_time)

    total_ms = sum(int(segment["duration_ms"]) for segment in segments)
    if active and last_direction and last_direction != "S":
        total_ms += buffered_duration_ms

    return {
        "active": active,
        "started_at": _iso(started_at),
        "last_direction": last_direction,
        "segment_count": len(segments),
        "total_duration_ms": total_ms,
    }


def is_manual_recording_active() -> bool:
    with _state_lock:
        return bool(_recording_state["active"])


def _serialize_profile(row: dict[str, Any]) -> dict[str, Any]:
    actions = _profile_path_actions(row)
    segments = row.get("segments") or _segments_from_actions(actions)
    return {
        "id": str(row.get("_id")),
        "name": row.get("name"),
        "user_id": row.get("user_id"),
        "segment_count": row.get("segment_count", len(segments)),
        "path_action_count": row.get("path_action_count", len(actions)),
        "total_duration_ms": row.get("total_duration_ms", _path_duration_ms(actions)),
        "breakpoints_ms": row.get("breakpoints_ms", []),
        "speed_pwm": row.get("speed_pwm", AUTONOMOUS_SPEED),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
        "segments_preview": segments[:8],
    }


def get_profiles(user_id: str | None = None, owner_session_id: str | None = None) -> list[dict[str, Any]]:
    if user_id and user_id != "guest":
        query = {"user_id": user_id}
    else:
        query = {"user_id": "guest", "owner_session_id": owner_session_id} if owner_session_id else {"_id": None}

    rows = list(
        get_collection(COLLECTIONS["PROFILES"])
        .find(query)
        .sort("created_at", -1)
        .limit(PROFILE_LIMIT)
    )
    return [_serialize_profile(row) for row in rows]


def _stop_detection_sessions():
    try:
        stop_detection("all")
    except Exception:
        pass


def _start_detection_sessions(user_id: str, owner_session_id: str | None):
    start_detection("animal", user_id=user_id, duration_seconds=None, owner_session_id=owner_session_id)
    start_detection("plant", user_id=user_id, duration_seconds=None, owner_session_id=owner_session_id)


def _set_autonomous_state(**updates):
    with _state_lock:
        _autonomous_state.update(updates)


def _apply_esp32_status(status_payload: dict[str, Any], segments: list[dict[str, Any]], total_duration_ms: int):
    obstacle = bool(status_payload.get("obstacle", False))
    playback_paused = bool(status_payload.get("playbackPaused", False))
    mode_status = str(status_payload.get("modeStatus", "MANUAL") or "MANUAL")
    progress_ms = min(total_duration_ms, max(0, int(status_payload.get("elapsedMs", 0) or 0)))
    current_command = VALUE_TO_DIRECTION.get(int(status_payload.get("currentCommand", 0) or 0), "S")
    current_direction = "S" if playback_paused else current_command
    paused_reason = "obstacle" if playback_paused else None
    current_segment_index = _current_segment_index(segments, progress_ms)

    set_autonomous_motion(True, current_direction if mode_status == "PLAYBACK" else "S")
    _set_autonomous_state(
        paused_reason=paused_reason,
        current_direction=current_direction,
        current_segment_index=current_segment_index,
        progress_ms=progress_ms,
        obstacle=obstacle,
        mode_status=mode_status,
        playback_paused=playback_paused,
    )


def _run_autonomous_profile(profile_doc: dict[str, Any]):
    movement_path = _profile_path_actions(profile_doc)
    segments = profile_doc.get("segments") or _segments_from_actions(movement_path)
    total_duration_ms = max(int(profile_doc.get("total_duration_ms", 0) or 0), _path_duration_ms(movement_path))
    user_id = profile_doc.get("user_id", "guest")
    owner_session_id = profile_doc.get("_active_owner_session_id")

    try:
        _control_client.set_speed(AUTONOMOUS_SPEED)
        _control_client.stop()
        clear_arm()
        set_autonomous_motion(True, "S")
        _control_client.load_path(movement_path)
        _start_detection_sessions(user_id, owner_session_id)
        _control_client.mode_play()

        while True:
            with _state_lock:
                if not _autonomous_state["running"]:
                    break

            status_payload = _control_client.get_status()
            _apply_esp32_status(status_payload, segments, total_duration_ms)

            completed = bool(status_payload.get("completed"))
            if completed:
                completed_at = _now()
                with _state_lock:
                    _autonomous_state["running"] = False
                    _autonomous_state["completed"] = True
                    _autonomous_state["completed_at"] = completed_at
                    _autonomous_state["paused_reason"] = None
                    _autonomous_state["current_direction"] = "S"
                    _autonomous_state["current_segment_index"] = len(segments) - 1 if segments else -1
                    _autonomous_state["progress_ms"] = total_duration_ms
                    _autonomous_state["mode_status"] = "MANUAL"
                    _autonomous_state["playback_paused"] = False
                set_autonomous_motion(False, "S")
                break

            time.sleep(0.5)
    except Exception as exc:
        _control_client.stop()
        clear_arm()
        set_autonomous_motion(False, "S")
        with _state_lock:
            _autonomous_state["running"] = False
            _autonomous_state["completed"] = False
            _autonomous_state["error"] = str(exc)
            _autonomous_state["current_direction"] = "S"
            _autonomous_state["mode_status"] = "ERROR"
            _autonomous_state["playback_paused"] = False
    finally:
        _stop_detection_sessions()


def start_autonomous(profile_id: str, user_id: str = "guest", owner_session_id: str | None = None) -> dict[str, Any]:
    global _auto_thread

    try:
        object_id = ObjectId(profile_id) if profile_id else None
    except Exception as exc:
        raise RuntimeError("Selected training profile id is invalid") from exc

    if user_id and user_id != "guest":
        query = {"_id": object_id, "user_id": user_id}
    else:
        query = {"_id": object_id, "user_id": "guest", "owner_session_id": owner_session_id}

    row = get_collection(COLLECTIONS["PROFILES"]).find_one(query) if object_id else None
    if row is None:
        raise RuntimeError("Selected training profile was not found")

    movement_path = _profile_path_actions(row)
    if not movement_path:
        raise RuntimeError("Selected profile does not contain a replayable path. Train and save it again.")

    row["_active_owner_session_id"] = owner_session_id
    segments = row.get("segments") or _segments_from_actions(movement_path)
    total_duration_ms = max(int(row.get("total_duration_ms", 0) or 0), _path_duration_ms(movement_path))

    with _state_lock:
        if _recording_state["active"]:
            raise RuntimeError("Stop manual training recording before starting autonomous mode")
        if _autonomous_state["running"]:
            raise RuntimeError("Autonomous mode is already running")

        started_at = _now()
        _autonomous_state.update(
            {
                "running": True,
                "completed": False,
                "profile_id": str(row["_id"]),
                "profile_name": row.get("name"),
                "started_at": started_at,
                "completed_at": None,
                "paused_reason": None,
                "current_direction": "S",
                "current_segment_index": -1,
                "total_segments": len(segments),
                "progress_ms": 0,
                "total_duration_ms": total_duration_ms,
                "path_action_count": len(movement_path),
                "mode_status": "PLAYBACK",
                "playback_paused": False,
                "user_id": user_id,
                "owner_session_id": owner_session_id,
                "error": None,
                "obstacle": False,
            }
        )

    _auto_thread = threading.Thread(
        target=_run_autonomous_profile,
        args=(row,),
        name="autonomous-profile-runner",
        daemon=True,
    )
    _auto_thread.start()
    return get_autonomous_status(owner_session_id)


def stop_autonomous() -> dict[str, Any]:
    with _state_lock:
        _autonomous_state["running"] = False
        _autonomous_state["paused_reason"] = "stopped_by_user"
        _autonomous_state["completed"] = False
        _autonomous_state["completed_at"] = _now()
        _autonomous_state["mode_status"] = "MANUAL"
        _autonomous_state["playback_paused"] = False
        _autonomous_state["current_direction"] = "S"

    try:
        _control_client.mode_stop()
    except Exception:
        pass
    try:
        _control_client.stop()
    except Exception:
        pass
    clear_arm()
    set_autonomous_motion(False, "S")
    _stop_detection_sessions()
    return get_autonomous_status()


def get_autonomous_status(viewer_session_id: str | None = None) -> dict[str, Any]:
    with _state_lock:
        status = dict(_autonomous_state)

    owner = bool(viewer_session_id and status.get("owner_session_id") == viewer_session_id)
    total_duration_ms = status.get("total_duration_ms") or 0
    progress_ms = min(total_duration_ms, status.get("progress_ms") or 0)
    progress_ratio = (progress_ms / total_duration_ms) if total_duration_ms else 0

    return {
        "running": status["running"],
        "completed": status["completed"],
        "profile_id": status["profile_id"],
        "profile_name": status["profile_name"],
        "started_at": _iso(status["started_at"]),
        "completed_at": _iso(status["completed_at"]),
        "paused_reason": status["paused_reason"],
        "current_direction": status["current_direction"],
        "current_segment_index": status["current_segment_index"],
        "total_segments": status["total_segments"],
        "progress_ms": progress_ms,
        "total_duration_ms": total_duration_ms,
        "progress_ratio": round(progress_ratio, 4),
        "error": status["error"] if owner or not status["running"] else None,
        "speed_pwm": AUTONOMOUS_SPEED,
        "obstacle": bool(status.get("obstacle", False)),
        "owner": owner,
        "blocked": status["running"] and not owner,
        "path_action_count": int(status.get("path_action_count") or 0),
        "mode_status": status.get("mode_status") or "MANUAL",
        "playback_paused": bool(status.get("playback_paused", False)),
    }


def update_owner_user_id(owner_session_id: str | None, user_id: str) -> None:
    if not owner_session_id or not user_id:
        return

    with _state_lock:
        if _recording_state.get("owner_session_id") == owner_session_id:
            _recording_state["user_id"] = user_id
        if _autonomous_state.get("owner_session_id") == owner_session_id:
            _autonomous_state["user_id"] = user_id


def stop_all_for_lock_release() -> None:
    with _state_lock:
        running = bool(_autonomous_state["running"])
        recording = bool(_recording_state["active"])
        _recording_state["active"] = False
        _recording_state["owner_session_id"] = None

    if running:
        try:
            stop_autonomous()
        except Exception:
            pass
    elif recording:
        try:
            _control_client.mode_stop()
            _control_client.stop()
        except Exception:
            pass
