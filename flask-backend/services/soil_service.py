# from datetime import datetime

# from database import COLLECTIONS, get_collection
# from services.esp32_bridge import get_sensor_history, get_sensor_snapshot


# def _claim_latest_sensor_reading(user_id: str):
#     if not user_id or user_id == "guest":
#         return

#     snapshot = get_sensor_snapshot()
#     timestamp_value = snapshot.get("timestamp")
#     if not timestamp_value:
#         return

#     try:
#         timestamp = datetime.fromisoformat(str(timestamp_value).replace("Z", "+00:00"))
#     except Exception:
#         return

#     sensor_col = get_collection(COLLECTIONS["SENSORS"])
#     if sensor_col.find_one({"user_id": user_id, "timestamp": timestamp}):
#         return

#     sensor_col.insert_one(
#         {
#             "user_id": user_id,
#             "moisture": snapshot.get("moisture"),
#             "temperature": snapshot.get("temperature"),
#             "humidity": snapshot.get("humidity"),
#             "ph": snapshot.get("ph"),
#             "obstacle": bool(snapshot.get("obstacle", False)),
#             "source": "user-reading",
#             "timestamp": timestamp,
#         }
#     )


# def get_soil_readings(user_id: str | None = None):
#     snapshot = get_sensor_snapshot()
#     if user_id and user_id != "guest":
#         _claim_latest_sensor_reading(user_id)
#         history = get_sensor_history(10, user_id=user_id)
#     else:
#         history = get_sensor_history(10)
#     return {
#         "moisture": snapshot.get("moisture"),
#         "temperature": snapshot.get("temperature"),
#         "humidity": snapshot.get("humidity"),
#         "ph": snapshot.get("ph"),
#         "obstacle": snapshot.get("obstacle"),
#         "connected": snapshot.get("connected"),
#         "timestamp": snapshot.get("timestamp"),
#         "arm_active": snapshot.get("arm_active"),
#         "bot_running": snapshot.get("bot_running"),
#         "history": history,
#         "sensor_source": COLLECTIONS["SENSORS"],
#     }



from database import COLLECTIONS
from services.esp32_bridge import get_sensor_history, get_sensor_snapshot


def get_soil_readings(user_id: str | None = None):
    snapshot = get_sensor_snapshot()
    return {
        "moisture": snapshot.get("moisture"),
        "temperature": snapshot.get("temperature"),
        "humidity": snapshot.get("humidity"),
        "ph": snapshot.get("ph"),
        "obstacle": snapshot.get("obstacle"),
        "connected": snapshot.get("connected"),
        "timestamp": snapshot.get("timestamp"),
        "arm_active": snapshot.get("arm_active"),
        "bot_running": snapshot.get("bot_running"),
        "history": get_sensor_history(10),
        "sensor_source": COLLECTIONS["SENSORS"],
    }