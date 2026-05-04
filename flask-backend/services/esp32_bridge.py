# import asyncio
# import json
# import os
# import threading
# from datetime import datetime
# from typing import Any

# from websockets.client import connect

# from database import COLLECTIONS, get_collection, limit_collection
# from services.runtime_state import get_runtime_state, is_arm_active, is_bot_running


# ESP32_SENSOR_WS_URL = os.getenv("ESP32_SENSOR_WS_URL", "ws://192.168.4.1/SensorData")

# _bridge_started = False
# _bridge_lock = threading.Lock()
# _state_lock = threading.Lock()
# _flask_app = None
# _last_obstacle_state = False

# _sensor_state: dict[str, Any] = {
#     "connected": False,
#     "last_error": None,
#     "last_seen": None,
#     "accepted_reading": {
#         "moisture": None,
#         "temperature": None,
#         "humidity": None,
#         "ph": None,
#         "timestamp": None,
#     },
#     "reading": {
#         "moisture": None,
#         "temperature": None,
#         "humidity": None,
#         "ph": None,
#         "obstacle": False,
#         "timestamp": None,
#     },
# }


# def _iso_timestamp(value: datetime | None) -> str | None:
#     if not value:
#         return None
#     return iso_ist(value)


# def _normalize(payload: dict[str, Any]) -> dict[str, Any]:
#     return {
#         "moisture": int(payload.get("soilMoisture", 0)) if payload.get("soilMoisture") is not None else None,
#         "temperature": round(float(payload.get("temperature", 0.0)), 1) if payload.get("temperature") is not None else None,
#         "humidity": round(float(payload.get("humidity", 0.0)), 1) if payload.get("humidity") is not None else None,
#         "ph": None,
#         "obstacle": bool(payload.get("obstacle", False)),
#         "timestamp": now_ist(),
#     }


# def _record_actuator_event(event_type: str, message: str, extra: dict[str, Any] | None = None):
#     if _flask_app is None:
#         return

#     with _flask_app.app_context():
#         actuator_col = get_collection(COLLECTIONS["ACTUATORS"])
#         document = {
#             "type": event_type,
#             "message": message,
#             "timestamp": now_ist(),
#         }
#         if extra:
#             document.update(extra)
#         actuator_col.insert_one(document)
#         limit_collection(COLLECTIONS["ACTUATORS"], 10)


# def _persist_sensor_reading(reading: dict[str, Any]):
#     global _last_obstacle_state

#     if _flask_app is None:
#         return

#     if is_arm_active():
#         with _flask_app.app_context():
#             sensor_col = get_collection(COLLECTIONS["SENSORS"])
#             sensor_col.insert_one(
#                 {
#                     "moisture": reading["moisture"],
#                     "temperature": reading["temperature"],
#                     "humidity": reading["humidity"],
#                     "ph": reading["ph"],
#                     "obstacle": reading["obstacle"],
#                     "source": "esp32",
#                     "timestamp": reading["timestamp"],
#                 }
#             )
#             limit_collection(COLLECTIONS["SENSORS"], 50)

#         with _state_lock:
#             _sensor_state["accepted_reading"] = {
#                 "moisture": reading["moisture"],
#                 "temperature": reading["temperature"],
#                 "humidity": reading["humidity"],
#                 "ph": reading["ph"],
#                 "timestamp": reading["timestamp"],
#             }

#     if reading["obstacle"] and not _last_obstacle_state and is_bot_running():
#         _record_actuator_event(
#             "sensor_alert",
#             "Obstacle detected by ultrasonic sensor. Bot should remain stopped.",
#             {"obstacle": True},
#         )
#     _last_obstacle_state = reading["obstacle"]


# def get_sensor_snapshot() -> dict[str, Any]:
#     with _state_lock:
#         reading = dict(_sensor_state["reading"])
#         accepted = dict(_sensor_state["accepted_reading"])
#         runtime = get_runtime_state()
#         return {
#             "connected": _sensor_state["connected"],
#             "last_error": _sensor_state["last_error"],
#             "last_seen": _iso_timestamp(_sensor_state["last_seen"]),
#             "moisture": accepted["moisture"],
#             "temperature": accepted["temperature"],
#             "humidity": accepted["humidity"],
#             "ph": accepted["ph"],
#             "obstacle": reading["obstacle"],
#             "timestamp": _iso_timestamp(accepted["timestamp"]),
#             "raw_timestamp": _iso_timestamp(reading["timestamp"]),
#             "arm_active": runtime["arm_active"],
#             "bot_running": runtime["bot_running"],
#         }


