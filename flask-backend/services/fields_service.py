# services/fields_service.py
import random

CROPS = ["corn", "wheat", "soy", "cotton"]

def generate_field_data():
    fields = []

    for i in range(1, 7):
        fields.append({
            "id": f"FIELD_{i}",
            "name": f"Field Zone {i}",
            "cropType": random.choice(CROPS),
            "acres": round(random.uniform(10, 50), 1),
            "ndviValue": round(random.uniform(0.2, 0.9), 2),
            "soilHealth": random.randint(60, 100),
            "moistureLevel": random.randint(30, 80),
            "currentStage": random.choice(["Seeding", "Growing", "Flowering", "Ripening"]),
            "yieldPrediction": random.randint(120, 200),
            "expectedHarvest": "2025-11-25",
            "plantingDate": "2025-08-15",
            "coordinates": [
                {"lat": 40.75 + random.random()/100, "lng": -73.98 + random.random()/100}
            ]
        })

    return fields
