import threading
import time
from datetime import datetime, timezone
from typing import Any


_lock = threading.Lock()

_state: dict[str, Any] = {
    "manual_direction": "S",
    "autonomous_running": False,
    "autonomous_direction": "S",
    "arm_active_until": 0.0,
    "arm_last_triggered_at": None,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def set_manual_direction(direction: str):
    with _lock:
        _state["manual_direction"] = direction or "S"


def set_autonomous_motion(running: bool, direction: str = "S"):
    with _lock:
        _state["autonomous_running"] = bool(running)
        _state["autonomous_direction"] = direction or "S"


def trigger_arm(duration_seconds: float):
    with _lock:
        _state["arm_active_until"] = time.time() + max(0.0, float(duration_seconds))
        _state["arm_last_triggered_at"] = _now()


def clear_arm():
    with _lock:
        _state["arm_active_until"] = 0.0


def is_arm_active() -> bool:
    with _lock:
        return time.time() < _state["arm_active_until"]


def is_bot_running() -> bool:
    with _lock:
        manual_running = _state["manual_direction"] in {"F", "B", "L", "R"}
        autonomous_running = _state["autonomous_running"] and _state["autonomous_direction"] in {"F", "B", "L", "R"}
        return manual_running or autonomous_running


def get_runtime_state() -> dict[str, Any]:
    with _lock:
        return {
            "manual_direction": _state["manual_direction"],
            "autonomous_running": _state["autonomous_running"],
            "autonomous_direction": _state["autonomous_direction"],
            "arm_active": time.time() < _state["arm_active_until"],
            "arm_last_triggered_at": _state["arm_last_triggered_at"].isoformat()
            if _state["arm_last_triggered_at"]
            else None,
            "bot_running": (
                _state["manual_direction"] in {"F", "B", "L", "R"}
                or (_state["autonomous_running"] and _state["autonomous_direction"] in {"F", "B", "L", "R"})
            ),
        }
