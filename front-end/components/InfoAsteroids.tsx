// components/InfoAsteroids.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAsteroid } from './context/AsteroidContext';
import { Asteroid } from './asteroid'; // Импортируем тип

// УДАЛИТЕ этот дублированный интерфейс - используем из контекста
// export interface Asteroid { ... }


interface ApiResponse {
  count: number;
  asteroids: Asteroid[];
}

// Функция для форматирования больших чисел
const formatMass = (massKg: number | undefined): string => {
  if (massKg === undefined || massKg === null || isNaN(massKg)) {
    return "Неизвестно";
  }
  
  if (massKg >= 1e12) {
    return `${(massKg / 1e12).toFixed(2)} млрд тонн`;
  } else if (massKg >= 1e9) {
    return `${(massKg / 1e9).toFixed(2)} млн тонн`;
  } else if (massKg >= 1e6) {
    return `${(massKg / 1e6).toFixed(2)} тыс. тонн`;
  } else if (massKg >= 1e3) {
    return `${(massKg / 1e3).toFixed(2)} тонн`;
  } else {
    return `${massKg.toFixed(2)} кг`;
  }
};

// УДАЛИТЕ этот интерфейс - больше не нужен
// interface AsteroidsListProps {
//   onAsteroidSelect: (asteroid: Asteroid) => void;
// }

const AsteroidsList: React.FC = () => { // Убрали пропсы
  
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedAsteroid, setSelectedAsteroid } = useAsteroid(); // Используем контекст

  useEffect(() => {
    const fetchAsteroids = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/asteroids/all");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        setAsteroids(data.asteroids);
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

  const handleAsteroidClick = (asteroid: Asteroid) => {
    // ОБНОВЛЯЕМ ГЛОБАЛЬНОЕ СОСТОЯНИЕ через контекст
    setSelectedAsteroid(asteroid);
    
    // Логируем в консоль все данные астероида
    console.log("🎯 Выбран астероид для удара:", {
      name: asteroid.name,
      масса: formatMass(asteroid.mass_kg),
      диаметр: `${asteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} м`,
      скорость: `${parseFloat(asteroid.relative_velocity.kilometers_per_second).toFixed(2)} км/с`,
      кинетическая_энергия: asteroid.kinetic_energy_joules ? `${asteroid.kinetic_energy_joules.toExponential(2)} Дж` : "Неизвестно",
      кратер: asteroid.crater ? {
        диаметр: `${asteroid.crater.diameter_m.toFixed(1)} м`,
        радиус_выброса: `${asteroid.crater.dust_radius_m.toFixed(1)} м`, 
        высота_пыли: `${asteroid.crater.dust_height_m.toFixed(1)} м`
      } : "Неизвестно",
      опасный: asteroid.is_potentially_hazardous_asteroid ? "Да" : "Нет"
    });
  };

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
      {selectedAsteroid && (
        <div className="p-4 bg-cyan-900/20 border-l-4 border-cyan-400">
          <h3 className="font-orbitron text-lg text-cyan-300 mb-2">
            ✅ Выбран: {selectedAsteroid.name}
          </h3>
          <p className="text-sm text-cyan-200">
            Кликните на Землю чтобы запустить этот астероид!
          </p>
        </div>
      )}
      
      {asteroids.length === 0 ? (
        <p className="p-4 font-space-mono">No asteroids found.</p>
      ) : (
        <ul className="divide-y divide-gray-700">
          {asteroids.map((a, idx) => (
            <li
              key={idx}
              className={`p-6 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer ${
                selectedAsteroid?.name === a.name 
                  ? 'bg-cyan-900/30 border-l-4 border-cyan-400' 
                  : a.is_potentially_hazardous_asteroid 
                    ? 'bg-red-900/20 hover:bg-red-900/30' 
                    : ''
              }`}
              onClick={() => handleAsteroidClick(a)}
            >
              <h3 className="font-orbitron text-xl mb-2 text-cyan-400">
                {a.name}
                {selectedAsteroid?.name === a.name && (
                  <span className="ml-2 text-sm text-green-400">✓ Выбран</span>
                )}
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
                  <span className="w-40 text-gray-400">Масса:</span>
                  <span className="font-space-mono text-yellow-300">
                    {formatMass(a.mass_kg)}
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