# def get_sensor_history(limit: int = 10, user_id: str | None = None) -> list[dict[str, Any]]:
#     sensor_col = get_collection(COLLECTIONS["SENSORS"])
#     if user_id:
#         rows = list(sensor_col.find({"user_id": user_id}).sort("timestamp", -1).limit(limit))
#     else:
#         rows = list(sensor_col.find({"user_id": {"$exists": False}}).sort("timestamp", -1).limit(limit))
#     rows.reverse()
#     return [
#         {
#             "id": str(row.get("_id")),
#             "moisture": row.get("moisture"),
#             "temperature": row.get("temperature"),
#             "humidity": row.get("humidity"),
#             "ph": row.get("ph"),
#             "obstacle": bool(row.get("obstacle", False)),
#             "timestamp": _iso_timestamp(row.get("timestamp")),
#         }
#         for row in rows
#     ]


# async def _sensor_loop():
#     while True:
#         try:
#             async with connect(ESP32_SENSOR_WS_URL, ping_interval=20, ping_timeout=20) as websocket:
#                 with _state_lock:
#                     _sensor_state["connected"] = True
#                     _sensor_state["last_error"] = None

#                 async for raw_message in websocket:
#                     payload = json.loads(raw_message)
#                     reading = _normalize(payload)
#                     with _state_lock:
#                         _sensor_state["connected"] = True
#                         _sensor_state["last_seen"] = reading["timestamp"]
#                         _sensor_state["reading"] = reading
#                     _persist_sensor_reading(reading)
#         except Exception as exc:
#             with _state_lock:
#                 _sensor_state["connected"] = False
#                 _sensor_state["last_error"] = str(exc)
#             await asyncio.sleep(2)


# def _run_loop():
#     asyncio.run(_sensor_loop())


# def start_sensor_bridge(app):
#     global _bridge_started, _flask_app

#     with _bridge_lock:
#         if _bridge_started:
#             return
#         _bridge_started = True
#         _flask_app = app

#     thread = threading.Thread(target=_run_loop, name="esp32-sensor-bridge", daemon=True)
#     thread.start()



import asyncio
import json
import os
import threading
from datetime import datetime
from typing import Any

from websockets.client import connect

from database import COLLECTIONS, get_collection, limit_collection
from services.runtime_state import get_runtime_state, is_arm_active, is_bot_running
from services.time_service import iso_ist, now_ist


ESP32_SENSOR_WS_URL = os.getenv("ESP32_SENSOR_WS_URL", "ws://192.168.4.1/SensorData")

_bridge_started = False
_bridge_lock = threading.Lock()
_state_lock = threading.Lock()
_flask_app = None
_last_obstacle_state = False

_sensor_state: dict[str, Any] = {
    "connected": False,
    "last_error": None,
    "last_seen": None,
    "accepted_reading": {
        "moisture": None,
        "temperature": None,
        "humidity": None,
        "ph": None,
        "timestamp": None,
    },
    "reading": {
        "moisture": None,
        "temperature": None,
        "humidity": None,
        "ph": None,
        "obstacle": False,
        "timestamp": None,
    },
}


def _iso_timestamp(value: datetime | None) -> str | None:
    return iso_ist(value)


def _normalize(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "moisture": int(payload.get("soilMoisture", 0)) if payload.get("soilMoisture") is not None else None,
        "temperature": round(float(payload.get("temperature", 0.0)), 1) if payload.get("temperature") is not None else None,
        "humidity": round(float(payload.get("humidity", 0.0)), 1) if payload.get("humidity") is not None else None,
        "ph": None,
        "obstacle": bool(payload.get("obstacle", False)),
        "timestamp": now_ist(),
    }


