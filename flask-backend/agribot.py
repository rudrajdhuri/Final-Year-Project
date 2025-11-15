from flask import Flask
from flask_cors import CORS

# import routes
from routes.weather_news import weather_news_bp
from routes.agriculture_news import agriculture_bp
from routes.bots_routes import bots_bp
from routes.fields_routes import fields_bp
from routes.soil_readings import soil_readings_bp
from routes.system_info import system_info_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register routes
    app.register_blueprint(soil_readings_bp, url_prefix="/api/soil")
    app.register_blueprint(system_info_bp, url_prefix="/api/system")
    app.register_blueprint(bots_bp, url_prefix="/api")
    app.register_blueprint(fields_bp, url_prefix="/api")
    app.register_blueprint(weather_news_bp, url_prefix="/api")
    app.register_blueprint(agriculture_bp, url_prefix="/api")

    @app.route("/")
    def home():
        return {"message": "Flask Backend Running"}

    return app   

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
