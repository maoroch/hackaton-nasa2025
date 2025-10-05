"use client";

import { useState } from 'react';
import InfoAsteroids from './InfoAsteroids';
import MathAsteroids from './AsteroidsMath';
import CustomAsteroidCreator from './moduleWindows/CustomAsteroidCreator';
import Link from 'next/link';
import { useAsteroid } from './context/AsteroidContext';

interface CustomAsteroidData {
  name: string;
  diameter: number;
  density: number;
  velocity: number;
  angle: number;
}

interface ImpactResult {
  kinetic_energy: number;
  crater_diameter: number;
  ejecta_radius: number;
  dust_height: number;
}

// Утилиты для размера и цвета астероида
const getAsteroidDisplaySize = (diameterMeters: number): number => {
  const minRealSize = 1;
  const maxRealSize = 1000;
  const minDisplaySize = 16;
  const maxDisplaySize = 48;
  
  const logMin = Math.log(minRealSize);
  const logMax = Math.log(maxRealSize);
  const logValue = Math.log(Math.max(diameterMeters, minRealSize));
  
  const normalized = (logValue - logMin) / (logMax - logMin);
  return minDisplaySize + normalized * (maxDisplaySize - minDisplaySize);
};

const getAsteroidColor = (diameter: number, isHazardous: boolean): string => {
  const sizeFactor = Math.min(diameter / 500, 1);
  
  if (isHazardous) {
    const red = 200 + Math.floor(sizeFactor * 55);
    const green = 100 - Math.floor(sizeFactor * 80);
    const blue = 100 - Math.floor(sizeFactor * 80);
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    const red = 100 + Math.floor(sizeFactor * 50);
    const green = 150 + Math.floor(sizeFactor * 50);
    const blue = 200 - Math.floor(sizeFactor * 50);
    return `rgb(${red}, ${green}, ${blue})`;
  }
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMathOpen, setIsMathOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const { selectedAsteroid } = useAsteroid();

  // Компонент для отображения астероида в баннере
  const SelectedAsteroidVisual = () => {
    if (!selectedAsteroid) return null;
    
    const displaySize = getAsteroidDisplaySize(
      selectedAsteroid.estimated_diameter.meters.estimated_diameter_min
    );
    const asteroidColor = getAsteroidColor(
      selectedAsteroid.estimated_diameter.meters.estimated_diameter_min,
      selectedAsteroid.is_potentially_hazardous_asteroid
    );

    return (
      <div className="flex items-center space-x-3">
        <div
          className="flex-shrink-0 rounded-full relative transition-all duration-300"
          style={{
            width: `${displaySize}px`,
            height: `${displaySize}px`,
            background: `radial-gradient(circle at 30% 30%, ${asteroidColor}, ${asteroidColor}dd)`,
            boxShadow: `
              inset -${displaySize * 0.1}px -${displaySize * 0.05}px ${displaySize * 0.2}px rgba(255,255,255,0.3),
              inset ${displaySize * 0.1}px ${displaySize * 0.05}px ${displaySize * 0.2}px rgba(0,0,0,0.5),
              0 0 ${displaySize * 0.3}px ${asteroidColor}80,
              0 0 20px rgba(0, 255, 255, 0.5)
            `,
            border: '2px solid #00ffff'
          }}
        >
          {/* Кратеры на поверхности */}
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-gray-800/50 rounded-full"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-gray-900/60 rounded-full"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-gray-700/40 rounded-full"></div>
          
          {/* Индикатор выбора */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border border-white"></div>
        </div>
        
        <div className="min-w-0">
          <h3 className="font-bold text-cyan-300 truncate">
            ✅ {selectedAsteroid.name}
          </h3>
          <p className="text-sm text-cyan-200">
            Ø {selectedAsteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(1)} м • 
            Кликните на Землю для удара!
            {selectedAsteroid.is_potentially_hazardous_asteroid && (
              <span className="ml-1 text-red-300">⚠️ Опасен</span>
            )}
          </p>
        </div>
      </div>
    );
  };

  const handleCreateAsteroid = (data: CustomAsteroidData, result: ImpactResult) => {
    console.log("🎯 Создан пользовательский метеорит:", {
      name: data.name,
      диаметр: `${data.diameter} м`,
      плотность: `${data.density} кг/м³`,
      скорость: `${data.velocity} км/с`,
      угол: `${data.angle}°`,
      кинетическая_энергия: `${result.kinetic_energy.toExponential(2)} Дж`,
      кратер: `${result.crater_diameter.toFixed(1)} м`,
      радиус_выброса: `${result.ejecta_radius.toFixed(1)} м`,
      высота_пыли: `${result.dust_height.toFixed(1)} м`
    });
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl z-50 shadow-2xl">
        <div className="px-6 py-3">
          <div className="flex items-center justify-center space-x-4">
            {/* Home Link */}
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-white/80 hover:text-cyan-300 transition-all duration-200 p-2 rounded-lg hover:bg-white/5"
              title="Главная"
            >
              <span className="text-lg font-light">🏠</span>
            </Link>

            {/* Create Asteroid Button */}
            <button
              onClick={() => setIsCreatorOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-purple-500/20 text-white/90 hover:text-purple-300 font-light text-lg transition-all duration-200 border border-white/10 hover:border-purple-400/30"
              title="Создать метеорит"
            >
              +
            </button>

            {/* Asteroid Math Button */}
            <button
              onClick={() => setIsMathOpen(!isMathOpen)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-white/90 hover:text-cyan-300 font-light text-sm transition-all duration-200 border border-white/10 hover:border-cyan-400/30"
            >
              {isMathOpen ? '✕ Close' : 'Calculations'}
            </button>

            {/* Asteroid Data Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-white/90 hover:text-cyan-300 font-light text-sm transition-all duration-200 border border-white/10 hover:border-cyan-400/30"
            >
              {isOpen ? '✕ Close' : 'Asteroids'}
            </button>

            {/* Additional Links */}
            <Link
              href="/earth"
              className="flex items-center space-x-2 text-white/80 hover:text-cyan-300 transition-all duration-200 p-2 rounded-lg hover:bg-white/5"
              title="Земля - симулятор ударов"
            >
              <span className="text-lg font-light">🌍</span>
            </Link>

            <Link
              href="/meteorites"
              className="flex items-center space-x-2 text-white/80 hover:text-cyan-300 transition-all duration-200 p-2 rounded-lg hover:bg-white/5"
              title="Метеориты"
            >
              <span className="text-lg font-light">☄️</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Баннер выбранного астероида */}
      {selectedAsteroid && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-cyan-900/90 backdrop-blur-lg text-white p-4 rounded-xl border border-cyan-400/50 z-40 shadow-2xl max-w-md">
          <SelectedAsteroidVisual />
        </div>
      )}

      {/* Sliding Panel for InfoAsteroids */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-gradient-to-b from-gray-900/95 to-blue-900/95 backdrop-blur-xl text-white transform transition-transform duration-300 ease-in-out overflow-y-auto z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-sm p-4 border-b border-cyan-700/30">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-light text-cyan-300">
              Asteroid Data
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl text-cyan-300 transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>
        <InfoAsteroids />
      </div>

      {/* Sliding Panel for MathAsteroids */}
      <div
        className={`fixed left-0 top-0 h-full w-full sm:w-96 bg-gradient-to-b from-gray-900/95 to-blue-900/95 backdrop-blur-xl text-white transform transition-transform duration-300 ease-in-out overflow-y-auto z-40 ${
          isMathOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-sm p-4 border-b border-cyan-700/30">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-light text-cyan-300">
              Asteroid Calculations
            </h2>
            <button
              onClick={() => setIsMathOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl text-cyan-300 transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>
        <MathAsteroids />
      </div>

      {/* Custom Asteroid Creator Modal */}
      <CustomAsteroidCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onCreateAsteroid={handleCreateAsteroid}
      />

      {/* Overlay when panels are open */}
      {(isOpen || isMathOpen) && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => {
            setIsOpen(false);
            setIsMathOpen(false);
          }}
        />
      )}
    </>
  );
};

export default Navbar;