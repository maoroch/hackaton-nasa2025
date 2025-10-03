from flask import Flask, jsonify
import json
from flask_cors import CORS
import math

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
    hazardous = [a for a in asteroids_data if a.get("hazardous")]
    return jsonify(hazardous)

@app.route("/api/asteroids/all", methods=["GET"])
def get_all():
    formatted_asteroids = [format_asteroid(a) for a in asteroids_data]
    return jsonify(formatted_asteroids)

# ---------- helper functions ----------

def format_asteroid(a):
    """Форматирование для фронтенда + расчет KE и кратера"""
    diameter = a.get("estimated_diameter_m", 0)
    mass = a.get("mass_kg", diameter**3 * 3000)  # грубая оценка плотности ~3000 kg/m³
    velocity = a.get("velocity_km_s", 20) * 1000  # м/с
    impact_angle = a.get("impact_angle_deg", 45)  # градусы, по умолчанию 45°

    # Кинетическая энергия
    KE = 0.5 * mass * velocity**2  # Джоули

    # Простейшая оценка диаметра кратера (м)
    # Используем эмпирическую формулу: D = k * (KE / (rho * g))**0.25
    k = 1.3
    rho_surface = 2500  # кг/м³ (средняя плотность грунта)
    g = 9.81  # м/с²
    crater_diameter = k * (KE / (rho_surface * g))**0.25

    # Выброс пыли (приблизительно)
    dust_height = 0.1 * crater_diameter
    dust_radius = 1.2 * crater_diameter

    return {
        "name": a.get("name"),
        "date": a.get("date"),
        "is_potentially_hazardous_asteroid": a.get("hazardous"),
        "estimated_diameter": {
            "meters": {
                "estimated_diameter_min": diameter * 0.9,
                "estimated_diameter_max": diameter * 1.1
            }
        },
        "relative_velocity": {
            "kilometers_per_second": str(a.get("velocity_km_s"))
        },
        "miss_distance": {
            "kilometers": str(a.get("miss_distance_km"))
        },
        "kinetic_energy_joules": KE,
        "crater": {
            "diameter_m": crater_diameter,
            "dust_radius_m": dust_radius,
            "dust_height_m": dust_height
        }
    }

if __name__ == "__main__":
    app.run(debug=True)
