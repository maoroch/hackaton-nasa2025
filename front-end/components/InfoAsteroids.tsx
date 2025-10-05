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

// Function for formatting large numbers
const formatMass = (massKg: number | undefined): string => {
  if (massKg === undefined || massKg === null || isNaN(massKg)) {
    return "Unknown";
  }
  
  if (massKg >= 1e12) {
    return `${(massKg / 1e12).toFixed(2)} billion tons`;
  } else if (massKg >= 1e9) {
    return `${(massKg / 1e9).toFixed(2)} million tons`;
  } else if (massKg >= 1e6) {
    return `${(massKg / 1e6).toFixed(2)} thousand tons`;
  } else if (massKg >= 1e3) {
    return `${(massKg / 1e3).toFixed(2)} tons`;
  } else {
    return `${massKg.toFixed(2)} kg`;
  }
};

// Utility for calculating asteroid visual size
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

// Utility for calculating asteroid color
const getAsteroidColor = (diameter: number, isHazardous: boolean, isCustom: boolean = false): string => {
  const sizeFactor = Math.min(diameter / 500, 1);
  
  if (isCustom) {
    // Custom asteroids - purple shades
    const red = 150 + Math.floor(sizeFactor * 50);
    const green = 100 + Math.floor(sizeFactor * 30);
    const blue = 200 + Math.floor(sizeFactor * 55);
    return `rgb(${red}, ${green}, ${blue})`;
  } else if (isHazardous) {
    // Hazardous - red shades
    const red = 200 + Math.floor(sizeFactor * 55);
    const green = 100 - Math.floor(sizeFactor * 80);
    const blue = 100 - Math.floor(sizeFactor * 80);
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    // Safe - blue/green shades
    const red = 100 + Math.floor(sizeFactor * 50);
    const green = 150 + Math.floor(sizeFactor * 50);
    const blue = 200 - Math.floor(sizeFactor * 50);
    return `rgb(${red}, ${green}, ${blue})`;
  }
};

// Function to get asteroid diameter (works with any type)
const getAsteroidDiameter = (asteroid: AnyAsteroid): number => {
  if (isCustomAsteroid(asteroid)) {
    return asteroid.diameter;
  } else {
    return asteroid.estimated_diameter.meters.estimated_diameter_min;
  }
};

// Function to get asteroid velocity (works with any type)
const getAsteroidVelocity = (asteroid: AnyAsteroid): number => {
  if (isCustomAsteroid(asteroid)) {
    return asteroid.velocity;
  } else {
    return parseFloat(asteroid.relative_velocity.kilometers_per_second);
  }
};

