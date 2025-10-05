// components/InfoAsteroids.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAsteroid } from './context/AsteroidContext';
import { Asteroid } from './types/typesAsteroid'; // Импортируем тип

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

// Утилита для расчета визуального размера астероида
const getAsteroidDisplaySize = (diameterMeters: number): number => {
  // Логарифмическое масштабирование для лучшего визуального отображения
  // Реальные диаметры: от 1м до 1000м (1км)
  // Визуальные размеры: от 8px до 120px
  
  const minRealSize = 1; // 1 метр
  const maxRealSize = 1000; // 1 километр
  const minDisplaySize = 8; // пикселей
  const maxDisplaySize = 120; // пикселей
  
  // Логарифмическое масштабирование
  const logMin = Math.log(minRealSize);
  const logMax = Math.log(maxRealSize);
  const logValue = Math.log(Math.max(diameterMeters, minRealSize));
  
  const normalized = (logValue - logMin) / (logMax - logMin);
  return minDisplaySize + normalized * (maxDisplaySize - minDisplaySize);
};

// Утилита для расчета цвета астероида
const getAsteroidColor = (diameter: number, isHazardous: boolean): string => {
  // Цвет зависит от размера и опасности
  const sizeFactor = Math.min(diameter / 500, 1);
  
  if (isHazardous) {
    // Опасные - красные оттенки
    const red = 200 + Math.floor(sizeFactor * 55);
    const green = 100 - Math.floor(sizeFactor * 80);
    const blue = 100 - Math.floor(sizeFactor * 80);
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    // Безопасные - синие/зеленые оттенки
    const red = 100 + Math.floor(sizeFactor * 50);
    const green = 150 + Math.floor(sizeFactor * 50);
    const blue = 200 - Math.floor(sizeFactor * 50);
    return `rgb(${red}, ${green}, ${blue})`;
  }
};

// Компонент для визуализации астероида
const AsteroidVisual = ({ asteroid, isSelected }: { asteroid: Asteroid, isSelected: boolean }) => {
  const displaySize = getAsteroidDisplaySize(
    asteroid.estimated_diameter.meters.estimated_diameter_min
  );
  const asteroidColor = getAsteroidColor(
    asteroid.estimated_diameter.meters.estimated_diameter_min,
    asteroid.is_potentially_hazardous_asteroid
  );

  return (
    <div className="flex items-center space-x-4 mb-4">
      {/* Визуализация астероида */}
      <div
        className="relative flex-shrink-0 rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${displaySize}px`,
          height: `${displaySize}px`,
          background: `radial-gradient(circle at 30% 30%, ${asteroidColor}, ${asteroidColor}dd)`,
          boxShadow: `
            inset -${displaySize * 0.1}px -${displaySize * 0.05}px ${displaySize * 0.2}px rgba(255,255,255,0.3),
            inset ${displaySize * 0.1}px ${displaySize * 0.05}px ${displaySize * 0.2}px rgba(0,0,0,0.5),
            0 0 ${displaySize * 0.3}px ${asteroidColor}80,
            ${isSelected ? '0 0 20px #00ffff, 0 0 30px #00ffff80' : 'none'}
          `,
          border: isSelected ? '2px solid #00ffff' : 'none'
        }}
      >
        {/* Кратеры на поверхности */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-gray-800/50 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-gray-900/60 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-gray-700/40 rounded-full"></div>
        
        {/* Индикатор выбора */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Основная информация */}
      <div className="flex-1 min-w-0">
        <h3 className="font-orbitron text-xl text-cyan-400 truncate">
          {asteroid.name}
          {isSelected && (
            <span className="ml-2 text-sm text-green-400">✓ Выбран</span>
          )}
        </h3>
        <p className="text-gray-400 text-sm font-space-mono">
          Ø {asteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(1)} м
          {asteroid.is_potentially_hazardous_asteroid && (
            <span className="ml-2 text-red-400">⚠️ Опасен</span>
          )}
        </p>
      </div>
    </div>
  );
};

const AsteroidsList: React.FC = () => {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedAsteroid, setSelectedAsteroid } = useAsteroid();

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
    setSelectedAsteroid(asteroid);
    
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
              {/* Визуализация астероида */}
              <AsteroidVisual 
                asteroid={a} 
                isSelected={selectedAsteroid?.name === a.name}
              />

              {/* Детальная информация */}
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