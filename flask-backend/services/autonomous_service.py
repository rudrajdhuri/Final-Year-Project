import threading
import time
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from database import COLLECTIONS, get_collection, limit_collection
from services.esp32_bridge import get_sensor_snapshot
from services.live_detection_service import start_detection, stop_detection
from services.runtime_state import clear_arm, set_autonomous_motion, trigger_arm

try:
    from websockets.sync.client import connect as ws_connect
except Exception:  # pragma: no cover
    ws_connect = None


ESP32_CONTROL_WS_URL = "ws://192.168.4.1/CarInput"
AUTONOMOUS_SPEED = 205
SERVO_BREAK_SECONDS = 6.0
OBSTACLE_POLL_SECONDS = 0.2
OBSTACLE_WAIT_SECONDS = 5.0
TURN_BYPASS_SECONDS = 0.75
FORWARD_BYPASS_SECONDS = 1.25
MIN_SEGMENT_MS = 250
PROFILE_LIMIT = 10

COMMAND_TO_RAW = {
    "F": "MoveCar,1",
    "B": "MoveCar,2",
    "L": "MoveCar,3",
    "R": "MoveCar,4",
    "S": "MoveCar,0",
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

    def send(self, message: str):
        with self._lock:
            try:
                self._ensure_connection()
                self._socket.send(message)
            except Exception:
                self.close()
                self._ensure_connection()
                self._socket.send(message)

    def set_speed(self, value: int):
        self.send(f"Speed,{int(value)}")

    def move(self, direction: str):
        raw = COMMAND_TO_RAW.get(direction, COMMAND_TO_RAW["S"])
        self.send(raw)

    def servo_down(self):
        self.send("Servo,down")

    def stop(self):
        self.move("S")

    def close(self):
        with self._lock:
            if self._socket is None:
                return
            try:
                self._socket.close()
            except Exception:
                pass
            finally:
                self._socket = None


_control_client = ESP32ControlClient()
_state_lock = threading.Lock()
_auto_thread: threading.Thread | None = None

_recording_state: dict[str, Any] = {
    "active": False,
    "user_id": "guest",
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
    "user_id": "guest",
    "error": None,
    "breaks_taken": 0,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime | None) -> str | None:
    if not value:
        return None
    return value.astimezone(timezone.utc).isoformat()


def _duration_ms(start: datetime, end: datetime) -> int:
    return max(0, int((end - start).total_seconds() * 1000))


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
            segments.append(
                {
                    "direction": last_direction,
                    "duration_ms": duration_ms,
                }
            )
    _recording_state["last_event_at"] = current_time


def start_manual_recording(user_id: str = "guest") -> dict[str, Any]:
    with _state_lock:
        if _autonomous_state["running"]:
            raise RuntimeError("Stop autonomous mode before starting a new training profile")
        if _recording_state["active"]:
            raise RuntimeError("Manual profile recording is already active")

        current_time = _now()
        _recording_state["active"] = True
        _recording_state["user_id"] = user_id
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
        started_at = _recording_state["started_at"]
        segments = list(_recording_state["segments"])
        user_id = _recording_state["user_id"]

        _recording_state["active"] = False
        _recording_state["started_at"] = None
        _recording_state["last_event_at"] = None
        _recording_state["last_direction"] = None
        _recording_state["segments"] = []

    if not segments:
        raise RuntimeError("No movement was recorded. Drive the bot manually before saving.")

    total_duration_ms = sum(segment["duration_ms"] for segment in segments)
    breakpoints_ms = [int(total_duration_ms / 3), int((total_duration_ms * 2) / 3)]

    profile_doc = {
        "name": name,
        "user_id": user_id,
        "segments": segments,
        "segment_count": len(segments),
        "breakpoints_ms": breakpoints_ms,
        "speed_pwm": AUTONOMOUS_SPEED,
        "total_duration_ms": total_duration_ms,
        "timestamp": current_time,
        "created_at": current_time,
        "updated_at": current_time,
    }

    collection = get_collection(COLLECTIONS["PROFILES"])
    inserted = collection.insert_one(profile_doc)
    limit_collection(COLLECTIONS["PROFILES"], PROFILE_LIMIT)

    return {"success": True, "profile_id": str(inserted.inserted_id), "profile": _serialize_profile({**profile_doc, "_id": inserted.inserted_id})}


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

    total_ms = sum(segment["duration_ms"] for segment in segments)
    if active and last_direction and last_direction != "S":
        total_ms += buffered_duration_ms

    return {
        "active": active,
        "started_at": _iso(started_at),
        "last_direction": last_direction,
        "segment_count": len(segments),
        "total_duration_ms": total_ms,
    }


def _serialize_profile(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row.get("_id")),
        "name": row.get("name"),
        "user_id": row.get("user_id"),
        "segment_count": row.get("segment_count", len(row.get("segments", []))),
        "total_duration_ms": row.get("total_duration_ms", 0),
        "breakpoints_ms": row.get("breakpoints_ms", []),
        "speed_pwm": row.get("speed_pwm", AUTONOMOUS_SPEED),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
        "segments_preview": row.get("segments", [])[:8],
    }


