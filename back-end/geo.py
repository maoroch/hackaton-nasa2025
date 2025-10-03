# back-end/geo.py
import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/geo")
def get_geo():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        return jsonify({"error": "Missing lat or lon"}), 400

    # Запрос к OpenStreetMap Nominatim
    url = f"https://api.opencagedata.com/geocode/v1/json?q=43.238949+76.889709&key=YOUR_API_KEY"
    response = requests.get(url)
    
    if response.status_code != 200:
        return jsonify({"error": "OSM request failed"}), 500
    
    data = response.json()
    
    # Сохраняем результат в JSON файл
    with open("geolocation_result.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    return jsonify({"message": "Geo data saved", "data": data})

if __name__ == "__main__":
    app.run(debug=True)