def _record_actuator_event(event_type: str, message: str, extra: dict[str, Any] | None = None):
    if _flask_app is None:
        return

    with _flask_app.app_context():
        actuator_col = get_collection(COLLECTIONS["ACTUATORS"])
        document = {
            "type": event_type,
            "message": message,
            "timestamp": now_ist(),
        }
        if extra:
            document.update(extra)
        actuator_col.insert_one(document)
        limit_collection(COLLECTIONS["ACTUATORS"], 10)


def _persist_sensor_reading(reading: dict[str, Any]):
    global _last_obstacle_state

    if _flask_app is None:
        return

    if is_arm_active():
        with _flask_app.app_context():
            sensor_col = get_collection(COLLECTIONS["SENSORS"])
            sensor_col.insert_one(
                {
                    "moisture": reading["moisture"],
                    "temperature": reading["temperature"],
                    "humidity": reading["humidity"],
                    "ph": reading["ph"],
                    "obstacle": reading["obstacle"],
                    "source": "esp32",
                    "timestamp": reading["timestamp"],
                }
            )
            limit_collection(COLLECTIONS["SENSORS"], 50)

        with _state_lock:
            _sensor_state["accepted_reading"] = {
                "moisture": reading["moisture"],
                "temperature": reading["temperature"],
                "humidity": reading["humidity"],
                "ph": reading["ph"],
                "timestamp": reading["timestamp"],
            }

    if reading["obstacle"] and not _last_obstacle_state and is_bot_running():
        _record_actuator_event(
            "sensor_alert",
            "Obstacle detected by ultrasonic sensor. Bot should remain stopped.",
            {"obstacle": True},
        )
    _last_obstacle_state = reading["obstacle"]


def get_sensor_snapshot() -> dict[str, Any]:
    with _state_lock:
        reading = dict(_sensor_state["reading"])
        accepted = dict(_sensor_state["accepted_reading"])
        runtime = get_runtime_state()
        return {
            "connected": _sensor_state["connected"],
            "last_error": _sensor_state["last_error"],
            "last_seen": _iso_timestamp(_sensor_state["last_seen"]),
            "moisture": accepted["moisture"],
            "temperature": accepted["temperature"],
            "humidity": accepted["humidity"],
            "ph": accepted["ph"],
            "obstacle": reading["obstacle"],
            "timestamp": _iso_timestamp(accepted["timestamp"]),
            "raw_timestamp": _iso_timestamp(reading["timestamp"]),
            "arm_active": runtime["arm_active"],
            "bot_running": runtime["bot_running"],
        }


def get_sensor_history(limit: int = 10, user_id: str | None = None) -> list[dict[str, Any]]:
    # Option A: always return latest global readings regardless of user_id
    sensor_col = get_collection(COLLECTIONS["SENSORS"])
    rows = list(sensor_col.find().sort("timestamp", -1).limit(limit))
    rows.reverse()
    return [
        {
            "id": str(row.get("_id")),
            "moisture": row.get("moisture"),
            "temperature": row.get("temperature"),
            "humidity": row.get("humidity"),
            "ph": row.get("ph"),
            "obstacle": bool(row.get("obstacle", False)),
            "timestamp": _iso_timestamp(row.get("timestamp")),
        }
        for row in rows
    ]


async def _sensor_loop():
    while True:
        try:
            async with connect(ESP32_SENSOR_WS_URL, ping_interval=20, ping_timeout=20) as websocket:
                with _state_lock:
                    _sensor_state["connected"] = True
                    _sensor_state["last_error"] = None

                async for raw_message in websocket:
                    payload = json.loads(raw_message)
                    reading = _normalize(payload)
                    with _state_lock:
                        _sensor_state["connected"] = True
                        _sensor_state["last_seen"] = reading["timestamp"]
                        _sensor_state["reading"] = reading
                    _persist_sensor_reading(reading)
        except Exception as exc:
            with _state_lock:
                _sensor_state["connected"] = False
                _sensor_state["last_error"] = str(exc)
            await asyncio.sleep(2)


def _run_loop():
    asyncio.run(_sensor_loop())


def start_sensor_bridge(app):
    global _bridge_started, _flask_app

    with _bridge_lock:
        if _bridge_started:
            return
        _bridge_started = True
        _flask_app = app

    thread = threading.Thread(target=_run_loop, name="esp32-sensor-bridge", daemon=True)
    thread.start()
