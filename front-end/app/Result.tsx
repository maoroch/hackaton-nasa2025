"use client";

import { useState, useEffect } from "react";

interface AsteroidImpactData {
  name: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  mass: string;
  diameter: string;
  velocity: string;
  kinetic_energy: string;
  crater: {
    diameter: string;
    dust_radius: string;
    dust_height: string;
  };
  is_hazardous: boolean;
}

export default function AsteroidImpactPage() {
  const [asteroidName, setAsteroidName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [impactData, setImpactData] = useState<AsteroidImpactData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.8);

  const handleFetchAsteroid = async () => {
    if (!asteroidName || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
      setError("Please enter a valid asteroid name and coordinates");
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/asteroids/${encodeURIComponent(asteroidName)}?lat=${lat}&lon=${lon}`
      );
      if (!response.ok) {
        throw new Error("Asteroid not found or API error");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setImpactData(data);
      setError(null);
      setOpacity(1);
      setScale(1);
    } catch (err: any) {
      setError(err.message);
      setImpactData(null);
      setOpacity(0);
      setScale(0.8);
    }
  };

  // Анимация при загрузке страницы
  useEffect(() => {
    setTimeout(() => {
      setOpacity(1);
      setScale(1);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div
        className="bg-gradient-to-br from-red-900/95 via-orange-900/90 to-yellow-800/85 backdrop-blur-xl rounded-2xl p-8 max-w-3xl w-full shadow-2xl border border-red-400/20 transition-all duration-500 ease-out"
        style={{ opacity, transform: `scale(${scale}) translateY(${(1 - scale) * 20}px)` }}
      >
        {/* Explosion effect background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute w-2 h-2 bg-yellow-300 rounded-full top-4 left-6 animate-pulse"></div>
          <div className="absolute w-2 h-2 bg-orange-400 rounded-full top-8 right-8 animate-pulse delay-200"></div>
          <div className="absolute w-2 h-2 bg-red-500 rounded-full bottom-6 left-12"></div>
          <div className="absolute w-2 h-2 bg-yellow-300 rounded-full bottom-12 right-16 animate-pulse delay-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h1 className="text-3xl font-orbitron text-red-300 font-bold">
                💥 Asteroid Impact Simulator
              </h1>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse delay-300"></div>
            </div>
            <p className="text-red-200/80 font-space-mono text-sm">
              Simulate the impact of an asteroid on Earth
            </p>
          </div>

          {/* Input Form */}
          <div className="mb-8 bg-gray-800/50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-red-200 font-space-mono mb-1">Asteroid Name</label>
                <input
                  type="text"
                  value={asteroidName}
                  onChange={(e) => setAsteroidName(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded p-2 font-space-mono text-sm"
                  placeholder="e.g., Sample Asteroid"
                />
              </div>
              <div>
                <label className="block text-red-200 font-space-mono mb-1">Latitude</label>
                <input
                  type="number"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded p-2 font-space-mono text-sm"
                  placeholder="e.g., 55.7558"
                />
              </div>
              <div>
                <label className="block text-red-200 font-space-mono mb-1">Longitude</label>
                <input
                  type="number"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded p-2 font-space-mono text-sm"
                  placeholder="e.g., 37.6173"
                />
              </div>
            </div>
            <button
              onClick={handleFetchAsteroid}
              className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-orbitron py-2 rounded text-sm"
            >
              Simulate Impact
            </button>
            {error && <p className="mt-2 text-red-400 font-space-mono text-sm">{error}</p>}
          </div>

          {/* Impact Data */}
          {impactData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-100">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div className="bg-red-900/30 rounded-lg p-4">
                  <h2 className="font-orbitron text-red-300 text-sm mb-3">IMPACT COORDINATES</h2>
                  <div className="space-y-2 font-space-mono text-sm">
                    <p className="flex justify-between">
                      <span className="text-red-200">Latitude:</span>
                      <span className="text-white">{impactData.coordinates.lat.toFixed(4)}°</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-red-200">Longitude:</span>
                      <span className="text-white">{impactData.coordinates.lon.toFixed(4)}°</span>
                    </p>
                  </div>
                </div>

                <div className="bg-orange-900/30 rounded-lg p-4">
                  <h2 className="font-orbitron text-orange-300 text-sm mb-3">ASTEROID SPECS</h2>
                  <div className="space-y-2 font-space-mono text-sm">
                    <p className="flex justify-between">
                      <span className="text-orange-200">Mass:</span>
                      <span className="text-yellow-300">{impactData.mass}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-orange-200">Diameter:</span>
                      <span className="text-white">{impactData.diameter}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-orange-200">Velocity:</span>
                      <span className="text-white">{impactData.velocity}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Impact Data */}
              <div className="space-y-4">
                <div className="bg-yellow-900/30 rounded-lg p-4">
                  <h2 className="font-orbitron text-yellow-300 text-sm mb-3">ENERGY RELEASE</h2>
                  <div className="space-y-2 font-space-mono text-sm">
                    <p className="flex justify-between">
                      <span className="text-yellow-200">Kinetic Energy:</span>
                      <span className="text-white">{impactData.kinetic_energy}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-red-800/30 rounded-lg p-4">
                  <h2 className="font-orbitron text-red-300 text-sm mb-3">CRATER FORMATION</h2>
                  <div className="space-y-2 font-space-mono text-sm">
                    <p className="flex justify-between">
                      <span className="text-red-200">Crater Diameter:</span>
                      <span className="text-white">{impactData.crater.diameter}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-red-200">Ejecta Radius:</span>
                      <span className="text-white">{impactData.crater.dust_radius}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-red-200">Dust Cloud Height:</span>
                      <span className="text-white">{impactData.crater.dust_height}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer with warning */}
          {impactData && (
            <div className="mt-6 pt-4 border-t border-red-500/30 text-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span
                  className={`font-space-mono text-xs tracking-widest ${
                    impactData.is_hazardous ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {impactData.is_hazardous ? "⚠️ EXTREME HAZARD LEVEL" : "✅ MODERATE IMPACT"}
                </span>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse delay-300"></div>
              </div>
            </div>
          )}

          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-2xl border border-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)] pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}