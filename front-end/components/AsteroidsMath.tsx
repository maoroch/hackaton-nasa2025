// components/AsteroidsMath.tsx
'use client';

import { useEffect, useState } from "react";

type CraterData = {
  diameter_m: number;
  dust_radius_m: number;
  dust_height_m: number;
};

type Asteroid = {
  name: string;
  date: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: {
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  relative_velocity: {
    kilometers_per_second: string;
  };
  miss_distance: {
    kilometers: string;
  };
  kinetic_energy_joules: number;
  crater: CraterData;
};

export default function AsteroidsMath() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/asteroids/all")
      .then((res) => res.json())
      .then((data: Asteroid[]) => {
        setAsteroids(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching asteroids:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4">Загрузка астероидов...</p>;

  return (
    <div className="p-4 space-y-4">
      {asteroids.map((a) => (
        <div
          key={a.name + a.date}
          className="p-3 border rounded shadow-sm bg-gray-800 text-white"
        >
          <h3 className="font-semibold text-cyan-300">
            {a.name} ({a.date})
          </h3>
          <p>
            <strong>Потенциально опасный:</strong>{" "}
            {a.is_potentially_hazardous_asteroid ? "Да" : "Нет"}
          </p>
          <p>
            <strong>Диаметр (м):</strong>{" "}
            {a.estimated_diameter.meters.estimated_diameter_min.toFixed(1)} -{" "}
            {a.estimated_diameter.meters.estimated_diameter_max.toFixed(1)}
          </p>
          <p>
            <strong>Скорость (км/с):</strong>{" "}
            {a.relative_velocity.kilometers_per_second}
          </p>
          <p>
            <strong>Кинетическая энергия (Дж):</strong>{" "}
            {a.kinetic_energy_joules.toExponential(2)}
          </p>
          <p>
            <strong>Кратер (м):</strong> {a.crater.diameter_m.toFixed(1)},{" "}
            радиус выброса: {a.crater.dust_radius_m.toFixed(1)}, высота пыли:{" "}
            {a.crater.dust_height_m.toFixed(1)}
          </p>
        </div>
      ))}
    </div>
  );
}
