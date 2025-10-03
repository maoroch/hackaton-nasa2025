import requests
import pandas as pd
import math
import json

def fetch_asteroids(start_date="2015-09-07", end_date="2015-09-08", api_key="DEMO_KEY"):
    url = "https://api.nasa.gov/neo/rest/v1/feed"
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "api_key": api_key
    }

    response = requests.get(url, params=params)
    print("Status code:", response.status_code)
    data = response.json()
    neos = data["near_earth_objects"]

    records = []
    for date, objects in neos.items():
        for obj in objects:
            approach = obj["close_approach_data"][0] if obj["close_approach_data"] else {}

            diameter_data = obj.get("estimated_diameter", {}).get("meters", {})
            diameter_avg = (diameter_data.get("estimated_diameter_min", 0) + diameter_data.get("estimated_diameter_max", 0)) / 2
            diameter_avg = diameter_avg if diameter_avg > 0 else 100

            records.append({
                "name": obj["name"],
                "date": date,
                "hazardous": obj["is_potentially_hazardous_asteroid"],
                "velocity_km_s": float(approach.get("relative_velocity", {}).get("kilometers_per_second", 0)),
                "miss_distance_km": float(approach.get("miss_distance", {}).get("kilometers", 0)),
                "estimated_diameter_m": diameter_avg
            })

    df = pd.DataFrame(records)

    def estimate_mass(diameter_m, density=3000):
        volume = (4/3) * math.pi * (diameter_m / 2)**3
        return volume * density

    def impact_energy(mass_kg, velocity_km_s):
        v = velocity_km_s * 1000
        E = 0.5 * mass_kg * v**2
        return E

    def crater_diameter(E):
        return 1.8 * (E / 4.184e15) ** 0.294

    df["mass_kg"] = df["estimated_diameter_m"].apply(estimate_mass)
    df["energy_j"] = df.apply(lambda row: impact_energy(row["mass_kg"], row["velocity_km_s"]), axis=1)
    df["energy_megatons_TNT"] = df["energy_j"] / 4.184e15
    df["crater_km"] = df["energy_j"].apply(crater_diameter)

    result = df.to_dict(orient="records")

    with open("asteroids.json", "w") as f:
        json.dump(result, f, indent=2)

    return result
