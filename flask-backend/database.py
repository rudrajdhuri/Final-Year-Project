"""
MongoDB Database Configuration
Provides database instance and helper functions
"""
from flask_pymongo import PyMongo

# Global MongoDB instance
mongo = PyMongo()

def get_db():
    """Get MongoDB database instance"""
    return mongo.db

def get_collection(collection_name):
    """Get a specific collection from the database"""
    return mongo.db[collection_name]

# Collection names
COLLECTIONS = {
    'BOTS': 'bots',
    'FIELDS': 'fields',
    'SOIL_READINGS': 'soil_readings',
    'DETECTIONS': 'animal_detections',
    'NOTIFICATIONS': 'notifications',
    'USERS': 'users'
}
