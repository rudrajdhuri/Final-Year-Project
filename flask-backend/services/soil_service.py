#logic for gebnerating real-time soil sensor data
import random

def get_soil_readings():
    return {
        "moisture": random.randint(30, 90),       # %
        "temperature": random.uniform(18, 38),    # °C
        "ph": round(random.uniform(5.5, 7.5), 2), # pH level
        "nitrogen": random.randint(10, 50),       # mg/kg
        "phosphorus": random.randint(5, 40),
        "potassium": random.randint(20, 60),
        "battery": random.randint(60, 100),
        "timestamp": "just now",
        "graph": [
            {"label": "Moisture", "value": random.randint(30, 90)},
            {"label": "Temperature", "value": random.uniform(18, 38)},
            {"label": "pH", "value": round(random.uniform(5.5, 7.5), 2)}
        ]
    }
