from flask import Flask, jsonify
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # разрешаем запросы с фронта

# Загружаем заранее подготовленные данные (list[dict])
with open("asteroids.json", "r") as f:
    asteroids_data = json.load(f)

@app.route("/")
def home():
    return jsonify({"message": "Asteroid API работает 🚀"})

@app.route("/api/asteroids/hazardous", methods=["GET"])
def get_hazardous():
    # отфильтровать опасные астероиды
    hazardous = [a for a in asteroids_data if a.get("hazardous")]
    return jsonify(hazardous)

@app.route("/api/asteroids/all", methods=["GET"])
def get_all():
    # Convert the data to match the frontend interface
    formatted_asteroids = [{
        "name": a["name"],
        "date": a["date"],
        "is_potentially_hazardous_asteroid": a["hazardous"],
        "estimated_diameter": {
            "meters": {
                "estimated_diameter_min": a["estimated_diameter_m"] * 0.9,
                "estimated_diameter_max": a["estimated_diameter_m"] * 1.1
            }
        },
        "relative_velocity": {
            "kilometers_per_second": str(a["velocity_km_s"])
        },
        "miss_distance": {
            "kilometers": str(a["miss_distance_km"])
        }
    } for a in asteroids_data]
    
    return jsonify(formatted_asteroids)

if __name__ == "__main__":
    app.run(debug=True)
