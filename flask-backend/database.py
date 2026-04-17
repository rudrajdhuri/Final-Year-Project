from flask_pymongo import PyMongo

mongo = PyMongo()


def get_db():
    return mongo.db


def get_collection(name: str):
    return mongo.db[name]


def limit_collection(collection_name: str, max_records: int = 15):
    collection = get_collection(collection_name)
    count = collection.count_documents({})
    if count <= max_records:
        return

    oldest = collection.find().sort("timestamp", 1).limit(count - max_records)
    oldest_ids = [doc["_id"] for doc in oldest]
    if oldest_ids:
        collection.delete_many({"_id": {"$in": oldest_ids}})


COLLECTIONS = {
    "ACTUATORS": "actuator_data",
    "SENSORS": "sensor_data",
    "ANIMALS": "animaldect_data",
    "PLANTS": "plantdect_data",
    "USERS": "users",
}
