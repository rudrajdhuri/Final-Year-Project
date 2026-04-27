from services.esp32_bridge import get_sensor_snapshot


def get_system_info():
    snapshot = get_sensor_snapshot()
    return {
        "model": "AgriBot Sensor Arm",
        "battery": "N/A",
        "last_sync": snapshot.get("timestamp") or snapshot.get("last_seen") or "No live data yet",
        "connected": snapshot.get("connected"),
        "source": "ESP32 hotspot stream",
    }