def get_profiles() -> list[dict[str, Any]]:
    rows = list(get_collection(COLLECTIONS["PROFILES"]).find().sort("created_at", -1).limit(PROFILE_LIMIT))
    return [_serialize_profile(row) for row in rows]


def _stop_detection_sessions():
    try:
        stop_detection("all")
    except Exception:
        pass


def _start_detection_sessions(user_id: str):
    start_detection("animal", user_id=user_id, duration_seconds=None)
    start_detection("plant", user_id=user_id, duration_seconds=None)


def _set_autonomous_state(**updates):
    with _state_lock:
        _autonomous_state.update(updates)


def _pause_for_obstacle(direction: str) -> bool:
    _control_client.stop()
    set_autonomous_motion(True, "S")
    _set_autonomous_state(paused_reason="obstacle", current_direction="S")

    wait_started = time.time()
    while True:
        snapshot = get_sensor_snapshot()
        if not snapshot.get("obstacle"):
            break
        with _state_lock:
            if not _autonomous_state["running"]:
                return False
        if time.time() - wait_started >= OBSTACLE_WAIT_SECONDS:
            return _attempt_obstacle_bypass(direction)
        time.sleep(OBSTACLE_POLL_SECONDS)

    _control_client.move(direction)
    set_autonomous_motion(True, direction)
    _set_autonomous_state(paused_reason=None, current_direction=direction)
    return True


def _drive_for(direction: str, seconds: float) -> bool:
    _control_client.move(direction)
    set_autonomous_motion(True, direction)
    _set_autonomous_state(current_direction=direction)
    started = time.time()
    while time.time() - started < seconds:
        with _state_lock:
            if not _autonomous_state["running"]:
                return False
        time.sleep(0.05)
    return True


def _attempt_obstacle_bypass(direction: str) -> bool:
    _set_autonomous_state(paused_reason="obstacle_avoidance", current_direction="S")

    strategies = [
        ("R", "L"),
        ("L", "R"),
    ]

    for first_turn, second_turn in strategies:
        _control_client.stop()
        time.sleep(0.2)

        if not _drive_for(first_turn, TURN_BYPASS_SECONDS):
            return False

        snapshot = get_sensor_snapshot()
        if snapshot.get("obstacle"):
            if not _drive_for(second_turn, TURN_BYPASS_SECONDS):
                return False
            continue

        if not _drive_for("F", FORWARD_BYPASS_SECONDS):
            return False

        if not _drive_for(second_turn, TURN_BYPASS_SECONDS):
            return False

        snapshot = get_sensor_snapshot()
        if not snapshot.get("obstacle"):
            _control_client.move(direction)
            set_autonomous_motion(True, direction)
            _set_autonomous_state(paused_reason=None, current_direction=direction)
            return True

    _control_client.stop()
    set_autonomous_motion(True, "S")
    _set_autonomous_state(paused_reason="obstacle", current_direction="S")

    while True:
        snapshot = get_sensor_snapshot()
        if not snapshot.get("obstacle"):
            _control_client.move(direction)
            set_autonomous_motion(True, direction)
            _set_autonomous_state(paused_reason=None, current_direction=direction)
            return True
        with _state_lock:
            if not _autonomous_state["running"]:
                return False
        time.sleep(OBSTACLE_POLL_SECONDS)


def _take_servo_break() -> bool:
    _control_client.stop()
    set_autonomous_motion(True, "S")
    _set_autonomous_state(paused_reason="servo_break", current_direction="S")
    try:
        _control_client.servo_down()
        trigger_arm(SERVO_BREAK_SECONDS)
    except Exception:
        pass

    start = time.time()
    while time.time() - start < SERVO_BREAK_SECONDS:
        with _state_lock:
            if not _autonomous_state["running"]:
                return False
        time.sleep(0.2)

    with _state_lock:
        _autonomous_state["breaks_taken"] += 1
        _autonomous_state["paused_reason"] = None
    return True


