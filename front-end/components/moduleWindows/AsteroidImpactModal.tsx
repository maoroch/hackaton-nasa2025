// components/moduleWindows/AsteroidImpactModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";

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

interface AsteroidImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  impactData: AsteroidImpactData | null;
}

const AsteroidImpactModal = ({ isOpen, onClose, impactData }: AsteroidImpactModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [countdown, setCountdown] = useState(2);

  // Задержка перед появлением модального окна на 2 секунды
  useEffect(() => {
    if (isOpen && impactData) {
      setShowModal(false);
      setOpacity(0);
      setCountdown(2);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Show modal after 2 seconds
      const showTimeout = setTimeout(() => {
        setShowModal(true);
        setOpacity(1);
      }, 2000);

      // Auto-close after 8 seconds total (2s delay + 6s display)
      const fadeTimeout = setTimeout(() => setOpacity(0), 8000);
      const closeTimeout = setTimeout(() => {
        onClose();
        setShowModal(false);
      }, 10000);

      return () => {
        clearTimeout(showTimeout);
        clearTimeout(fadeTimeout);
        clearTimeout(closeTimeout);
        clearInterval(countdownInterval);
      };
    } else {
      setShowModal(false);
      setOpacity(0);
    }
  }, [isOpen, impactData, onClose]);

  if (!isOpen || !impactData) return null;

  return (
    <>
      {/* Countdown Overlay */}
      {!showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-red-500/30 pointer-events-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-2xl font-bold">🚀</span>
              </div>
              <h3 className="text-xl font-orbitron text-red-300 mb-4">
                IMPACT INCOMING
              </h3>
              <div className="text-4xl font-bold text-white font-space-mono mb-4">
                {countdown}
              </div>
              <p className="text-red-200 text-sm font-space-mono">
                Asteroid {impactData.name} approaching impact site...
              </p>
              <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${((2 - countdown) / 2) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Impact Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            ref={modalRef}
            className="bg-gradient-to-br from-red-900/95 via-orange-900/90 to-yellow-800/85 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl border border-red-400/20 pointer-events-auto transition-opacity duration-500 ease-in-out"
            style={{ opacity }}
          >
            {/* Explosion effect background */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute w-2 h-2 bg-yellow-300 rounded-full top-4 left-6 animate-pulse"></div>
              <div className="absolute w-2 h-2 bg-orange-400 rounded-full top-8 right-8 animate-pulse delay-200"></div>
              <div className="absolute w-2 h-2 bg-red-500 rounded-full bottom-6 left-12"></div>
              <div className="absolute w-2 h-2 bg-yellow-300 rounded-full bottom-12 right-16 animate-pulse delay-500"></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-2xl font-orbitron text-red-300 font-bold">
                    💥 IMPACT DETECTED
                  </h2>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse delay-300"></div>
                </div>
                <p className="text-red-200/80 font-space-mono text-sm">
                  {impactData.name} has impacted Earth
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-100">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div className="bg-red-900/30 rounded-lg p-4">
                    <h3 className="font-orbitron text-red-300 text-sm mb-3">IMPACT COORDINATES</h3>
                    <div className="space-y-2 font-space-mono">
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
                    <h3 className="font-orbitron text-orange-300 text-sm mb-3">ASTEROID SPECS</h3>
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
                    <h3 className="font-orbitron text-yellow-300 text-sm mb-3">ENERGY RELEASE</h3>
                    <div className="space-y-2 font-space-mono">
                      <p className="flex justify-between">
                        <span className="text-yellow-200">Kinetic Energy:</span>
                        <span className="text-white">{impactData.kinetic_energy}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-800/30 rounded-lg p-4">
                    <h3 className="font-orbitron text-red-300 text-sm mb-3">CRATER FORMATION</h3>
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

              {/* Footer with warning */}
              <div className="mt-6 pt-4 border-t border-red-500/30">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className={`font-space-mono text-xs tracking-widest ${
                    impactData.is_hazardous ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {impactData.is_hazardous ? '⚠️ EXTREME HAZARD LEVEL' : '✅ MODERATE IMPACT'}
                  </span>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
            </div>

            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-2xl border border-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)] pointer-events-none"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default AsteroidImpactModal;