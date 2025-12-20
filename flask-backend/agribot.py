# # from flask import Flask
# # from flask_cors import CORS
# # import os
# # from dotenv import load_dotenv

# # # Load environment variables
# # load_dotenv()

# # # Import MongoDB instance
# # from database import mongo

# # # We'll import route blueprints inside create_app() to avoid importing
# # # heavy optional dependencies (like TensorFlow) at module import time.

# # def create_app():
# #     app = Flask(__name__)
# #     CORS(app)

# #     # Configure MongoDB
# #     app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/agri_bot")
# #     app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "default-secret-key")
    
# #     # Initialize MongoDB with app
# #     mongo.init_app(app)

# #     # Make mongo accessible to routes through app attribute
# #     app.mongo = mongo

# #     # Import and register route blueprints here to avoid import-time crashes
# #     from routes.soil_readings import soil_readings_bp
# #     from routes.system_info import system_info_bp
# #     from routes.bots_routes import bots_bp
# #     from routes.fields_routes import fields_bp
# #     from routes.weather_news import weather_news_bp
# #     from routes.agriculture_news import agriculture_bp

# #     app.register_blueprint(soil_readings_bp, url_prefix="/api/soil")
# #     app.register_blueprint(system_info_bp, url_prefix="/api/system")
# #     app.register_blueprint(bots_bp, url_prefix="/api")
# #     app.register_blueprint(fields_bp, url_prefix="/api")
# #     app.register_blueprint(weather_news_bp, url_prefix="/api")
# #     app.register_blueprint(agriculture_bp, url_prefix="/api")

# #     # animal detection may require tflite/tensorflow; import safely
# #     try:
# #         from routes.animal_detection import animal_detection_bp
# #         app.register_blueprint(animal_detection_bp, url_prefix="/api/animal")
# #     except Exception as e:
# #         # don't block app startup; provide a lightweight endpoint later
# #         print(f"Warning: animal detection routes not loaded: {e}")

# #     @app.route("/")
# #     def home():
# #         return {"message": "Flask Backend Running", "database": "MongoDB Connected"}

# #     @app.route("/api/db-status")
# #     def db_status():
# #         try:
# #             # Test MongoDB connection
# #             mongo.db.command('ping')
# #             return {"status": "success", "message": "MongoDB connection successful", "database": "agri_bot"}
# #         except Exception as e:
# #             return {"status": "error", "message": str(e)}, 500

# #     return app   

# # if __name__ == "__main__":
# #     app = create_app()
# #     app.run(debug=True)

# from flask import Flask
# from flask_cors import CORS
# import os
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# # Import MongoDB instance
# from database import mongo

# # Import routes
# from routes.weather_news import weather_news_bp
# from routes.agriculture_news import agriculture_bp
# from routes.bots_routes import bots_bp
# from routes.fields_routes import fields_bp
# from routes.soil_readings import soil_readings_bp
# from routes.system_info import system_info_bp
# from routes.animal_detection import animal_detection_bp


# def create_app():
#     app = Flask(__name__)
#     CORS(app)

#     # Configure MongoDB
#     app.config["MONGO_URI"] = os.environ.get(
#         "MONGO_URI",
#         "mongodb://localhost:27017/agri_bot"
#     )
#     app.config["SECRET_KEY"] = os.environ.get(
#         "SECRET_KEY",
#         "default-secret-key"
#     )

#     # Initialize MongoDB with Flask app
#     mongo.init_app(app)

#     # Register routes
#     app.register_blueprint(soil_readings_bp, url_prefix="/api/soil")
#     app.register_blueprint(system_info_bp, url_prefix="/api/system")
#     app.register_blueprint(bots_bp, url_prefix="/api")
#     app.register_blueprint(fields_bp, url_prefix="/api")
#     app.register_blueprint(weather_news_bp, url_prefix="/api")
#     app.register_blueprint(agriculture_bp, url_prefix="/api")
#     app.register_blueprint(animal_detection_bp, url_prefix="/api/animal")

#     @app.route("/")
#     def home():
#         return {
#             "message": "Flask Backend Running",
#             "database": "MongoDB Connected"
#         }

#     @app.route("/api/db-status")
#     def db_status():
#         try:
#             mongo.db.command("ping")
#             return {
#                 "status": "success",
#                 "message": "MongoDB connection successful",
#                 "database": "agri_bot"
#             }
#         except Exception as e:
#             return {
#                 "status": "error",
#                 "message": str(e)
#             }, 500

#     return app


# if __name__ == "__main__":
#     app = create_app()
#     app.run(debug=True)


from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
# Load environment variables
load_dotenv()
from database import mongo




def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configure MongoDB
    app.config["MONGO_URI"] = os.environ.get(
        "MONGO_URI",
        "mongodb://localhost:27017/agri_bot"
    )
    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY",
        "default-secret-key"
    )
    print("🔥 MONGO_URI =", app.config["MONGO_URI"])

    # ✅ Initialize MongoDB FIRST
    mongo.init_app(app)

    # ✅ IMPORT ROUTES ONLY AFTER mongo.init_app
    from routes.weather_news import weather_news_bp
    from routes.agriculture_news import agriculture_bp
    from routes.bots_routes import bots_bp
    from routes.fields_routes import fields_bp
    from routes.soil_readings import soil_readings_bp
    from routes.system_info import system_info_bp
    from routes.animal_detection import animal_detection_bp

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
        return {
            "message": "Flask Backend Running",
            "database": "MongoDB Connected"
        }

    @app.route("/api/db-status")
    def db_status():
        mongo.db.command("ping")
        return {
            "status": "success",
            "message": "MongoDB connection successful"
        }

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
