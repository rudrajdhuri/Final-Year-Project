from datetime import datetime, timezone

from database import COLLECTIONS, get_collection, limit_collection
from services.esp32_bridge import get_sensor_history, get_sensor_snapshot

BOTS = [
    {
        "id": "AGR-001",
        "name": "Harvester Bot Alpha",
        "status": "active",
        "location": "Sector A3, Row 15",
        "lat": 40.7128,
        "lng": -74.0060,
        "battery": 85,
        "task": "Harvesting Tomatoes",
        "lastUpdate": "2 minutes ago",
        "speed": "1.2 m/s",
        "area": "Field Zone A",
    }
]


def get_all_bots():
    snapshot = get_sensor_snapshot()
    history = get_sensor_history(10)
    latest_command = get_collection(COLLECTIONS["ACTUATORS"]).find_one(sort=[("timestamp", -1)])

    current_status = "Monitoring"
    current_task = "Live sensor monitoring"

    if not snapshot.get("connected"):
        current_status = "Waiting for ESP32"
        current_task = "Connect Raspberry Pi to the ESP32 hotspot stream"
    elif snapshot.get("obstacle"):
        current_status = "Obstacle detected"
        current_task = "Stopped for safety"
    elif latest_command:
        if latest_command.get("type") == "movement":
            current_status = "Moving" if latest_command.get("direction") != "S" else "Stopped"
            current_task = f"Manual control: {latest_command.get('direction_label', 'Stop')}"
        elif latest_command.get("type") == "servo":
            current_status = "Sensor arm active"
            current_task = "Servo arm moved for sensing"

    graph_data = []
    for row in history:
        timestamp = row.get("timestamp") or ""
        graph_data.append(
            {
                "time": timestamp[11:16] if len(timestamp) >= 16 else timestamp,
                "moisture": row.get("moisture"),
                "temperature": row.get("temperature"),
                "humidity": row.get("humidity"),
                "ph": row.get("ph"),
            }
        )

    bot = dict(BOTS[0])
    bot.update(
        {
            "status": current_status,
            "task": current_task,
            "soil_moisture": snapshot.get("moisture"),
            "temperature": snapshot.get("temperature"),
            "humidity": snapshot.get("humidity"),
            "obstacle": snapshot.get("obstacle"),
            "lastUpdate": snapshot.get("timestamp") or snapshot.get("last_seen") or "Live",
            "latitude": None,
            "longitude": None,
            "graphData": graph_data,
            "history": history,
        }
    )

    return [bot]


def get_bot_by_id(bot_id):
    return next((b for b in BOTS if b["id"] == bot_id), None)


def add_bot(data):
    data["timestamp"] = datetime.now(timezone.utc)

    try:
        actuator_col = get_collection(COLLECTIONS["ACTUATORS"])
        actuator_col.insert_one(data)
        limit_collection(COLLECTIONS["ACTUATORS"], 10)
    except Exception as db_error:
        print("DB insert failed (add_bot):", db_error)

    BOTS.append(data)
    return data


def update_bot(bot_id, data):
    bot = get_bot_by_id(bot_id)
    if not bot:
        return None

    for key in data:
        bot[key] = data[key]

    try:
        actuator_col = get_collection(COLLECTIONS["ACTUATORS"])
        actuator_col.insert_one(
            {
                "bot_id": bot_id,
                "update": data,
                "timestamp": datetime.now(timezone.utc),
            }
        )
        limit_collection(COLLECTIONS["ACTUATORS"], 10)
    except Exception as db_error:
        print("DB insert failed (update_bot):", db_error)

    return bot


def log_bot_command(command):
    actuator_col = get_collection(COLLECTIONS["ACTUATORS"])
    payload = {
        "type": command.get("type", "movement"),
        "direction": command.get("direction"),
        "direction_label": command.get("direction_label"),
        "raw": command.get("raw"),
        "timestamp": datetime.now(timezone.utc),
    }
    if "message" in command:
        payload["message"] = command["message"]
    actuator_col.insert_one(payload)
    limit_collection(COLLECTIONS["ACTUATORS"], 10)
    return payload
