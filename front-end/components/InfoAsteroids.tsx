// components/InfoAsteroids.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAsteroid } from './context/AsteroidContext';
import { Asteroid, CustomAsteroid, AnyAsteroid, isCustomAsteroid } from './types/typesAsteroid';

interface ApiResponse {
  count: number;
  nasa_count: number;
  custom_count: number;
  asteroids: AnyAsteroid[];
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
  const minRealSize = 1;
  const maxRealSize = 1000;
  const minDisplaySize = 8;
  const maxDisplaySize = 120;
  
  const logMin = Math.log(minRealSize);
  const logMax = Math.log(maxRealSize);
  const logValue = Math.log(Math.max(diameterMeters, minRealSize));
  
  const normalized = (logValue - logMin) / (logMax - logMin);
  return minDisplaySize + normalized * (maxDisplaySize - minDisplaySize);
};

// Утилита для расчета цвета астероида
const getAsteroidColor = (diameter: number, isHazardous: boolean, isCustom: boolean = false): string => {
  const sizeFactor = Math.min(diameter / 500, 1);
  
  if (isCustom) {
    // Кастомные астероиды - фиолетовые оттенки
    const red = 150 + Math.floor(sizeFactor * 50);
    const green = 100 + Math.floor(sizeFactor * 30);
    const blue = 200 + Math.floor(sizeFactor * 55);
    return `rgb(${red}, ${green}, ${blue})`;
  } else if (isHazardous) {
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

// Функция для получения диаметра астероида (работает с любым типом)
const getAsteroidDiameter = (asteroid: AnyAsteroid): number => {
  if (isCustomAsteroid(asteroid)) {
    return asteroid.diameter;
  } else {
    return asteroid.estimated_diameter.meters.estimated_diameter_min;
  }
};

// Функция для получения скорости астероида (работает с любым типом)
const getAsteroidVelocity = (asteroid: AnyAsteroid): number => {
  if (isCustomAsteroid(asteroid)) {
    return asteroid.velocity;
  } else {
    return parseFloat(asteroid.relative_velocity.kilometers_per_second);
  }
};

// Компонент для визуализации астероида
const AsteroidVisual = ({ 
  asteroid, 
  isSelected
}: { 
  asteroid: AnyAsteroid, 
  isSelected: boolean
}) => {
  const isCustom = isCustomAsteroid(asteroid);
  const diameter = getAsteroidDiameter(asteroid);
  const displaySize = getAsteroidDisplaySize(diameter);
  const asteroidColor = getAsteroidColor(
    diameter,
    asteroid.is_potentially_hazardous_asteroid,
    isCustom
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
        
        {/* Индикатор кастомного астероида */}
        {isCustom && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Основная информация */}
      <div className="flex-1 min-w-0">
        <h3 className="font-orbitron text-xl text-cyan-400 truncate">
          {asteroid.name}
          {isCustom && (
            <span className="ml-2 text-sm text-purple-400">🛠️</span>
          )}
          {isSelected && (
            <span className="ml-2 text-sm text-green-400">✓ Выбран</span>
          )}
        </h3>
        <p className="text-gray-400 text-sm font-space-mono">
          Ø {diameter.toFixed(1)} м
          {asteroid.is_potentially_hazardous_asteroid && (
            <span className="ml-2 text-red-400">⚠️ Опасен</span>
          )}
          {isCustom && (
            <span className="ml-2 text-purple-400">Кастомный</span>
          )}
        </p>
      </div>
    </div>
  );
};

const AsteroidsList: React.FC = () => {
  const [allAsteroids, setAllAsteroids] = useState<AnyAsteroid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedAsteroid, setSelectedAsteroid } = useAsteroid();

  // Загрузка всех астероидов (NASA + кастомные из JSON)
const fetchAllAsteroids = async () => {
  try {
    setLoading(true);
    const response = await fetch("http://127.0.0.1:5000/api/asteroids/all-with-custom");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: ApiResponse = await response.json();
    setAllAsteroids(data.asteroids);
    setError(null);
    
    console.log(`✅ Загружено астероидов: NASA: ${data.nasa_count}, Кастомные: ${data.custom_count}`);
  } catch (err) {
    console.error("Failed to fetch asteroids:", err);
    setError("Failed to load asteroids data. Is the server running?");
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
  fetchAllAsteroids();
}, []);

// Добавьте отладочный вывод
useEffect(() => {
  console.log("Текущие астероиды:", allAsteroids);
}, [allAsteroids]);

  
  // Функция для удаления астероида
  const handleDeleteAsteroid = async (asteroidId: string, asteroidName: string) => {
    if (confirm(`Удалить астероид "${asteroidName}"?`)) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/asteroids/custom/${asteroidId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("✅ Астероид удален:", asteroidName);
        
        // Обновляем список
        await fetchAllAsteroids();
        
        // Если выбранный астероид удаляется, сбрасываем выбор
        if (selectedAsteroid?.id === asteroidId) {
          setSelectedAsteroid(null);
        }

        alert(`✅ Астероид "${asteroidName}" удален!`);
      } catch (error) {
        console.error("❌ Ошибка при удалении астероида:", error);
        alert("❌ Ошибка при удалении астероида. Проверьте консоль для деталей.");
      }
    }
  };

  const handleAsteroidClick = (asteroid: AnyAsteroid) => {
    setSelectedAsteroid(asteroid);
    
    if (isCustomAsteroid(asteroid)) {
      // Логика для кастомных астероидов
      console.log("🎯 Выбран кастомный астероид:", {
        name: asteroid.name,
        масса: formatMass(asteroid.mass_kg),
        диаметр: `${asteroid.diameter.toFixed(2)} м`,
        скорость: `${asteroid.velocity.toFixed(2)} км/с`,
        кинетическая_энергия: asteroid.kinetic_energy_joules ? `${asteroid.kinetic_energy_joules.toExponential(2)} Дж` : "Неизвестно",
        кратер: {
          диаметр: `${asteroid.crater_diameter.toFixed(1)} м`,
          радиус_выброса: `${asteroid.ejecta_radius.toFixed(1)} м`, 
          высота_пыли: `${asteroid.dust_height.toFixed(1)} м`
        },
        опасный: asteroid.is_potentially_hazardous_asteroid ? "Да" : "Нет",
        тип: "Кастомный"
      });
    } else {
      // Логика для NASA астероидов
      console.log("🎯 Выбран астероид NASA:", {
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
        опасный: asteroid.is_potentially_hazardous_asteroid ? "Да" : "Нет",
        тип: "NASA"
      });
    }
  };

  // Подсчет количества астероидов по типам
  const nasaCount = allAsteroids.filter(a => !isCustomAsteroid(a)).length;
  const customCount = allAsteroids.filter(isCustomAsteroid).length;
  const hazardousCount = allAsteroids.filter(a => a.is_potentially_hazardous_asteroid).length;

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
      {/* Заголовок с информацией и кнопкой обновления */}
      <div className="p-4 bg-slate-800/50 border-b border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-orbitron text-lg text-cyan-300">
            🪐 Список астероидов
          </h2>
          <button
            onClick={fetchAllAsteroids}
            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-orbitron transition-colors flex items-center space-x-1"
            title="Обновить список"
          >
            <span>⟳</span>
            <span>Обновить</span>
          </button>
        </div>
        <div className="flex space-x-4 text-sm text-gray-400">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>NASA: {nasaCount}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Опасные: {hazardousCount}</span>
          </div>
        </div>
      </div>

      {selectedAsteroid && (
        <div className="p-4 bg-cyan-900/20 border-l-4 border-cyan-400">
          <h3 className="font-orbitron text-lg text-cyan-300 mb-2">
            ✅ Выбран: {selectedAsteroid.name}
            {isCustomAsteroid(selectedAsteroid) && (
              <span className="ml-2 text-purple-400 text-sm">🛠️ Кастомный</span>
            )}
          </h3>
          <p className="text-sm text-cyan-200">
            Кликните на Землю чтобы запустить этот астероид!
          </p>
        </div>
      )}
      
      {allAsteroids.length === 0 ? (
        <div className="p-8 text-center">
          <p className="font-space-mono text-gray-400 mb-4">Нет доступных астероидов</p>
          <p className="text-sm text-gray-500">
            Загрузите данные с сервера или создайте свой астероид
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-700">
          {allAsteroids.map((asteroid, idx) => (
            <li
              key={asteroid.id || idx}
              className={`p-6 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer group relative ${
                selectedAsteroid?.id === asteroid.id 
                  ? 'bg-cyan-900/30 border-l-4 border-cyan-400' 
                  : asteroid.is_potentially_hazardous_asteroid 
                    ? 'bg-red-900/20 hover:bg-red-900/30' 
                    : isCustomAsteroid(asteroid)
                    ? 'bg-purple-900/10 hover:bg-purple-900/20'
                    : ''
              }`}
            >
              {/* Кнопка удаления для кастомных астероидов */}
              {isCustomAsteroid(asteroid) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAsteroid(asteroid.id, asteroid.name);
                  }}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Удалить астероид"
                >
                  ×
                </button>
              )}

              <div onClick={() => handleAsteroidClick(asteroid)}>
                {/* Визуализация астероида */}
                <AsteroidVisual 
                  asteroid={asteroid} 
                  isSelected={selectedAsteroid?.id === asteroid.id}
                />

                {/* Детальная информация */}
                <div className="space-y-2 font-inter text-gray-300">
                  {isCustomAsteroid(asteroid) ? (
                    // Информация для кастомных астероидов
                    <>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Тип:</span>
                        <span className="font-space-mono text-purple-400">🛠️ Кастомный</span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Диаметр:</span>
                        <span className="font-space-mono">
                          {asteroid.diameter.toFixed(2)} м
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Масса:</span>
                        <span className="font-space-mono text-yellow-300">
                          {formatMass(asteroid.mass_kg)}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Скорость:</span>
                        <span className="font-space-mono">
                          {asteroid.velocity.toFixed(2)} км/с
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Создан:</span>
                        <span className="font-space-mono">
                          {new Date(asteroid.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </p>
                    </>
                  ) : (
                    // Информация для NASA астероидов
                    <>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Дата сближения:</span>
                        <span className="font-space-mono">{asteroid.date}</span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Диаметр:</span>
                        <span className="font-space-mono">
                          {asteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} м
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Масса:</span>
                        <span className="font-space-mono text-yellow-300">
                          {formatMass(asteroid.mass_kg)}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Скорость:</span>
                        <span className="font-space-mono">
                          {parseFloat(asteroid.relative_velocity.kilometers_per_second).toFixed(2)} км/с
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Расстояние:</span>
                        <span className="font-space-mono">
                          {(parseFloat(asteroid.miss_distance.kilometers)/1000).toFixed(0)} тыс. км
                        </span>
                      </p>
                    </>
                  )}
                  
                  <p className="flex items-center mt-4">
                    <span className="w-40 text-gray-400">Опасность:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      asteroid.is_potentially_hazardous_asteroid 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {asteroid.is_potentially_hazardous_asteroid ? '⚠️ Опасен' : '✅ Безопасен'}
                    </span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AsteroidsList;