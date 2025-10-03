"use client";

import { useState } from 'react';
import InfoAsteroids from './InfoAsteroids';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl">🌍 NASA Asteroid Tracker</span>
            </div>
            <div>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                {isOpen ? '✕ Close List' : '☄️ Show Asteroids'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sliding Panel for InfoAsteroids */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto z-20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Астероиды</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>
        <InfoAsteroids />
      </div>
    </>
  );
};

export default Navbar;