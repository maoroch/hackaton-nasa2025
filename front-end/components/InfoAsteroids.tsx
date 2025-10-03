"use client";

import React, { useEffect, useState } from "react";

export interface Asteroid {
  name: string;
  date: string;
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
  is_potentially_hazardous_asteroid: boolean;
}

const AsteroidsList: React.FC = () => {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAsteroids = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/asteroids/all");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Asteroid[] = await response.json();
        setAsteroids(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch asteroids:", err);
        setError("Failed to load asteroids data. Is the server running?");
      } finally {
        setLoading(false);
      }
    };

    fetchAsteroids();
  }, []);

  if (loading) return (
    <div className="p-6">
      <p className="text-gray-600 font-space-mono animate-pulse">
        Loading asteroids data...
      </p>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <p className="text-red-500 font-space-mono">{error}</p>
      <p className="text-sm mt-2 font-inter">
        Make sure the Flask server is running:
        <br />
        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
          cd back-end && python app.py
        </code>
      </p>
    </div>
  );

  return (
    <div className="divide-y bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {asteroids.length === 0 ? (
        <p className="p-4 font-space-mono">No asteroids found.</p>
      ) : (
        <ul className="divide-y divide-gray-700">
          {asteroids.map((a, idx) => (
            <li
              key={idx}
              className={`p-6 hover:bg-slate-700/50 transition-all duration-300 ${
                a.is_potentially_hazardous_asteroid 
                  ? 'bg-red-900/20 hover:bg-red-900/30' 
                  : ''
              }`}
            >
              <h3 className="font-orbitron text-xl mb-2 text-cyan-400">
                {a.name}
              </h3>
              <div className="space-y-2 font-inter text-gray-300">
                <p className="flex items-center">
                  <span className="w-40 text-gray-400">Дата сближения:</span>
                  <span className="font-space-mono">{a.date}</span>
                </p>
                <p className="flex items-center">
                  <span className="w-40 text-gray-400">Диаметр:</span>
                  <span className="font-space-mono">
                    {a.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} м
                  </span>
                </p>
                <p className="flex items-center">
                  <span className="w-40 text-gray-400">Скорость:</span>
                  <span className="font-space-mono">
                    {parseFloat(a.relative_velocity.kilometers_per_second).toFixed(2)} км/с
                  </span>
                </p>
                <p className="flex items-center">
                  <span className="w-40 text-gray-400">Расстояние:</span>
                  <span className="font-space-mono">
                    {(parseFloat(a.miss_distance.kilometers)/1000).toFixed(0)} тыс. км
                  </span>
                </p>
                <p className="flex items-center mt-4">
                  <span className="w-40 text-gray-400">Опасность:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    a.is_potentially_hazardous_asteroid 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {a.is_potentially_hazardous_asteroid ? '⚠️ Опасен' : '✅ Безопасен'}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AsteroidsList;