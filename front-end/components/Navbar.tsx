"use client";

import { useState } from 'react';
import InfoAsteroids from './InfoAsteroids';
import Link from 'next/link';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 backdrop-blur-md z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl text-cyan-300 font-orbitron tracking-wide">
                  🌍 NASA Asteroid Tracker
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-inter"
              >
                Earth 3D
              </Link>
              <Link
                href="/meteorites"
                className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-inter"
              >
                Meteorites
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-inter text-sm transition-all duration-200 transform hover:scale-105"
              >
                {isOpen ? '✕ Close Asteroids' : 'Asteroid Data'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white focus:outline-none"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {isOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden bg-gray-800/90 backdrop-blur-sm py-4">
              <div className="flex flex-col space-y-4 px-4">
                <Link
                  href="/earth"
                  className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-inter"
                  onClick={() => setIsOpen(false)}
                >
                  Earth 3D
                </Link>
                <Link
                  href="/meteorites"
                  className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-inter"
                  onClick={() => setIsOpen(false)}
                >
                  Meteorites
                </Link>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 font-inter"
                  onClick={() => setIsOpen(false)}
                >
                  About Hackathon
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Sliding Panel for InfoAsteroids */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-gradient-to-b from-gray-900 to-blue-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto z-20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-sm p-4 border-b border-cyan-700/50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold font-orbitron text-cyan-300">
              Asteroid Data
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-700/50 rounded-full text-cyan-300 transition-colors duration-200"
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