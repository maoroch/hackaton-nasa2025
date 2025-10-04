from flask import Flask, jsonify, request
import json
from flask_cors import CORS
import math
from shapely.geometry import shape, Point
from datetime import datetime
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Файл для сохранения результатов
GEO_RESULTS_FILE = "geo_result.json"

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

# Функция для загрузки существующих результатов
def load_geo_results():
    if os.path.exists(GEO_RESULTS_FILE):
        try:
            with open(GEO_RESULTS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Убедимся, что возвращаем список, а не словарь
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict):
                    # Если файл содержит словарь, преобразуем в список
                    return [data]
                else:
                    return []
        except (json.JSONDecodeError, Exception) as e:
            print(f"Warning: Could not load {GEO_RESULTS_FILE}: {e}")
            return []
    return []

# Функция для сохранения результатов
def save_geo_result(result_data):
    try:
        # Загружаем существующие результаты
        results = load_geo_results()
        
        # Добавляем timestamp к новому результату
        result_data["timestamp"] = datetime.now().isoformat()
        
        # Добавляем новый результат в начало списка
        results.insert(0, result_data)
        
        # Сохраняем обратно в файл
        with open(GEO_RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Результат сохранен в {GEO_RESULTS_FILE}")
        return True
    except Exception as e:
        print(f"❌ Ошибка при сохранении результата: {e}")
        return False

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
    
    # Формируем данные для сохранения
    result_data = {
        "lat": lat,
        "lon": lon,
        "eco_name": biome_info["eco_name"],
        "biome": biome_info["biome"],
        "realm": biome_info["realm"]
    }
    
    # Сохраняем результат
    save_geo_result(result_data)

    return jsonify(result_data)

@app.route("/api/geo/results", methods=["GET"])
def get_geo_results():
    """Эндпоинт для получения всех сохраненных результатов"""
    try:
        results = load_geo_results()
        return jsonify({
            "count": len(results),
            "results": results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    


@app.route("/api/geo/results/clear", methods=["DELETE"])
def clear_geo_results():
    """Эндпоинт для очистки всех результатов"""
    try:
        with open(GEO_RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)
        return jsonify({"message": "Все результаты очищены"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        

@app.route("/api/asteroids/<name>", methods=["GET"])
def get_asteroid_by_name(name):
    """Эндпоинт для получения конкретного астероида по имени"""
    try:
        # Находим астероид по имени (игнорируем регистр и пробелы)
        asteroid = None
        for a in asteroids_data:
            if a.get("name", "").lower().replace(" ", "") == name.lower().replace(" ", ""):
                asteroid = a
                break
        
        if not asteroid:
            return jsonify({"error": "Asteroid not found"}), 404
        
        formatted_asteroid = format_asteroid(asteroid)
        return jsonify(formatted_asteroid)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
            "mass_kg": mass,  # ДОБАВЛЕНО: масса в килограммах
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