// Component for asteroid visualization
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
      {/* Asteroid visualization */}
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
        {/* Surface craters */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-gray-800/50 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-gray-900/60 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-gray-700/40 rounded-full"></div>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
        )}
        
        {/* Custom asteroid indicator */}
        {isCustom && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Main information */}
      <div className="flex-1 min-w-0">
        <h3 className="font-orbitron text-xl text-cyan-400 truncate">
          {asteroid.name}
          {isCustom && (
            <span className="ml-2 text-sm text-purple-400">🛠️</span>
          )}
          {isSelected && (
            <span className="ml-2 text-sm text-green-400">✓ Selected</span>
          )}
        </h3>
        <p className="text-gray-400 text-sm font-space-mono">
          Ø {diameter.toFixed(1)} m
          {asteroid.is_potentially_hazardous_asteroid && (
            <span className="ml-2 text-red-400">⚠️ Hazardous</span>
          )}
          {isCustom && (
            <span className="ml-2 text-purple-400">Custom</span>
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

  // Loading all asteroids (NASA + custom from JSON)
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
    
    console.log(`✅ Loaded asteroids: NASA: ${data.nasa_count}, Custom: ${data.custom_count}`);
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

// Add debug output
useEffect(() => {
  console.log("Current asteroids:", allAsteroids);
}, [allAsteroids]);

  
  // Function to delete asteroid
  const handleDeleteAsteroid = async (asteroidId: string, asteroidName: string) => {
    if (confirm(`Delete asteroid "${asteroidName}"?`)) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/asteroids/custom/${asteroidId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("✅ Asteroid deleted:", asteroidName);
        
        // Update list
        await fetchAllAsteroids();
        
        // If selected asteroid is deleted, reset selection
        if (selectedAsteroid?.id === asteroidId) {
          setSelectedAsteroid(null);
        }

        alert(`✅ Asteroid "${asteroidName}" deleted!`);
      } catch (error) {
        console.error("❌ Error deleting asteroid:", error);
        alert("❌ Error deleting asteroid. Check console for details.");
      }
    }
  };

  const handleAsteroidClick = (asteroid: AnyAsteroid) => {
    setSelectedAsteroid(asteroid);
    
    if (isCustomAsteroid(asteroid)) {
      // Logic for custom asteroids
      console.log("🎯 Selected custom asteroid:", {
        name: asteroid.name,
        mass: formatMass(asteroid.mass_kg),
        diameter: `${asteroid.diameter.toFixed(2)} m`,
        velocity: `${asteroid.velocity.toFixed(2)} km/s`,
        kinetic_energy: asteroid.kinetic_energy_joules ? `${asteroid.kinetic_energy_joules.toExponential(2)} J` : "Unknown",
        crater: {
          diameter: `${asteroid.crater_diameter.toFixed(1)} m`,
          ejecta_radius: `${asteroid.ejecta_radius.toFixed(1)} m`, 
          dust_height: `${asteroid.dust_height.toFixed(1)} m`
        },
        hazardous: asteroid.is_potentially_hazardous_asteroid ? "Yes" : "No",
        type: "Custom"
      });
    } else {
      // Logic for NASA asteroids
      console.log("🎯 Selected NASA asteroid:", {
        name: asteroid.name,
        mass: formatMass(asteroid.mass_kg),
        diameter: `${asteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} m`,
        velocity: `${parseFloat(asteroid.relative_velocity.kilometers_per_second).toFixed(2)} km/s`,
        kinetic_energy: asteroid.kinetic_energy_joules ? `${asteroid.kinetic_energy_joules.toExponential(2)} J` : "Unknown",
        crater: asteroid.crater ? {
          diameter: `${asteroid.crater.diameter_m.toFixed(1)} m`,
          ejecta_radius: `${asteroid.crater.dust_radius_m.toFixed(1)} m`, 
          dust_height: `${asteroid.crater.dust_height_m.toFixed(1)} m`
        } : "Unknown",
        hazardous: asteroid.is_potentially_hazardous_asteroid ? "Yes" : "No",
        type: "NASA"
      });
    }
  };

  // Counting asteroids by type
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
      {/* Header with information and refresh button */}
      <div className="p-4 bg-slate-800/50 border-b border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-orbitron text-lg text-cyan-300">
            🪐 Asteroids List
          </h2>
          <button
            onClick={fetchAllAsteroids}
            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-orbitron transition-colors flex items-center space-x-1"
            title="Refresh list"
          >
            <span>⟳</span>
            <span>Refresh</span>
          </button>
        </div>
        <div className="flex space-x-4 text-sm text-gray-400">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>NASA: {nasaCount}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Hazardous: {hazardousCount}</span>
          </div>
        </div>
      </div>

      {selectedAsteroid && (
        <div className="p-4 bg-cyan-900/20 border-l-4 border-cyan-400">
          <h3 className="font-orbitron text-lg text-cyan-300 mb-2">
            ✅ Selected: {selectedAsteroid.name}
            {isCustomAsteroid(selectedAsteroid) && (
              <span className="ml-2 text-purple-400 text-sm">🛠️ Custom</span>
            )}
          </h3>
          <p className="text-sm text-cyan-200">
            Click on Earth to launch this asteroid!
          </p>
        </div>
      )}
      
      {allAsteroids.length === 0 ? (
        <div className="p-8 text-center">
          <p className="font-space-mono text-gray-400 mb-4">No asteroids available</p>
          <p className="text-sm text-gray-500">
            Load data from server or create your own asteroid
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
              {/* Delete button for custom asteroids */}
              {isCustomAsteroid(asteroid) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAsteroid(asteroid.id, asteroid.name);
                  }}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Delete asteroid"
                >
                  ×
                </button>
              )}

              <div onClick={() => handleAsteroidClick(asteroid)}>
                {/* Asteroid visualization */}
                <AsteroidVisual 
                  asteroid={asteroid} 
                  isSelected={selectedAsteroid?.id === asteroid.id}
                />

                {/* Detailed information */}
                <div className="space-y-2 font-inter text-gray-300">
                  {isCustomAsteroid(asteroid) ? (
                    // Information for custom asteroids
                    <>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Type:</span>
                        <span className="font-space-mono text-purple-400">🛠️ Custom</span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Diameter:</span>
                        <span className="font-space-mono">
                          {asteroid.diameter.toFixed(2)} m
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Mass:</span>
                        <span className="font-space-mono text-yellow-300">
                          {formatMass(asteroid.mass_kg)}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Velocity:</span>
                        <span className="font-space-mono">
                          {asteroid.velocity.toFixed(2)} km/s
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Created:</span>
                        <span className="font-space-mono">
                          {new Date(asteroid.created_at).toLocaleDateString('en-US')}
                        </span>
                      </p>
                    </>
                  ) : (
                    // Information for NASA asteroids
                    <>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Close approach date:</span>
                        <span className="font-space-mono">{asteroid.date}</span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Diameter:</span>
                        <span className="font-space-mono">
                          {asteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} m
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Mass:</span>
                        <span className="font-space-mono text-yellow-300">
                          {formatMass(asteroid.mass_kg)}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Velocity:</span>
                        <span className="font-space-mono">
                          {parseFloat(asteroid.relative_velocity.kilometers_per_second).toFixed(2)} km/s
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-40 text-gray-400">Distance:</span>
                        <span className="font-space-mono">
                          {(parseFloat(asteroid.miss_distance.kilometers)/1000).toFixed(0)} thousand km
                        </span>
                      </p>
                    </>
                  )}
                  
                  <p className="flex items-center mt-4">
                    <span className="w-40 text-gray-400">Hazard:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      asteroid.is_potentially_hazardous_asteroid 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {asteroid.is_potentially_hazardous_asteroid ? '⚠️ Hazardous' : '✅ Safe'}
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