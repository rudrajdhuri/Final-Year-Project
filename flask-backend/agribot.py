from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import MongoDB instance
from database import mongo

# Import routes
from routes.weather_news import weather_news_bp
from routes.agriculture_news import agriculture_bp
from routes.bots_routes import bots_bp
from routes.fields_routes import fields_bp
from routes.soil_readings import soil_readings_bp
from routes.system_info import system_info_bp
from routes.animal_detection import animal_detection_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configure MongoDB
    app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/agri_bot")
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "default-secret-key")
    
    # Initialize MongoDB with app
    mongo.init_app(app)
    
    # Make mongo accessible to routes
    app.mongo = mongo

    # Register routes
    app.register_blueprint(soil_readings_bp, url_prefix="/api/soil")
    app.register_blueprint(system_info_bp, url_prefix="/api/system")
    app.register_blueprint(bots_bp, url_prefix="/api")
    app.register_blueprint(fields_bp, url_prefix="/api")
    app.register_blueprint(weather_news_bp, url_prefix="/api")
    app.register_blueprint(agriculture_bp, url_prefix="/api")
    app.register_blueprint(animal_detection_bp, url_prefix="/api/animal")

    @app.route("/")
    def home():
        return {"message": "Flask Backend Running", "database": "MongoDB Connected"}

    @app.route("/api/db-status")
    def db_status():
        try:
            # Test MongoDB connection
            mongo.db.command('ping')
            return {"status": "success", "message": "MongoDB connection successful", "database": "agri_bot"}
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    return app   

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
