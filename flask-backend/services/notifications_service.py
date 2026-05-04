from datetime import datetime

from database import COLLECTIONS, get_collection
from services.time_service import iso_ist


def _format_timestamp(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return iso_ist(value)
    return str(value)


def _sensor_notifications(user_id: str | None = None, limit: int = 4):
    if not user_id or user_id == "guest":
        return []

    sensor_col = get_collection(COLLECTIONS["SENSORS"])
    rows = list(sensor_col.find({"user_id": user_id}).sort("timestamp", -1).limit(limit))
    notifications = []

    for row in rows:
        timestamp = _format_timestamp(row.get("timestamp"))

        moisture = row.get("moisture")
        if isinstance(moisture, (int, float)) and moisture <= 30:
            notifications.append(
                {
                    "id": f"sensor-moisture-{row.get('_id')}",
                    "type": "warning",
                    "title": "Soil Looks Dry",
                    "message": f"Soil moisture is low at {moisture}%. This area may need watering soon.",
                    "source": "soil",
                    "timestamp": timestamp,
                }
            )

        temperature = row.get("temperature")
        if isinstance(temperature, (int, float)) and temperature >= 35:
            notifications.append(
                {
                    "id": f"sensor-temperature-high-{row.get('_id')}",
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
                    "id": f"sensor-temperature-low-{row.get('_id')}",
                    "type": "info",
                    "title": "Temperature is on the Low Side",
                    "message": f"The crop area is cool at {temperature} degrees Celsius. Sensitive crops may need attention in this weather.",
                    "source": "temperature",
                    "timestamp": timestamp,
                }
            )

        if row.get("obstacle"):
            notifications.append(
                {
                    "id": f"sensor-obstacle-{row.get('_id')}",
                    "type": "warning",
                    "title": "Obstacle Was Detected",
                    "message": "The bot reported an obstacle during a recorded reading session.",
                    "source": "ultrasonic",
                    "timestamp": timestamp,
                }
            )

    if not notifications and rows:
        notifications.append(
            {
                "id": "sensor-stable",
                "type": "success",
                "title": "Farm Readings Look Normal",
                "message": "No urgent issue is being reported from your latest saved bot readings.",
                "source": "system",
                "timestamp": _format_timestamp(rows[0].get("timestamp")),
            }
        )

    return notifications


def _animal_notifications(user_id: str | None = None, limit: int = 4):
    if not user_id or user_id == "guest":
        return []

    animal_col = get_collection(COLLECTIONS["ANIMALS"])
    rows = list(animal_col.find({"user_id": user_id}).sort("timestamp", -1).limit(limit))
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


def _plant_notifications(user_id: str | None = None, limit: int = 4):
    if not user_id or user_id == "guest":
        return []

    plant_col = get_collection(COLLECTIONS["PLANTS"])
    rows = list(plant_col.find({"user_id": user_id}).sort("timestamp", -1).limit(limit))
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


def get_notifications(limit: int = 10, user_id: str | None = None):
    notifications = (
        _sensor_notifications(user_id=user_id)
        + _animal_notifications(user_id=user_id)
        + _plant_notifications(user_id=user_id)
    )
    notifications.sort(key=lambda item: item.get("timestamp") or "", reverse=True)
    return notifications[:limit]
