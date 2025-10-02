from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Dummy Lighting Data
lights = [
    {"id": 1, "location": "Street A", "status": "ON"},
    {"id": 2, "location": "Street B", "status": "OFF"},
    {"id": 3, "location": "Street C", "status": "ON"},
]

@app.route("/api/lighting/status", methods=["GET"])
def get_status():
    return jsonify(lights)

@app.route("/api/lighting/toggle", methods=["POST"])
def toggle_light():
    data = request.json
    for light in lights:
        if light["id"] == data["lightId"]:
            light["status"] = "ON" if data["state"] else "OFF"
    return jsonify({"message": "Updated", "lights": lights})

@app.route("/api/lighting/energy", methods=["GET"])
def get_energy():
    energy_data = [
        {"time": "10 AM", "usage": 120},
        {"time": "11 AM", "usage": 150},
        {"time": "12 PM", "usage": 90},
        {"time": "1 PM", "usage": 200},
    ]
    return jsonify(energy_data)

if __name__ == "__main__":
    app.run(port=5001, debug=True)
