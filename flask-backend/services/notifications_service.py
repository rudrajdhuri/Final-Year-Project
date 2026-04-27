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
        notifications.append(
            {
                "id": "sensor-disconnected",
                "type": "info",
                "title": "ESP32 Stream Waiting",
                "message": "The Raspberry Pi backend is waiting for live sensor data from the ESP32 hotspot.",
                "source": "system",
                "timestamp": timestamp,
            }
        )
        return notifications

    if snapshot.get("obstacle"):
        notifications.append(
            {
                "id": "sensor-obstacle",
                "type": "warning",
                "title": "Obstacle Detected",
                "message": "The ultrasonic sensor has detected something within the stop range.",
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
                "title": "Low Soil Moisture",
                "message": f"Soil moisture is low at {moisture}%. Irrigation may be needed.",
                "source": "soil",
                "timestamp": timestamp,
            }
        )

    temperature = snapshot.get("temperature")
    if isinstance(temperature, (int, float)) and temperature >= 38:
        notifications.append(
            {
                "id": "sensor-temperature",
                "type": "warning",
                "title": "High Temperature",
                "message": f"Temperature is high at {temperature}°C near the sensor arm.",
                "source": "dht",
                "timestamp": timestamp,
            }
        )

    if not notifications:
        notifications.append(
            {
                "id": "sensor-stable",
                "type": "success",
                "title": "Sensors Stable",
                "message": "No active threat is detected from the live sensor stream.",
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
        if not ("unhealthy" in lowered or "animal image given" in lowered or "threat" in lowered):
            continue

        notifications.append(
            {
                "id": f"plant-{row.get('_id')}",
                "type": "warning",
                "title": "Plant Threat Detected",
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
