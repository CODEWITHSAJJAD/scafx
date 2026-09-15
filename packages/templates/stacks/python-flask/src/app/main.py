import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from app.routes.api import api_bp
from app.routes.health import health_bp

load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return jsonify({
            "message": "Welcome to {{projectName}} API",
            "stack": "{{stack}}",
            "framework": "{{framework}}",
        })

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
