# from flask import Flask
# from flask_cors import CORS
# import os
# from dotenv import load_dotenv
# from database import mongo

# load_dotenv()

# def create_app():
#     app = Flask(__name__)
#     CORS(app)

#     app.config["MONGO_URI"] = os.environ.get(
#         "MONGO_URI",
#         "mongodb://localhost:27017/agri_bot"
#     )
#     app.config["SECRET_KEY"] = os.environ.get(
#         "SECRET_KEY",
#         "default-secret-key"
#     )

#     mongo.init_app(app)

#     from routes.weather_news import weather_news_bp
#     from routes.agriculture_news import agriculture_bp
#     from routes.bots_routes import bots_bp
#     from routes.fields_routes import fields_bp
#     from routes.soil_readings import soil_readings_bp
#     from routes.system_info import system_info_bp
#     from routes.animal_detection import animal_detection_bp
#     from routes.plant_detection import plant_detection_bp
#     from routes.auto_detection import auto_detection_bp
#     from routes.auth_routes import auth_bp
#     from routes.ai_assistant import ai_assistant_bp

#     app.register_blueprint(soil_readings_bp,    url_prefix="/api/soil")
#     app.register_blueprint(system_info_bp,      url_prefix="/api/system")
#     app.register_blueprint(bots_bp,             url_prefix="/api")
#     app.register_blueprint(fields_bp,           url_prefix="/api")
#     app.register_blueprint(weather_news_bp,     url_prefix="/api")
#     app.register_blueprint(agriculture_bp,      url_prefix="/api")
#     app.register_blueprint(animal_detection_bp, url_prefix="/api/animal")
#     app.register_blueprint(plant_detection_bp,  url_prefix="/api/plant")
#     app.register_blueprint(auto_detection_bp,   url_prefix="/api/auto")
#     app.register_blueprint(auth_bp,             url_prefix="/api/auth")
#     app.register_blueprint(ai_assistant_bp, url_prefix="/api/ai")

#     @app.route("/")
#     def home():
#         return {"status": "Backend running", "database": "MongoDB connected"}

#     @app.route("/api/db-status")
#     def db_status():
#         mongo.db.command("ping")
#         return {"status": "MongoDB OK"}

#     return app

# if __name__ == "__main__":
#     app = create_app()
#     app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)


from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from database import mongo

load_dotenv()

import torch
torch.set_num_threads(2)  # limit CPU threads on Pi — keeps Pi stable during inference

def create_app():
    app = Flask(__name__)
    CORS(app, origins="*")

    app.config["MONGO_URI"] = os.environ.get(
        "MONGO_URI",
        "mongodb://localhost:27017/agri_bot"
    )
    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY",
        "default-secret-key"
    )
    app.config["PROXY_SHARED_SECRET"] = os.environ.get(
        "PROXY_SHARED_SECRET",
        ""
    )

    mongo.init_app(app)

    @app.before_request
    def protect_public_tunnel():
        host = (request.host or "").split(":")[0].lower()
        shared_secret = app.config.get("PROXY_SHARED_SECRET", "")
        incoming_secret = request.headers.get("x-agribot-proxy-secret", "")

        local_hosts = {"127.0.0.1", "localhost", "10.42.0.1"}
        is_hotspot_client = host.startswith("10.42.0.")

        if host in local_hosts or is_hotspot_client:
            return None

        if shared_secret and incoming_secret == shared_secret:
            return None

        return jsonify({
            "success": False,
            "error": "Direct public access is disabled. Use the AgriBot frontend."
        }), 403

    from routes.weather_news import weather_news_bp
    from routes.agriculture_news import agriculture_bp
    from routes.bots_routes import bots_bp
    from routes.fields_routes import fields_bp
    from routes.soil_readings import soil_readings_bp
    from routes.system_info import system_info_bp
    from routes.animal_detection import animal_detection_bp
    from routes.plant_detection import plant_detection_bp
    from routes.auto_detection import auto_detection_bp
    from routes.auth_routes import auth_bp
    from routes.ai_assistant import ai_assistant_bp

    app.register_blueprint(soil_readings_bp,    url_prefix="/api/soil")
    app.register_blueprint(system_info_bp,      url_prefix="/api/system")
    app.register_blueprint(bots_bp,             url_prefix="/api")
    app.register_blueprint(fields_bp,           url_prefix="/api")
    app.register_blueprint(weather_news_bp,     url_prefix="/api")
    app.register_blueprint(agriculture_bp,      url_prefix="/api")
    app.register_blueprint(animal_detection_bp, url_prefix="/api/animal")
    app.register_blueprint(plant_detection_bp,  url_prefix="/api/plant")
    app.register_blueprint(auto_detection_bp,   url_prefix="/api/auto")
    app.register_blueprint(auth_bp,             url_prefix="/api/auth")
    app.register_blueprint(ai_assistant_bp,     url_prefix="/api/ai")

    @app.route("/")
    def home():
        return {"status": "Backend running", "database": "MongoDB connected"}

    @app.route("/api/db-status")
    def db_status():
        mongo.db.command("ping")
        return {"status": "MongoDB OK"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
