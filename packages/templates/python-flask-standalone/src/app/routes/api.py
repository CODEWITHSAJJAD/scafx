from flask import Blueprint, jsonify

api_bp = Blueprint("api", __name__)


@api_bp.route("/", methods=["GET"])
@api_bp.route("", methods=["GET"])
def api_root():
    return jsonify({
        "message": "Welcome to {{projectName}} API",
        "stack": "{{stack}}",
        "framework": "{{framework}}",
    })
