# #logic for gebnerating real-time soil sensor data
# import random

# def get_soil_readings():
#     return {
#         "moisture": random.randint(30, 90),       # %
#         "temperature": random.uniform(18, 38),    # °C
#         "ph": round(random.uniform(5.5, 7.5), 2), # pH level
#         "nitrogen": random.randint(10, 50),       # mg/kg
#         "phosphorus": random.randint(5, 40),
#         "potassium": random.randint(20, 60),
#         "battery": random.randint(60, 100),
#         "timestamp": "just now",
#         "graph": [
#             {"label": "Moisture", "value": random.randint(30, 90)},
#             {"label": "Temperature", "value": random.uniform(18, 38)},
#             {"label": "pH", "value": round(random.uniform(5.5, 7.5), 2)}
#         ]
#     }

# services/soil_service.py

# services/soil_service.py

import random
from datetime import datetime
from database import get_collection, COLLECTIONS

def get_soil_readings():
    # ✅ DB access INSIDE function (after app init)
    sensor_col = get_collection(COLLECTIONS['SENSORS'])

    data = {
        "moisture": random.randint(30, 90),
        "temperature": round(random.uniform(18, 38), 2),
        "ph": round(random.uniform(5.5, 7.5), 2),
        "nitrogen": random.randint(10, 50),
        "phosphorus": random.randint(5, 40),
        "potassium": random.randint(20, 60),
        "battery": random.randint(60, 100),
        "timestamp": datetime.utcnow()
    }

    sensor_col.insert_one(data)
    return data