def _run_autonomous_profile(profile_doc: dict[str, Any]):
    segments = profile_doc.get("segments", [])
    breakpoints_ms = list(profile_doc.get("breakpoints_ms", []))
    total_duration_ms = int(profile_doc.get("total_duration_ms", 0))
    user_id = profile_doc.get("user_id", "guest")

    try:
        _control_client.set_speed(AUTONOMOUS_SPEED)
        _control_client.stop()
        clear_arm()
        set_autonomous_motion(True, "S")
        _start_detection_sessions(user_id)

        progress_ms = 0
        next_break_index = 0

        for index, segment in enumerate(segments):
            with _state_lock:
                if not _autonomous_state["running"]:
                    break
                _autonomous_state["current_segment_index"] = index

            direction = segment["direction"]
            remaining_ms = int(segment["duration_ms"])
            _control_client.move(direction)
            set_autonomous_motion(True, direction)
            _set_autonomous_state(current_direction=direction)

            while remaining_ms > 0:
                with _state_lock:
                    if not _autonomous_state["running"]:
                        break

                snapshot = get_sensor_snapshot()
                if snapshot.get("obstacle"):
                    if not _pause_for_obstacle(direction):
                        break

                if next_break_index < len(breakpoints_ms) and progress_ms >= breakpoints_ms[next_break_index]:
                    if not _take_servo_break():
                        break
                    _control_client.move(direction)
                    set_autonomous_motion(True, direction)
                    _set_autonomous_state(current_direction=direction)
                    next_break_index += 1

                chunk_ms = min(remaining_ms, 100)
                time.sleep(chunk_ms / 1000)
                remaining_ms -= chunk_ms
                progress_ms += chunk_ms

                _set_autonomous_state(progress_ms=progress_ms)

            with _state_lock:
                if not _autonomous_state["running"]:
                    break

        _control_client.stop()
        clear_arm()
        completed_at = _now()
        with _state_lock:
            was_running = _autonomous_state["running"]
            _autonomous_state["running"] = False
            _autonomous_state["completed"] = was_running
            _autonomous_state["completed_at"] = completed_at
            _autonomous_state["current_direction"] = "S"
            _autonomous_state["current_segment_index"] = len(segments) - 1 if segments else -1
        set_autonomous_motion(False, "S")
    except Exception as exc:
        _control_client.stop()
        clear_arm()
        set_autonomous_motion(False, "S")
        with _state_lock:
            _autonomous_state["running"] = False
            _autonomous_state["completed"] = False
            _autonomous_state["error"] = str(exc)
            _autonomous_state["current_direction"] = "S"
    finally:
        _stop_detection_sessions()


def start_autonomous(profile_id: str, user_id: str = "guest") -> dict[str, Any]:
    global _auto_thread

    try:
        object_id = ObjectId(profile_id) if profile_id else None
    except Exception as exc:
        raise RuntimeError("Selected training profile id is invalid") from exc

    row = get_collection(COLLECTIONS["PROFILES"]).find_one({"_id": object_id}) if object_id else None
    if row is None:
        raise RuntimeError("Selected training profile was not found")

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
                "total_segments": len(row.get("segments", [])),
                "progress_ms": 0,
                "total_duration_ms": int(row.get("total_duration_ms", 0)),
                "user_id": user_id,
                "error": None,
                "breaks_taken": 0,
            }
        )

    _auto_thread = threading.Thread(target=_run_autonomous_profile, args=(row,), name="autonomous-profile-runner", daemon=True)
    _auto_thread.start()
    return get_autonomous_status()


def stop_autonomous() -> dict[str, Any]:
    with _state_lock:
        _autonomous_state["running"] = False
        _autonomous_state["paused_reason"] = "stopped_by_user"
        _autonomous_state["completed"] = False
        _autonomous_state["completed_at"] = _now()

    _control_client.stop()
    clear_arm()
    set_autonomous_motion(False, "S")
    _stop_detection_sessions()
    return get_autonomous_status()


def get_autonomous_status() -> dict[str, Any]:
    with _state_lock:
        status = dict(_autonomous_state)

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
        "error": status["error"],
        "breaks_taken": status["breaks_taken"],
        "speed_pwm": AUTONOMOUS_SPEED,
        "obstacle": bool(get_sensor_snapshot().get("obstacle")),
    }
