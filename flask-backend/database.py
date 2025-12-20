# """
# MongoDB Database Configuration
# Provides database instance and helper functions
# """
# from flask_pymongo import PyMongo

# # Global MongoDB instance
# mongo = PyMongo()

# def get_db():
#     """Get MongoDB database instance"""
#     return mongo.db

# def get_collection(collection_name):
#     """Get a specific collection from the database"""
#     db = mongo.db
#     if db is None:
#         raise RuntimeError("Database not initialized. Ensure PyMongo is initialized with the Flask app.")
#     return db[collection_name]

# # Collection names
# # COLLECTIONS = {
# #     'BOTS': 'bots',
# #     'FIELDS': 'fields',
# #     'SOIL_READINGS': 'soil_readings',
# #     'DETECTIONS': 'animal_detections',
# #     'NOTIFICATIONS': 'notifications',
# #     'USERS': 'users'
# # }
# COLLECTIONS = {
#     'ACTUATORS': 'actuator_data',
#     'SENSORS': 'sensor_data',
#     'ANIMALS': 'animaldect_data',
#     'USERS': 'user_data'
# }

# """
# MongoDB Database Configuration
# Provides database instance and helper functions
# """
# from flask_pymongo import PyMongo

# # Global MongoDB instance
# mongo = PyMongo()

# def get_db():
#     """Get MongoDB database instance"""
#     return mongo.db

# def get_collection(collection_name):
#     """Get a specific collection from the database"""
#     db = mongo.db
#     if db is None:
#         raise RuntimeError("Database not initialized. Ensure PyMongo is initialized with the Flask app.")
#     return db[collection_name]

# # Collection names
# # COLLECTIONS = {
# #     'BOTS': 'bots',
# #     'FIELDS': 'fields',
# #     'SOIL_READINGS': 'soil_readings',
# #     'DETECTIONS': 'animal_detections',
# #     'NOTIFICATIONS': 'notifications',
# #     'USERS': 'users'
# # }
# COLLECTIONS = {
#     'ACTUATORS': 'actuator_data',
#     'SENSORS': 'sensor_data',
#     'ANIMALS': 'animaldect_data',
#     'USERS': 'user_data'
# }

# flask-backend/database.py

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
