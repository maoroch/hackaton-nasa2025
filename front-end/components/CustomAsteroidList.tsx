// components/CustomAsteroidList.tsx
"use client";

import { useAsteroid, CustomAsteroid } from './context/AsteroidContext';

const CustomAsteroidList = () => {
  const { 
    selectedAsteroid, 
    setSelectedAsteroid, 
    customAsteroids,
    setIsCustomCreatorOpen 
  } = useAsteroid();

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} км`;
    }
    return `${num.toFixed(0)} м`;
  };

  const formatMass = (massKg: number) => {
    if (massKg >= 1e9) {
      return `${(massKg / 1e9).toFixed(1)} млн тонн`;
    } else if (massKg >= 1e6) {
      return `${(massKg / 1e6).toFixed(1)} тыс. тонн`;
    } else {
      return `${(massKg / 1000).toFixed(0)} тонн`;
    }
  };

  const getHazardColor = (isHazardous: boolean) => {
    return isHazardous ? 'border-red-400 bg-red-500/10' : 'border-green-400 bg-green-500/10';
  };

  const getHazardText = (isHazardous: boolean) => {
    return isHazardous ? '⚠️ ОПАСНЫЙ' : '✅ БЕЗОПАСНЫЙ';
  };

  const getHazardBadgeColor = (isHazardous: boolean) => {
    return isHazardous ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300';
  };
  // В CustomAsteroidList - добавьте отладочный вывод
const handleAsteroidClick = (asteroid: CustomAsteroid) => {
  console.log("🔄 Выбор кастомного астероида:", asteroid.name);
  setSelectedAsteroid(asteroid);
};

  return (
    <div className="w-80 bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-orbitron text-white">Мои Астероиды</h2>
        <button
          onClick={() => setIsCustomCreatorOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-orbitron transition-colors flex items-center space-x-1"
        >
          <span>+</span>
          <span>Создать</span>
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {customAsteroids.map((asteroid) => (
          <div
            key={asteroid.id}
            onClick={() => setSelectedAsteroid(asteroid)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedAsteroid?.id === asteroid.id 
                ? 'bg-white/10 scale-105' 
                : 'bg-gray-800/50 hover:bg-gray-700/50'
            } ${getHazardColor(asteroid.is_potentially_hazardous_asteroid)}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-orbitron text-white text-sm">
                  {asteroid.name} 🛠️
                </h3>
                <div className="text-xs text-gray-300 mt-1 space-y-1">
                  <p>📏 Диаметр: {formatNumber(asteroid.diameter)}</p>
                  <p>🚀 Скорость: {asteroid.velocity.toFixed(2)} км/с</p>
                  <p>⚖️ Масса: {formatMass(asteroid.mass_kg)}</p>
                  <p>📐 Угол: {asteroid.angle}°</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getHazardBadgeColor(asteroid.is_potentially_hazardous_asteroid)}`}>
                {getHazardText(asteroid.is_potentially_hazardous_asteroid)}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              📅 Создан: {new Date(asteroid.created_at).toLocaleDateString('ru-RU')}
            </div>
          </div>
        ))}
        
        {customAsteroids.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            <p>Нет созданных астероидов</p>
            <p className="text-sm mt-1">Создайте свой первый астероид!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomAsteroidList;