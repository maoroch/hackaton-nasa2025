// modalWindow/ModalResult.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface GeoData {
  lat: number;
  lon: number;
  eco_name: string;
  biome: string;
  realm: string;
  risk_level?: string;  // "high", "medium", "low", "unknown"
  risk_description?: string;
  risk_factors?: string[];
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  geoData: GeoData | null;
}

const Modal = ({ isOpen, onClose, geoData }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(0);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const canvas = document.querySelector("canvas");
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        canvas &&
        !canvas.contains(event.target as Node)
      ) {
        event.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Auto-close after 5 seconds
  useEffect(() => {
    if (isOpen) {
      setOpacity(0);
      const appearTimeout = setTimeout(() => setOpacity(1), 10);
      const fadeTimeout = setTimeout(() => setOpacity(0), 4000);
      const closeTimeout = setTimeout(() => onClose(), 5000);

      return () => {
        clearTimeout(appearTimeout);
        clearTimeout(fadeTimeout);
        clearTimeout(closeTimeout);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setOpacity(0);
  }, [isOpen]);

  if (!isOpen || !geoData) return null;

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50 pointer-events-none">
      <div
        ref={modalRef}
        className="bg-slate-900/95 backdrop-blur-md rounded-xl p-4 max-w-md w-full mx-4 shadow-lg border border-slate-600/50 pointer-events-auto transition-opacity duration-300 ease-in-out mb-4"
        style={{ opacity }}
      >
        {/* Header with coordinates */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-300 font-mono">LOCATION DATA</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs"
          >
            ✕
          </button>
        </div>

        {/* Coordinates row */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <div className="flex items-center">
            <span className="text-slate-400 font-mono mr-2">LAT:</span>
            <span className="text-white font-medium">{geoData.lat.toFixed(4)}</span>
          </div>
          <div className="flex items-center">
            <span className="text-slate-400 font-mono mr-2">LON:</span>
            <span className="text-white font-medium">{geoData.lon.toFixed(4)}</span>
          </div>
        </div>

        {/* Ecological data */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Eco Zone:</span>
            <span className="text-white text-right max-w-[200px] truncate" title={geoData.eco_name}>
              {geoData.eco_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Biome:</span>
            <span className="text-white">{geoData.biome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Realm:</span>
            <span className="text-white">{geoData.realm}</span>
          </div>
        </div>

        {/* Progress bar for auto-close */}
        <div className="mt-3 h-0.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-500 transition-all duration-5000 ease-linear"
            style={{ width: opacity * 100 + '%' }}
          />
        </div>
      </div>
      // В JSX модала, после ecological data
{geoData.risk_level && (
  <div className="mt-3 pt-3 border-t border-slate-600">
    <div className="flex items-center space-x-2 mb-2">
      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
      <span className="text-xs text-slate-300 font-mono">CLIMATE RISKS</span>
    </div>
    <div className="space-y-1 text-xs">
      <div className="flex justify-between">
        <span className="text-slate-400">Risk Level:</span>
        <span className={`font-medium ${
          geoData.risk_level === 'high' ? 'text-red-400' : 
          geoData.risk_level === 'medium' ? 'text-yellow-400' : 'text-green-400'
        }`}>
          {geoData.risk_level.toUpperCase()}
        </span>
      </div>
      <p className="text-slate-300 text-left">{geoData.risk_description}</p>
      {geoData.risk_factors && geoData.risk_factors.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {geoData.risk_factors.map((factor, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-700 text-xs rounded">
              {factor}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
};

export default Modal;