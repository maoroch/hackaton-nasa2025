from flask import Flask, jsonify, request
import json
from flask_cors import CORS
import math
from shapely.geometry import shape, Point
from datetime import datetime
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Файлы для хранения данных
GEO_RESULTS_FILE = "geo_result.json"
CUSTOM_ASTEROIDS_FILE = "custom_asteroids.json"


# Добавьте в начало файла, после импортов
BIOME_RISKS = {
    "Tropical & Subtropical Moist Broadleaf Forests": {
        "risk_level": "high",
        "description": "Удар усугубит потерю биоразнообразия, засуху и сдвиги в растительности из-за повышения температуры и изменения осадков. Глобальное охлаждение от пыли может вызвать массовую гибель растений.",
        "impact_factors": ["biodiversity loss", "drought", "ecosystem collapse"]
    },
    "Tundra": {
        "risk_level": "high",
        "description": "Таяние permafrost от пожаров и потепления, высвобождение метана (усиление парникового эффекта). Удар вызовет локальное разрушение и глобальное охлаждение.",
        "impact_factors": ["permafrost melt", "methane release", "cooling from dust"]
    },
    "Temperate Forests": {
        "risk_level": "medium",
        "description": "Увеличение вредителей и болезней, изменения в осадках. Астероидный удар добавит пожары и эрозию почвы.",
        "impact_factors": ["pests and diseases", "fires", "soil erosion"]
    },
    "Mangroves": {
        "risk_level": "high",
        "description": "Угроза от повышения уровня моря и потепления. Удар может вызвать цунами и разрушение береговой защиты.",
        "impact_factors": ["sea level rise", "coastal erosion", "tsunamis"]
    },
    # Добавьте другие биомы по необходимости, на основе biomes.geojson (BIOME поле)
    "Unknown": {
        "risk_level": "unknown",
        "description": "Нет данных о рисках для неизвестного биома.",
        "impact_factors": []
    }
}

def find_biome(lat: float, lon: float):
    if not biomes:
        return {
            "eco_name": "No biome data available",
            "biome": "Unknown",
            "realm": "Unknown",
            "risk_level": "unknown",
            "risk_description": "Нет данных о биоме.",
            "risk_factors": []
        }
    point = Point(lon, lat)
    for geom, eco_name, biome_code, realm in biomes:
        if geom.contains(point):
            # Ищем риск по biome_code или eco_name
            biome_key = biome_code or eco_name or "Unknown"
            risks = BIOME_RISKS.get(biome_key, BIOME_RISKS["Unknown"])
            return {
                "eco_name": eco_name,
                "biome": biome_code,
                "realm": realm,
                "risk_level": risks["risk_level"],
                "risk_description": risks["description"],
                "risk_factors": risks["impact_factors"]
            }
    return BIOME_RISKS["Unknown"]


# Загружаем данные астероидов NASA
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

# Функции для работы с файлами
def load_geo_results():
    if os.path.exists(GEO_RESULTS_FILE):
        try:
            with open(GEO_RESULTS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict):
                    return [data]
                else:
                    return []
        except (json.JSONDecodeError, Exception) as e:
            print(f"Warning: Could not load {GEO_RESULTS_FILE}: {e}")
            return []
    return []

def save_geo_result(result_data):
    try:
        results = load_geo_results()
        result_data["timestamp"] = datetime.now().isoformat()
        results.insert(0, result_data)
        with open(GEO_RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"✅ Результат сохранен в {GEO_RESULTS_FILE}")
        return True
    except Exception as e:
        print(f"❌ Ошибка при сохранении результата: {e}")
        return False

def load_custom_asteroids():
    if os.path.exists(CUSTOM_ASTEROIDS_FILE):
        try:
            with open(CUSTOM_ASTEROIDS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, Exception) as e:
            print(f"Warning: Could not load {CUSTOM_ASTEROIDS_FILE}: {e}")
            return []
    return []

def save_custom_asteroids(asteroids):
    try:
        with open(CUSTOM_ASTEROIDS_FILE, "w", encoding="utf-8") as f:
            json.dump(asteroids, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"❌ Ошибка при сохранении кастомных астероидов: {e}")
        return False

# Эндпоинты
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

@app.route("/api/asteroids/<name>", methods=["GET"])
def get_asteroid_by_name(name):
    try:
        asteroid = next(
            (
                a for a in asteroids_data
                if a.get("name", "").lower().replace(" ", "") == name.lower().replace(" ", "")
            ),
            None
        )
        if not asteroid:
            return jsonify({"error": "Asteroid not found"}), 404
        formatted_asteroid = format_asteroid(asteroid)
        return jsonify(formatted_asteroid)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/asteroids/custom", methods=["POST"])
