# services/bots_service.py

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
        "area": "Field Zone A"
    },
    {
        "id": "AGR-002",
        "name": "Irrigation Bot Beta",
        "status": "charging",
        "location": "Charging Station B",
        "lat": 40.7589,
        "lng": -73.9851,
        "battery": 15,
        "task": "Charging",
        "lastUpdate": "45 minutes ago",
        "speed": "0 m/s",
        "area": "Service Area"
    }
]


def get_all_bots():
    return BOTS


def get_bot_by_id(bot_id):
    return next((b for b in BOTS if b["id"] == bot_id), None)


def add_bot(data):
    BOTS.append(data)
    return data


def update_bot(bot_id, data):
    bot = get_bot_by_id(bot_id)
    if not bot:
        return None

    for key in data:
        bot[key] = data[key]

    return bot
