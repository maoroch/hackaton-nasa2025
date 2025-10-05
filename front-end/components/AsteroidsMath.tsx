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

interface ApiResponse {
  count: number;
  asteroids: Asteroid[];
}

export default function AsteroidsMath() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/asteroids/all")
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        setAsteroids(data.asteroids);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching asteroids:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4">Loading asteroids...</p>;

  return (
    <div className="p-4 space-y-4">
      {asteroids.map((a) => (
        <div
          key={a.name + a.date}
          className="p-4 border rounded-lg shadow-md bg-gray-800 text-white"
        >
          <h3 className="font-bold text-cyan-300 text-lg mb-2">
            {a.name} ({a.date})
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Potentially hazardous:</strong>{" "}
              {a.is_potentially_hazardous_asteroid ? "Yes" : "No"}
            </p>
            <p>
              <strong>Diameter (m):</strong>{" "}
              {a.estimated_diameter.meters.estimated_diameter_min.toFixed(1)} -{" "}
              {a.estimated_diameter.meters.estimated_diameter_max.toFixed(1)}
            </p>
            <p>
              <strong>Velocity (km/s):</strong>{" "}
              {parseFloat(a.relative_velocity.kilometers_per_second).toFixed(2)}
            </p>
            <p>
              <strong>Kinetic energy (J):</strong>{" "}
              {a.kinetic_energy_joules.toExponential(2)}
            </p>
            <p>
              <strong>Crater (m):</strong> {a.crater.diameter_m.toFixed(1)},
            </p>
            <p>
                            {" "}<strong>ejecta radius:</strong> {a.crater.dust_radius_m.toFixed(1)},
            </p>
            <p>
                            {" "}<strong>dust height:</strong> {a.crater.dust_height_m.toFixed(1)}

            </p>
          </div>
        </div>
      ))}
    </div>
  );
}