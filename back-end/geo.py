# geo.py
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from shapely.geometry import shape, Point

app = Flask(__name__)
CORS(app)

# Загружаем GeoJSON с биомами
with open("biomes.geojson", "r", encoding="utf-8") as f:
    biome_data = json.load(f)

biomes = []
for feature in biome_data["features"]:
    geom = shape(feature["geometry"])
    eco_name = feature["properties"].get("ECO_NAME", "Unknown")
    biome_code = feature["properties"].get("BIOME", "Unknown")
    realm = feature["properties"].get("REALM", "Unknown")
    biomes.append((geom, eco_name, biome_code, realm))


def find_biome(lat: float, lon: float):
    """Поиск экорегиона по координатам."""
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


@app.route("/geo", methods=["GET"])
def get_geo():
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


if __name__ == "__main__":
    app.run(debug=True)
