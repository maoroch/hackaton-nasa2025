from flask import Flask, jsonify, request
import requests
import math

app = Flask(__name__)

def estimate_mass(diameter_m, density=3000):
    volume = (4/3) * math.pi * (diameter_m / 2)**3
    return volume * density

def impact_energy(mass_kg, velocity_km_s):
    v = velocity_km_s * 1000
    E = 0.5 * mass_kg * v**2
    return E

def crater_diameter(E):
    return 1.8 * (E / 4.184e15) ** 0.294

@app.route("/asteroids", methods=["GET"])
def get_asteroids():
    start_date = request.args.get("start_date", "2015-09-07")
    end_date = request.args.get("end_date", "2015-09-08")
    api_key = request.args.get("api_key", "DEMO_KEY")

    url = "https://api.nasa.gov/neo/rest/v1/feed"
    params = {"start_date": start_date, "end_date": end_date, "api_key": api_key}

    response = requests.get(url, params=params)
    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch data"}), 500

    data = response.json()
    neos = data.get("near_earth_objects", {})

    records = []
    for date, objects in neos.items():
        for obj in objects:
            approach = obj["close_approach_data"][0] if obj["close_approach_data"] else {}
            diameter_data = obj.get("estimated_diameter", {}).get("meters", {})
            diameter_avg = (diameter_data.get("estimated_diameter_min", 0) + diameter_data.get("estimated_diameter_max", 0)) / 2
            diameter_avg = diameter_avg if diameter_avg > 0 else 100

            velocity = float(approach.get("relative_velocity", {}).get("kilometers_per_second", 0))
            mass = estimate_mass(diameter_avg)
            energy = impact_energy(mass, velocity)
            crater = crater_diameter(energy)

            records.append({
                "name": obj["name"],
                "date": date,
                "hazardous": obj["is_potentially_hazardous_asteroid"],
                "velocity_km_s": velocity,
                "miss_distance_km": float(approach.get("miss_distance", {}).get("kilometers", 0)),
                "estimated_diameter_m": diameter_avg,
                "mass_kg": mass,
                "energy_megatons_TNT": energy / 4.184e15,
                "crater_km": crater
            })

    return jsonify(records)

if __name__ == "__main__":
    app.run(debug=True)
