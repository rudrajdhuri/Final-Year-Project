from flask_pymongo import PyMongo

mongo = PyMongo()

def get_db():
    return mongo.db

def get_collection(name: str):
    return mongo.db[name]

COLLECTIONS = {
    'ACTUATORS': 'actuator_data',
    'SENSORS': 'sensor_data',
    'ANIMALS': 'animaldect_data',
    'USERS': 'user_data'
}