def create_custom_asteroid():
    try:
        data = request.get_json()
        required_fields = ["name", "diameter", "density", "velocity", "angle"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        diameter = data["diameter"]
        density = data["density"]
        velocity = data["velocity"]
        angle = data["angle"]
        
        radius = diameter / 2
        volume = (4 / 3) * math.pi * (radius ** 3)
        mass_kg = volume * density
        velocity_ms = velocity * 1000
        kinetic_energy_joules = 0.5 * mass_kg * (velocity_ms ** 2)
        angle_factor = math.sin(angle * math.pi / 180)
        crater_diameter = diameter * 20 * angle_factor
        ejecta_radius = crater_diameter * 1.2
        dust_height = crater_diameter * 0.1
        is_hazardous = kinetic_energy_joules > 1e12
        
        # ИСПРАВЛЕННЫЙ ID - убираем точку
        asteroid_id = f"custom-{int(datetime.now().timestamp() * 1000)}"
        
        custom_asteroid = {
            "id": asteroid_id,  # Используем новый ID
            "name": data["name"],
            "diameter": diameter,
            "density": density,
            "velocity": velocity,
            "angle": angle,
            "mass_kg": mass_kg,
            "kinetic_energy_joules": kinetic_energy_joules,
            "crater_diameter": crater_diameter,
            "ejecta_radius": ejecta_radius,
            "dust_height": dust_height,
            "is_potentially_hazardous_asteroid": is_hazardous,
            "created_at": datetime.now().isoformat(),
            "is_custom": True
        }
        
        existing_asteroids = load_custom_asteroids()
        existing_asteroids.append(custom_asteroid)
        
        if save_custom_asteroids(existing_asteroids):
            print(f"✅ Кастомный астероид создан: {custom_asteroid['name']} (ID: {asteroid_id})")
            return jsonify({
                "message": "Custom asteroid created successfully",
                "asteroid": custom_asteroid
            }), 201
        else:
            return jsonify({"error": "Failed to save asteroid"}), 500
    except Exception as e:
        print(f"❌ Ошибка при создании астероида: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route("/api/asteroids/custom", methods=["GET"])
def get_custom_asteroids():
    try:
        custom_asteroids = load_custom_asteroids()
        return jsonify({
            "count": len(custom_asteroids),
            "asteroids": custom_asteroids
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/asteroids/custom/<asteroid_id>", methods=["GET"])
def get_custom_asteroid(asteroid_id):
    try:
        custom_asteroids = load_custom_asteroids()
        asteroid = next((a for a in custom_asteroids if a["id"] == asteroid_id), None)
        if asteroid:
            return jsonify(asteroid)
        else:
            return jsonify({"error": "Asteroid not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/asteroids/custom/<asteroid_id>", methods=["DELETE"])
def delete_custom_asteroid(asteroid_id):
    try:
        custom_asteroids = load_custom_asteroids()
        initial_count = len(custom_asteroids)
        custom_asteroids = [a for a in custom_asteroids if a["id"] != asteroid_id]
        if len(custom_asteroids) < initial_count:
            if save_custom_asteroids(custom_asteroids):
                return jsonify({"message": "Asteroid deleted successfully"})
            else:
                return jsonify({"error": "Failed to save changes"}), 500
        else:
            return jsonify({"error": "Asteroid not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/asteroids/all-with-custom", methods=["GET"])
def get_all_asteroids_with_custom():
    try:
        nasa_asteroids = [format_asteroid(a) for a in asteroids_data]
        custom_asteroids = load_custom_asteroids()
        formatted_custom_asteroids = []
        for custom in custom_asteroids:
            formatted_custom = {
                "id": custom["id"],
                "name": custom["name"],
                "date": datetime.fromisoformat(custom["created_at"]).strftime("%Y-%m-%d"),
                "is_potentially_hazardous_asteroid": custom["is_potentially_hazardous_asteroid"],
                "estimated_diameter": {
                    "meters": {
                        "estimated_diameter_min": custom["diameter"],
                        "estimated_diameter_max": custom["diameter"]
                    }
                },
                "relative_velocity": {
                    "kilometers_per_second": str(custom["velocity"])
                },
                "miss_distance": {
                    "kilometers": "0"
                },
                "mass_kg": custom["mass_kg"],
                "kinetic_energy_joules": custom["kinetic_energy_joules"],
                "crater": {
                    "diameter_m": custom["crater_diameter"],
                    "dust_radius_m": custom["ejecta_radius"],
                    "dust_height_m": custom["dust_height"]
                },
                "is_custom": True,
                "custom_data": custom
            }
            formatted_custom_asteroids.append(formatted_custom)
        
        all_asteroids = nasa_asteroids + formatted_custom_asteroids
        return jsonify({
            "count": len(all_asteroids),
            "nasa_count": len(nasa_asteroids),
            "custom_count": len(custom_asteroids),
            "asteroids": all_asteroids
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/geo", methods=["GET"])
def get_geo():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    if lat is None or lon is None:
        return jsonify({"error": "lat и lon обязательны"}), 400
    biome_info = find_biome(lat, lon)
    result_data = {
        "lat": lat,
        "lon": lon,
        "eco_name": biome_info["eco_name"],
        "biome": biome_info["biome"],
        "realm": biome_info["realm"],
        "risk_level": biome_info["risk_level"],  # Новые поля
        "risk_description": biome_info["risk_description"],
        "risk_factors": biome_info["risk_factors"]
    }
    save_geo_result(result_data)
    return jsonify(result_data)

@app.route("/api/geo/results", methods=["GET"])
def get_geo_results():
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
    try:
        with open(GEO_RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)
        return jsonify({"message": "Все результаты очищены"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Вспомогательные функции
def format_asteroid(a):
    try:
        diameter = a.get("estimated_diameter_m", 0)
        mass = a.get("mass_kg", diameter**3 * 3000)
        velocity = a.get("velocity_km_s", 20) * 1000
        impact_angle = a.get("impact_angle_deg", 45)
        KE = 0.5 * mass * velocity**2
        k = 1.3
        rho_surface = 2500
        g = 9.81
        crater_diameter = k * (KE / (rho_surface * g))**0.25
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
            "mass_kg": mass,
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