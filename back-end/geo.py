# back-end/geo.py
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS  # чтобы фронтэнд мог делать fetch

app = Flask(__name__)
CORS(app)  # разрешаем запросы с фронтенда (Next.js)

@app.route("/geo", methods=["GET"])
def get_geo():
    # Получаем координаты из запроса
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon:
        return jsonify({"error": "lat и lon обязательны"}), 400

    # Запрос к OpenStreetMap Nominatim
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
        data = response.json()

        # Сохраняем результат на сервере
        with open("geo_result.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # Возвращаем фронтенду
        return jsonify({"message": "Geo данные сохранены", "data": data})

    except requests.RequestException as e:
        return jsonify({"error": f"Ошибка при запросе к Nominatim: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
