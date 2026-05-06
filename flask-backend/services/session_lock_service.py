import threading
import uuid
from datetime import datetime, timedelta
from typing import Any

from services.time_service import iso_ist, now_ist


LOCK_TIMEOUT_SECONDS = 35
ALLOWED_LOCK_TYPES = {"model_manual", "bot_control", "autonomous"}

_lock = threading.RLock()
_state: dict[str, Any] = {
    "locked": False,
    "owner_session_id": None,
    "owner_user_id": None,
    "lock_type": None,
    "lock_id": None,
    "acquired_at": None,
    "last_seen_at": None,
}
_expire_callbacks = []


def _now() -> datetime:
    return now_ist()


def _iso(value: datetime | None) -> str | None:
    return iso_ist(value)


def _expired(current_time: datetime) -> bool:
    last_seen = _state.get("last_seen_at")
    if not _state.get("locked") or not last_seen:
        return False
    return current_time - last_seen > timedelta(seconds=LOCK_TIMEOUT_SECONDS)


def _clear(run_callbacks: bool = True) -> None:
    was_locked = bool(_state.get("locked"))
    _state.update(
        {
            "locked": False,
            "owner_session_id": None,
            "owner_user_id": None,
            "lock_type": None,
            "lock_id": None,
            "acquired_at": None,
            "last_seen_at": None,
        }
    )
    if was_locked and run_callbacks:
        callbacks = list(_expire_callbacks)
        for callback in callbacks:
            try:
                callback()
            except Exception:
                pass


def _refresh(current_time: datetime | None = None) -> None:
    if _expired(current_time or _now()):
        _clear()


def get_lock_status(session_id: str | None = None) -> dict[str, Any]:
    with _lock:
        _refresh()
        owner = bool(session_id and _state.get("owner_session_id") == session_id)
        return {
            "locked": bool(_state["locked"]),
            "owner": owner,
            "owner_user_id": _state["owner_user_id"] if owner else None,
            "lock_type": _state["lock_type"],
            "lock_id": _state["lock_id"] if owner else None,
            "acquired_at": _iso(_state["acquired_at"]),
            "last_seen_at": _iso(_state["last_seen_at"]),
            "timeout_seconds": LOCK_TIMEOUT_SECONDS,
        }


def acquire_lock(lock_type: str, user_id: str = "guest", session_id: str | None = None) -> dict[str, Any]:
    if lock_type not in ALLOWED_LOCK_TYPES:
        raise RuntimeError("Invalid bot lock type")
    if not session_id:
        raise RuntimeError("Client session is required")

    current_time = _now()
    with _lock:
        _refresh(current_time)

        if _state["locked"] and _state["owner_session_id"] != session_id:
            raise RuntimeError("Bot is in use by someone. Please try after sometime.")

        if not _state["locked"]:
            _state["lock_id"] = str(uuid.uuid4())
            _state["acquired_at"] = current_time

        _state["locked"] = True
        _state["owner_session_id"] = session_id
        _state["owner_user_id"] = user_id or "guest"
        _state["lock_type"] = lock_type
        _state["last_seen_at"] = current_time
        return get_lock_status(session_id)


def heartbeat_lock(session_id: str | None, user_id: str | None = None) -> dict[str, Any]:
    if not session_id:
        raise RuntimeError("Client session is required")

    current_time = _now()
    with _lock:
        _refresh(current_time)
        if not _state["locked"] or _state["owner_session_id"] != session_id:
            raise RuntimeError("This browser does not own the bot session")
        if user_id:
            _state["owner_user_id"] = user_id
        _state["last_seen_at"] = current_time
        return get_lock_status(session_id)


def release_lock(session_id: str | None) -> dict[str, Any]:
    if not session_id:
        raise RuntimeError("Client session is required")

    with _lock:
        _refresh()
        if _state["locked"] and _state["owner_session_id"] == session_id:
            _clear()
        return get_lock_status(session_id)


def is_lock_owner(session_id: str | None) -> bool:
    with _lock:
        _refresh()
        return bool(session_id and _state["locked"] and _state["owner_session_id"] == session_id)


def get_active_lock_owner() -> dict[str, Any]:
    with _lock:
        _refresh()
        return {
            "locked": bool(_state["locked"]),
            "owner_session_id": _state["owner_session_id"],
            "owner_user_id": _state["owner_user_id"],
            "lock_type": _state["lock_type"],
            "acquired_at": _state["acquired_at"],
            "last_seen_at": _state["last_seen_at"],
        }


def require_lock_owner(session_id: str | None) -> None:
    if not is_lock_owner(session_id):
        raise RuntimeError("Bot is in use by someone. Please try after sometime.")


def transfer_owner_session(session_id: str | None, user_id: str) -> None:
    if not session_id or not user_id:
        return
    with _lock:
        _refresh()
        if _state["locked"] and _state["owner_session_id"] == session_id:
            _state["owner_user_id"] = user_id


def register_expire_callback(callback) -> None:
    if callback not in _expire_callbacks:
        _expire_callbacks.append(callback)
