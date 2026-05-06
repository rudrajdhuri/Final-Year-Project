from datetime import datetime

from database import COLLECTIONS, get_collection
from services.time_service import iso_ist


def _format_timestamp(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return iso_ist(value)
    return str(value)


def _is_plant_threat_message(value: str | None) -> bool:
    lowered = str(value or "").strip().lower()
    if not lowered:
        return False
    return "unhealthy" in lowered and "disease detected" in lowered


def _sensor_query(user_id: str | None = None, session_id: str | None = None):
    if user_id and user_id != "guest":
        return {"user_id": user_id}
    if session_id:
        return {"owner_session_id": session_id}
    return None


def _sensor_notifications(user_id: str | None = None, session_id: str | None = None, limit: int = 4):
    query = _sensor_query(user_id, session_id)
    if query is None:
        return []

    sensor_col = get_collection(COLLECTIONS["SENSORS"])
    rows = list(sensor_col.find(query).sort("timestamp", -1).limit(limit))
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


def _animal_notifications(user_id: str | None = None, session_id: str | None = None, limit: int = 4):
    query = _sensor_query(user_id, session_id)
    if query is None:
        return []

    animal_col = get_collection(COLLECTIONS["ANIMALS"])
    rows = list(animal_col.find(query).sort("timestamp", -1).limit(limit))
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


def _plant_notifications(user_id: str | None = None, session_id: str | None = None, limit: int = 4):
    query = _sensor_query(user_id, session_id)
    if query is None:
        return []

    plant_col = get_collection(COLLECTIONS["PLANTS"])
    rows = list(plant_col.find(query).sort("timestamp", -1).limit(limit))
    notifications = []

    for row in rows:
        result = row.get("result", "") or row.get("message", "")
        if not _is_plant_threat_message(result):
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


def _obstacle_notifications(user_id: str | None = None, session_id: str | None = None, limit: int = 6):
    query = _sensor_query(user_id, session_id)
    if query is None:
        return []

    actuator_col = get_collection(COLLECTIONS["ACTUATORS"])
    rows = list(
        actuator_col.find(
            {
                **query,
                "type": "sensor_alert",
                "obstacle": True,
            }
        )
        .sort("timestamp", -1)
        .limit(limit)
    )
    return [
        {
            "id": f"obstacle-{row.get('_id')}",
            "type": "warning",
            "title": "Obstacle Was Detected",
            "message": row.get("message")
            or "The bot reported an obstacle. Please clear the path before continuing.",
            "source": "ultrasonic",
            "timestamp": _format_timestamp(row.get("timestamp")),
        }
        for row in rows
    ]


def get_notifications(limit: int = 10, user_id: str | None = None, session_id: str | None = None):
    notifications = (
        _sensor_notifications(user_id=user_id, session_id=session_id)
        + _animal_notifications(user_id=user_id, session_id=session_id)
        + _plant_notifications(user_id=user_id, session_id=session_id)
        + _obstacle_notifications(user_id=user_id, session_id=session_id)
    )
    notifications.sort(key=lambda item: item.get("timestamp") or "", reverse=True)
    return notifications[:limit]
