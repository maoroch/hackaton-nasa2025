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
      return `${(num / 1000).toFixed(1)} km`;
    }
    return `${num.toFixed(0)} m`;
  };

  const formatMass = (massKg: number) => {
    if (massKg >= 1e9) {
      return `${(massKg / 1e9).toFixed(1)} million tons`;
    } else if (massKg >= 1e6) {
      return `${(massKg / 1e6).toFixed(1)} thousand tons`;
    } else {
      return `${(massKg / 1000).toFixed(0)} tons`;
    }
  };

  const getHazardColor = (isHazardous: boolean) => {
    return isHazardous ? 'border-red-400 bg-red-500/10' : 'border-green-400 bg-green-500/10';
  };

  const getHazardText = (isHazardous: boolean) => {
    return isHazardous ? '⚠️ HAZARDOUS' : '✅ SAFE';
  };

  const getHazardBadgeColor = (isHazardous: boolean) => {
    return isHazardous ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300';
  };

  // Function to update asteroids list from server
  const refreshAsteroidsList = async () => {
    try {
      console.log("🔄 Updating asteroids list...");
      // Here you can add logic to update list from server
      // if synchronization with server is needed
    } catch (error) {
      console.error("❌ Error updating list:", error);
    }
  };

  // Asteroid selection handler
  const handleAsteroidClick = (asteroid: CustomAsteroid) => {
    console.log("🔄 Selecting custom asteroid:", asteroid.name);
    setSelectedAsteroid(asteroid);
    
    // Additional debug information in console
    console.log("📊 Selected asteroid data:", {
      id: asteroid.id,
      name: asteroid.name,
      diameter: asteroid.diameter,
      velocity: asteroid.velocity,
      mass: formatMass(asteroid.mass_kg),
      hazardous: asteroid.is_potentially_hazardous_asteroid
    });
  };

  // Function to delete asteroid (optional)
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
        
        // If selected asteroid is deleted, reset selection
        if (selectedAsteroid?.id === asteroidId) {
          setSelectedAsteroid(null);
        }

        // You can add list update here
        alert(`✅ Asteroid "${asteroidName}" deleted!`);
      } catch (error) {
        console.error("❌ Error deleting asteroid:", error);
        alert("❌ Error deleting asteroid. Check console for details.");
      }
    }
  };

  return (
    <div className="w-80 bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-orbitron text-white">My Asteroids</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsCustomCreatorOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-orbitron transition-colors flex items-center space-x-1"
          >
            <span>+</span>
            <span>Create</span>
          </button>
          {/* Refresh button (optional) */}
          <button
            onClick={refreshAsteroidsList}
            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-orbitron transition-colors"
            title="Refresh list"
          >
            ⟳
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {customAsteroids.map((asteroid) => (
          <div
            key={asteroid.id}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all group relative ${
              selectedAsteroid?.id === asteroid.id 
                ? 'bg-white/10 scale-105' 
                : 'bg-gray-800/50 hover:bg-gray-700/50'
            } ${getHazardColor(asteroid.is_potentially_hazardous_asteroid)}`}
          >
            {/* Delete button (appears on hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent asteroid selection
                handleDeleteAsteroid(asteroid.id, asteroid.name);
              }}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete asteroid"
            >
              ×
            </button>

            <div 
              onClick={() => handleAsteroidClick(asteroid)}
              className="pr-4" // Padding for delete button
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-orbitron text-white text-sm">
                    {asteroid.name} 🛠️
                  </h3>
                  <div className="text-xs text-gray-300 mt-1 space-y-1">
                    <p>📏 Diameter: {formatNumber(asteroid.diameter)}</p>
                    <p>🚀 Velocity: {asteroid.velocity.toFixed(2)} km/s</p>
                    <p>⚖️ Mass: {formatMass(asteroid.mass_kg)}</p>
                    <p>📐 Angle: {asteroid.angle}°</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getHazardBadgeColor(asteroid.is_potentially_hazardous_asteroid)}`}>
                  {getHazardText(asteroid.is_potentially_hazardous_asteroid)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                📅 Created: {new Date(asteroid.created_at).toLocaleDateString('en-US')}
              </div>
            </div>
          </div>
        ))}
        
        {customAsteroids.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            <p>No asteroids created</p>
            <p className="text-sm mt-1">Create your first asteroid!</p>
          </div>
        )}
      </div>

      {/* Statistics at the bottom */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 flex justify-between">
          <span>Total asteroids: {customAsteroids.length}</span>
          <span>
            Hazardous: {customAsteroids.filter(a => a.is_potentially_hazardous_asteroid).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomAsteroidList;