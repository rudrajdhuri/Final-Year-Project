from database import COLLECTIONS
from services.esp32_bridge import get_sensor_history, get_sensor_snapshot


def get_soil_readings():
    snapshot = get_sensor_snapshot()
    return {
        "moisture": snapshot.get("moisture"),
        "temperature": snapshot.get("temperature"),
        "humidity": snapshot.get("humidity"),
        "ph": snapshot.get("ph"),
        "obstacle": snapshot.get("obstacle"),
        "connected": snapshot.get("connected"),
        "timestamp": snapshot.get("timestamp"),
        "history": get_sensor_history(10),
        "sensor_source": COLLECTIONS["SENSORS"],
    }
