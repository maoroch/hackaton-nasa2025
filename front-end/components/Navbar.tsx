"use client";

import { useState } from 'react';
import InfoAsteroids from './InfoAsteroids';
import MathAsteroids from './AsteroidsMath';
import Link from 'next/link';
import { useAsteroid } from './context/AsteroidContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMathOpen, setIsMathOpen] = useState(false);
  const { selectedAsteroid } = useAsteroid();

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
            >
              <span className="text-lg font-light">🏠</span>
            </Link>

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
            >
              <span className="text-lg font-light">🌍</span>
            </Link>

            <Link
              href="/meteorites"
              className="flex items-center space-x-2 text-white/80 hover:text-cyan-300 transition-all duration-200 p-2 rounded-lg hover:bg-white/5"
            >
              <span className="text-lg font-light">☄️</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Баннер выбранного астероида */}
      {selectedAsteroid && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-cyan-900/80 backdrop-blur-sm text-white p-4 rounded-lg border border-cyan-400 z-40">
          <h3 className="font-bold text-cyan-300">✅ Выбран астероид: {selectedAsteroid.name}</h3>
          <p className="text-sm text-cyan-200">Кликните на Землю чтобы имитировать удар!</p>
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
        {/* УДАЛЕН пропс onAsteroidSelect */}
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