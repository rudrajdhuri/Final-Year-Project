from datetime import datetime

from database import COLLECTIONS, get_collection
from services.esp32_bridge import get_sensor_snapshot


def _format_timestamp(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _sensor_notifications():
    snapshot = get_sensor_snapshot()
    notifications = []
    timestamp = snapshot.get("timestamp") or snapshot.get("last_seen")

    if not snapshot.get("connected"):
        return [
            {
                "id": "sensor-disconnected",
                "type": "info",
                "title": "ESP32 Stream Waiting",
                "message": "The Raspberry Pi backend is waiting for live sensor data from the ESP32 hotspot.",
                "source": "system",
                "timestamp": timestamp,
            }
        ]

    if snapshot.get("obstacle") and snapshot.get("bot_running"):
        notifications.append(
            {
                "id": "sensor-obstacle",
                "type": "warning",
                "title": "Bot Stopped for Safety",
                "message": "Something is in front of the bot, so it has paused to avoid hitting it.",
                "source": "ultrasonic",
                "timestamp": timestamp,
            }
        )

    moisture = snapshot.get("moisture")
    if isinstance(moisture, (int, float)) and moisture <= 30:
        notifications.append(
            {
                "id": "sensor-moisture",
                "type": "warning",
                "title": "Soil Looks Dry",
                "message": f"Soil moisture is low at {moisture}%. This area may need watering soon.",
                "source": "soil",
                "timestamp": timestamp,
            }
        )

    temperature = snapshot.get("temperature")
    if isinstance(temperature, (int, float)) and temperature >= 35:
        notifications.append(
            {
                "id": "sensor-temperature-high",
                "type": "info",
                "title": "Temperature is on the High Side",
                "message": f"The crop area is warm at {temperature} degrees Celsius. Keep an eye on heat stress for common kharif and rabi crops.",
                "source": "temperature",
                "timestamp": timestamp,
            }
        )
    elif isinstance(temperature, (int, float)) and temperature <= 12:
        notifications.append(
            {
                "id": "sensor-temperature-low",
                "type": "info",
                "title": "Temperature is on the Low Side",
                "message": f"The crop area is cool at {temperature} degrees Celsius. Sensitive crops may need attention in this weather.",
                "source": "temperature",
                "timestamp": timestamp,
            }
        )

    if not notifications:
        notifications.append(
            {
                "id": "sensor-stable",
                "type": "success",
                "title": "Farm Readings Look Normal",
                "message": "No urgent issue is being reported from the latest bot readings.",
                "source": "system",
                "timestamp": timestamp,
            }
        )

    return notifications


def _animal_notifications(limit: int = 4):
    animal_col = get_collection(COLLECTIONS["ANIMALS"])
    rows = list(animal_col.find().sort("timestamp", -1).limit(limit))
    notifications = []

    for row in rows:
        message = row.get("message", "")
        if not (bool(row.get("threat_detected")) or "Threat" in message):
            continue

        notifications.append(
            {
                "id": f"animal-{row.get('_id')}",
                "type": "warning",
                "title": "Animal Threat Detected",
                "message": message or f"Threat detected: {row.get('animal_type', 'Unknown animal')}",
                "source": "animal_detection",
                "timestamp": _format_timestamp(row.get("timestamp")),
            }
        )

    return notifications


def _plant_notifications(limit: int = 4):
    plant_col = get_collection(COLLECTIONS["PLANTS"])
    rows = list(plant_col.find().sort("timestamp", -1).limit(limit))
    notifications = []

    for row in rows:
        result = row.get("result", "") or row.get("message", "")
        lowered = result.lower()
        if "unhealthy" not in lowered and "threat" not in lowered:
            continue

        notifications.append(
            {
                "id": f"plant-{row.get('_id')}",
                "type": "warning",
                "title": "Plant Disease Detected",
                "message": result,
                "source": "plant_detection",
                "timestamp": _format_timestamp(row.get("timestamp")),
            }
        )

    return notifications


def get_notifications(limit: int = 10):
    notifications = _sensor_notifications() + _animal_notifications() + _plant_notifications()
    notifications.sort(key=lambda item: item.get("timestamp") or "", reverse=True)
    return notifications[:limit]
