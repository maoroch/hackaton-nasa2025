from flask import Flask, jsonify, request
import json
from flask_cors import CORS
import math
from shapely.geometry import shape, Point

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])  # Явно указываем фронтенд

# Загружаем заранее подготовленные данные астероидов
try:
    with open("asteroids.json", "r") as f:
        asteroids_data = json.load(f)
except FileNotFoundError:
    print("Warning: asteroids.json not found, using sample data")
    asteroids_data = [
        {
            "name": "Sample Asteroid",
            "date": "2024-01-01",
            "hazardous": False,
            "estimated_diameter_m": 100,
            "velocity_km_s": 15,
            "miss_distance_km": 5000000
        }
    ]

# Загружаем GeoJSON с биомами
try:
    with open("biomes.geojson", "r", encoding="utf-8") as f:
        biome_data = json.load(f)
    
    # Подготавливаем данные биомов
    biomes = []
    for feature in biome_data["features"]:
        geom = shape(feature["geometry"])
        eco_name = feature["properties"].get("ECO_NAME", "Unknown")
        biome_code = feature["properties"].get("BIOME", "Unknown")
        realm = feature["properties"].get("REALM", "Unknown")
        biomes.append((geom, eco_name, biome_code, realm))
except FileNotFoundError:
    print("Warning: biomes.geojson not found")
    biomes = []

@app.route("/")
def home():
    return jsonify({"message": "Asteroid API работает 🚀", "status": "ok"})

@app.route("/api/asteroids/hazardous", methods=["GET"])
def get_hazardous():
    hazardous = [a for a in asteroids_data if a.get("hazardous")]
    return jsonify({
        "count": len(hazardous),
        "asteroids": hazardous
    })

@app.route("/api/asteroids/all", methods=["GET"])
def get_all():
    try:
        formatted_asteroids = [format_asteroid(a) for a in asteroids_data]
        return jsonify({
            "count": len(formatted_asteroids),
            "asteroids": formatted_asteroids
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/geo", methods=["GET"])
def get_geo():
    """Эндпоинт для получения информации о биоме по координатам"""
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    if lat is None or lon is None:
        return jsonify({"error": "lat и lon обязательны"}), 400

    biome_info = find_biome(lat, lon)

    return jsonify({
        "lat": lat,
        "lon": lon,
        "eco_name": biome_info["eco_name"],
        "biome": biome_info["biome"],
        "realm": biome_info["realm"]
    })

# ---------- helper functions ----------

def format_asteroid(a):
    """Форматирование для фронтенда + расчет KE и кратера"""
    try:
        diameter = a.get("estimated_diameter_m", 0)
        mass = a.get("mass_kg", diameter**3 * 3000)  # грубая оценка плотности ~3000 kg/m³
        velocity = a.get("velocity_km_s", 20) * 1000  # м/с
        impact_angle = a.get("impact_angle_deg", 45)  # градусы, по умолчанию 45°

        # Кинетическая энергия
        KE = 0.5 * mass * velocity**2  # Джоули

        # Простейшая оценка диаметра кратера (м)
        k = 1.3
        rho_surface = 2500  # кг/м³ (средняя плотность грунта)
        g = 9.81  # м/с²
        crater_diameter = k * (KE / (rho_surface * g))**0.25

        # Выброс пыли (приблизительно)
        dust_height = 0.1 * crater_diameter
        dust_radius = 1.2 * crater_diameter

        return {
            "name": a.get("name", "Unknown"),
            "date": a.get("date", "Unknown"),
            "is_potentially_hazardous_asteroid": a.get("hazardous", False),
            "estimated_diameter": {
                "meters": {
                    "estimated_diameter_min": diameter * 0.9,
                    "estimated_diameter_max": diameter * 1.1
                }
            },
            "relative_velocity": {
                "kilometers_per_second": str(a.get("velocity_km_s", 0))
            },
            "miss_distance": {
                "kilometers": str(a.get("miss_distance_km", 0))
            },
            "kinetic_energy_joules": KE,
            "crater": {
                "diameter_m": crater_diameter,
                "dust_radius_m": dust_radius,
                "dust_height_m": dust_height
            }
        }
    except Exception as e:
        print(f"Error formatting asteroid {a.get('name')}: {e}")
        return {
            "name": a.get("name", "Unknown"),
            "error": "Failed to format asteroid data"
        }

def find_biome(lat: float, lon: float):
    """Поиск экорегиона по координатам."""
    if not biomes:
        return {
            "eco_name": "No biome data available",
            "biome": "Unknown",
            "realm": "Unknown"
        }
    
    point = Point(lon, lat)
    for geom, eco_name, biome_code, realm in biomes:
        if geom.contains(point):
            return {
                "eco_name": eco_name,
                "biome": biome_code,
                "realm": realm
            }
    return {
        "eco_name": "Unknown",
        "biome": "Unknown",
        "realm": "Unknown"
    }

if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=5000)