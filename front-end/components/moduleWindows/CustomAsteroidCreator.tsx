// components/moduleWindows/CustomAsteroidCreator.tsx
"use client";

import { useState, useEffect } from "react";

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

interface CustomAsteroidCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAsteroid: (data: CustomAsteroidData, result: ImpactResult) => void;
}

const CustomAsteroidCreator = ({ isOpen, onClose, onCreateAsteroid }: CustomAsteroidCreatorProps) => {
  const [formData, setFormData] = useState<CustomAsteroidData>({
    name: "",
    diameter: 100,
    density: 3000,
    velocity: 17,
    angle: 45
  });

  const [impactResult, setImpactResult] = useState<ImpactResult | null>(null);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.8);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Asteroid size visualization calculation
  const getAsteroidSize = (diameter: number) => {
    const minDiameter = 1;
    const maxDiameter = 1000;
    const minSize = 20;
    const maxSize = 120;
    
    const logMin = Math.log(minDiameter);
    const logMax = Math.log(maxDiameter);
    const logValue = Math.log(Math.max(diameter, minDiameter));
    
    const normalized = (logValue - logMin) / (logMax - logMin);
    return minSize + normalized * (maxSize - minSize);
  };

  // Color calculation based on size and density
  const getAsteroidColor = (diameter: number, density: number) => {
    const sizeFactor = Math.min(diameter / 500, 1);
    const densityFactor = Math.min((density - 1000) / 7000, 1);
    
    const red = Math.floor(150 + sizeFactor * 105);
    const green = Math.floor(100 + (1 - sizeFactor) * 100);
    const blue = Math.floor(80 + (1 - densityFactor) * 100);
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  // Calculations when parameters change
  useEffect(() => {
    if (isOpen) {
      calculateImpact();
    }
  }, [formData, isOpen]);

  // Appearance animation
  useEffect(() => {
    if (isOpen) {
      setOpacity(1);
      setScale(1);
    } else {
      setOpacity(0);
      setScale(0.8);
    }
  }, [isOpen]);

  const calculateImpact = () => {
    const { diameter, density, velocity, angle } = formData;
    
    // Mass calculation (sphere)
    const radius = diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const mass = volume * density;
    
    // Kinetic energy (0.5 * m * v^2)
    const kinetic_energy = 0.5 * mass * Math.pow(velocity * 1000, 2);
    
    // Impact angle consideration
    const angleFactor = Math.sin(angle * Math.PI / 180);
    
    // Crater calculation
    const crater_diameter = diameter * 20 * angleFactor;
    const ejecta_radius = crater_diameter * 1.2;
    const dust_height = crater_diameter * 0.1;
    
    setImpactResult({
      kinetic_energy,
      crater_diameter,
      ejecta_radius,
      dust_height
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && impactResult) {
      setIsSubmitting(true);
      
      try {
        console.log("🚀 Sending data to server:", formData);
        
        // Send data to Flask server
        const response = await fetch("http://127.0.0.1:5000/api/asteroids/custom", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
        }

        const result = await response.json();
        console.log("✅ Asteroid created on server:", result.asteroid);
        
        // Call callback with data
        onCreateAsteroid(formData, impactResult);
        
        // Show success message
        console.log(`✅ Asteroid "${formData.name}" created and saved on server!`);
        
        // Close modal window
        onClose();
        
      } catch (error) {
        console.error("❌ Error creating asteroid:", error);
        console.log (`❌ Error creating asteroid: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (field: keyof CustomAsteroidData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const asteroidSize = getAsteroidSize(formData.diameter);
  const asteroidColor = getAsteroidColor(formData.diameter, formData.density);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ease-in-out pointer-events-auto"
        style={{ opacity: opacity * 0.5 }}
        onClick={onClose}
      />
      
      {/* Main modal window */}
      <div
        className="bg-gradient-to-br from-blue-900/95 via-purple-900/90 to-indigo-800/85 backdrop-blur-xl rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl border border-blue-400/20 pointer-events-auto relative transition-all duration-500 ease-out"
        style={{ 
          opacity,
          transform: `scale(${scale}) translateY(${(1 - scale) * 20}px)`
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-2 h-2 bg-blue-300 rounded-full top-4 left-6 animate-pulse"></div>
          <div className="absolute w-2 h-2 bg-purple-400 rounded-full top-8 right-8 animate-pulse delay-200"></div>
          <div className="absolute w-2 h-2 bg-indigo-500 rounded-full bottom-6 left-12"></div>
          <div className="absolute w-2 h-2 bg-blue-300 rounded-full bottom-12 right-16 animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-orbitron text-blue-300 font-bold">
                🚀 CREATE ASTEROID
              </h2>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-300"></div>
            </div>
            <p className="text-blue-200/80 font-space-mono text-sm">
              Configure parameters and see the impact results
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Visualization */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-blue-900/30 rounded-lg p-6 w-full text-center">
                  <h3 className="font-orbitron text-blue-300 text-sm mb-4">VISUALIZATION</h3>
                  
                  {/* Asteroid */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div
                      className="rounded-full relative shadow-2xl transition-all duration-500 ease-out"
                      style={{
                        width: `${asteroidSize}px`,
                        height: `${asteroidSize}px`,
                        background: `radial-gradient(circle at 30% 30%, ${asteroidColor}, ${asteroidColor}dd)`,
                        boxShadow: `
                          inset -${asteroidSize * 0.1}px -${asteroidSize * 0.05}px ${asteroidSize * 0.2}px rgba(255,255,255,0.3),
                          inset ${asteroidSize * 0.1}px ${asteroidSize * 0.05}px ${asteroidSize * 0.2}px rgba(0,0,0,0.5),
                          0 0 ${asteroidSize * 0.3}px ${asteroidColor}80
                        `
                      }}
                    >
                      {/* Surface craters */}
                      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gray-800/50 rounded-full"></div>
                      <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-gray-900/60 rounded-full"></div>
                      <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-gray-700/40 rounded-full"></div>
                    </div>
                    
                    {/* Size information */}
                    <div className="text-center">
                      <p className="text-blue-200 font-space-mono text-sm">
                        Diameter: <span className="text-white">{formData.diameter} m</span>
                      </p>
                      <p className="text-blue-200 font-space-mono text-sm">
                        Scale: 1:{Math.round(1000 / asteroidSize)}
                      </p>
                    </div>
                  </div>

                  {/* Comparative scale */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs text-blue-300">
                      <span>Small</span>
                      <span>Medium</span>
                      <span>Large</span>
                    </div>
                    <div className="w-full bg-blue-800/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(Math.log(formData.diameter) / Math.log(1000)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-blue-300">
                      <span>10 m</span>
                      <span>100 m</span>
                      <span>1 km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Central column - Parameters */}
              <div className="space-y-4">
                {/* Name */}
                <div className="bg-blue-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-blue-300 text-sm mb-3">ASTEROID NAME</h3>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter name..."
                    className="w-full bg-blue-800/20 border border-blue-600/30 rounded-lg px-3 py-2 text-white font-space-mono placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Diameter */}
                <div className="bg-purple-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-purple-300 text-sm mb-3">
                    DIAMETER: {formData.diameter} m
                  </h3>
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    value={formData.diameter}
                    onChange={(e) => handleInputChange('diameter', parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-800/20 rounded-lg appearance-none cursor-pointer slider"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-purple-200 mt-2">
                    <span>1 m</span>
                    <span>1000 m</span>
                  </div>
                </div>

                {/* Density */}
                <div className="bg-indigo-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-indigo-300 text-sm mb-3">
                    DENSITY: {formData.density} kg/m³
                  </h3>
                  <input
                    type="range"
                    min="1000"
                    max="8000"
                    step="100"
                    value={formData.density}
                    onChange={(e) => handleInputChange('density', parseInt(e.target.value))}
                    className="w-full h-2 bg-indigo-800/20 rounded-lg appearance-none cursor-pointer slider"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-indigo-200 mt-2">
                    <span>1000 kg/m³</span>
                    <span>8000 kg/m³</span>
                  </div>
                  <p className="text-xs text-indigo-300/70 mt-2">
                    {formData.density < 2000 ? 'Light (ice)' : 
                     formData.density < 4000 ? 'Medium (stone)' : 
                     formData.density < 6000 ? 'Heavy (metal)' : 'Very heavy'}
                  </p>
                </div>
              </div>

              {/* Right column - Parameters and results */}
              <div className="space-y-4">
                {/* Velocity */}
                <div className="bg-blue-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-blue-300 text-sm mb-3">
                    VELOCITY: {formData.velocity} km/s
                  </h3>
                  <input
                    type="range"
                    min="1"
                    max="72"
                    value={formData.velocity}
                    onChange={(e) => handleInputChange('velocity', parseInt(e.target.value))}
                    className="w-full h-2 bg-blue-800/20 rounded-lg appearance-none cursor-pointer slider"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-blue-200 mt-2">
                    <span>1 km/s</span>
                    <span>72 km/s</span>
                  </div>
                  <p className="text-xs text-blue-300/70 mt-2">
                    {formData.velocity < 10 ? 'Slow' : 
                     formData.velocity < 30 ? 'Medium' : 
                     formData.velocity < 50 ? 'High' : 'Very high'}
                  </p>
                </div>

                {/* Impact angle */}
                <div className="bg-purple-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-purple-300 text-sm mb-3">
                    IMPACT ANGLE: {formData.angle}°
                  </h3>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={formData.angle}
                    onChange={(e) => handleInputChange('angle', parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-800/20 rounded-lg appearance-none cursor-pointer slider"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-purple-200 mt-2">
                    <span>15°</span>
                    <span>90°</span>
                  </div>
                  <p className="text-xs text-purple-300/70 mt-2">
                    {formData.angle === 90 ? 'Vertical impact' : 
                     formData.angle >= 60 ? 'Steep angle' :
                     formData.angle >= 30 ? 'Medium angle' : 'Shallow angle'}
                  </p>
                </div>

                {/* Preliminary results */}
                {impactResult && (
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-800/30 rounded-lg p-4 border border-green-500/20">
                    <h3 className="font-orbitron text-green-300 text-sm mb-3">PRELIMINARY CALCULATION</h3>
                    <div className="space-y-2 font-space-mono text-sm">
                      <p className="flex justify-between">
                        <span className="text-green-200">Kinetic energy:</span>
                        <span className="text-white">{impactResult.kinetic_energy.toExponential(2)} J</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-green-200">Crater diameter:</span>
                        <span className="text-white">{impactResult.crater_diameter.toFixed(1)} m</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed results */}
            {impactResult && (
              <div className="bg-gradient-to-r from-amber-900/30 to-orange-800/30 rounded-lg p-4 border border-amber-500/20">
                <h3 className="font-orbitron text-amber-300 text-sm mb-3">DETAILED IMPACT RESULTS</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-space-mono text-sm">
                  <div className="text-center">
                    <p className="text-amber-200">Kinetic energy</p>
                    <p className="text-white text-lg">{impactResult.kinetic_energy.toExponential(2)} J</p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-200">Crater</p>
                    <p className="text-white text-lg">{impactResult.crater_diameter.toFixed(1)} m</p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-200">Ejecta radius</p>
                    <p className="text-white text-lg">{impactResult.ejecta_radius.toFixed(1)} m</p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-200">Dust height</p>
                    <p className="text-white text-lg">{impactResult.dust_height.toFixed(1)} m</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 font-orbitron py-3 rounded-lg border border-gray-600/30 transition-all duration-200 hover:border-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim() || isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-orbitron py-3 rounded-lg border border-blue-400/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    CREATING...
                  </>
                ) : (
                  'CREATE ASTEROID'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl border border-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default CustomAsteroidCreator;