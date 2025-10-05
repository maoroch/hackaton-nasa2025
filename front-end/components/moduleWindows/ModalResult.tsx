"use client";

import { useEffect, useRef, useState } from "react";

interface GeoData {
  lat: number;
  lon: number;
  eco_name: string;
  biome: string | number;
  realm: string;
  risk_level?: string;
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

  // Debug logging for geoData
  useEffect(() => {
    if (geoData) {
      console.log("🔍 DEBUG GeoData in Modal:", {
        riskDescription: geoData.risk_description,
        riskFactors: geoData.risk_factors,
        fullData: geoData
      });
    }
  }, [geoData]);

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

  // Auto-close after 10 seconds
  useEffect(() => {
    if (isOpen) {
      setOpacity(0);
      const appearTimeout = setTimeout(() => setOpacity(1), 10);
      const fadeTimeout = setTimeout(() => setOpacity(0), 9000);
      const closeTimeout = setTimeout(() => onClose(), 10000);

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

  // Function to format risk factors (no translation needed now)
  const formatRiskFactor = (factor: string): string => {
    const formattedFactors: { [key: string]: string } = {
      'tsunamis': 'Tsunamis',
      'soil salinization': 'Soil Salinization',
      'wetland destruction': 'Wetland Destruction',
      'coastal flooding': 'Coastal Flooding',
      'earthquakes': 'Earthquakes',
      'wildfires': 'Wildfires',
      'air pollution': 'Air Pollution',
      'water contamination': 'Water Contamination',
      'ecosystem collapse': 'Ecosystem Collapse',
      'infrastructure damage': 'Infrastructure Damage',
      'crop destruction': 'Crop Destruction',
      'radiation': 'Radiation',
      'climate change': 'Climate Change',
      'biodiversity loss': 'Biodiversity Loss',
      'sea level rise': 'Sea Level Rise'
    };

    return formattedFactors[factor] || factor.charAt(0).toUpperCase() + factor.slice(1);
  };

  // Function to get icon for risk factor
  const getRiskFactorIcon = (factor: string): string => {
    const icons: { [key: string]: string } = {
      'tsunamis': '🌊',
      'soil salinization': '🏜️',
      'wetland destruction': '🪷',
      'coastal flooding': '🌧️',
      'earthquakes': '🏔️',
      'wildfires': '🔥',
      'air pollution': '💨',
      'water contamination': '💧',
      'ecosystem collapse': '🌍',
      'infrastructure damage': '🏗️',
      'crop destruction': '🌾',
      'radiation': '☢️',
      'climate change': '🌡️',
      'biodiversity loss': '🦋',
      'sea level rise': '📈'
    };

    return icons[factor] || '⚠️';
  };

  // Function to get risk description
  const getRiskDescription = (geoData: GeoData) => {
    if (geoData.risk_description) {
      return geoData.risk_description;
    }
    
    // Generate description based on risk factors
    if (geoData.risk_factors && geoData.risk_factors.length > 0) {
      const mainThreats = geoData.risk_factors.slice(0, 3).map(formatRiskFactor).join(', ');
      return `Main threats include ${mainThreats}. Asteroid impact could exacerbate these risks.`;
    }
    
    // Default description based on ecosystem type
    if (geoData.eco_name?.toLowerCase().includes('sea') || 
        geoData.eco_name?.toLowerCase().includes('ocean') || 
        geoData.biome === 'marine' || 
        geoData.realm === 'MARINE') {
      return 'Marine ecosystem: impact could cause tsunamis, water evaporation, and disruption of ocean currents.';
    }
    
    if (geoData.eco_name?.toLowerCase().includes('forest') || 
        geoData.biome?.toString().includes('forest')) {
      return 'Forest ecosystem: risk of large-scale fires, biodiversity loss, and climate change.';
    }
    
    if (geoData.eco_name?.toLowerCase().includes('urban') || 
        geoData.eco_name?.toLowerCase().includes('city')) {
      return 'Urban area: high risk of human casualties, infrastructure destruction, and economic damage.';
    }
    
    return 'Ecosystem requires further study. Impact could have unpredictable consequences for local flora and fauna.';
  };

  // Function to get default risk factors
  const getDefaultRiskFactors = (geoData: GeoData): string[] => {
    if (geoData.risk_factors && geoData.risk_factors.length > 0) {
      return geoData.risk_factors;
    }
    
    const factors = [];
    
    // Determine factors based on ecosystem type
    if (geoData.eco_name?.toLowerCase().includes('sea') || 
        geoData.eco_name?.toLowerCase().includes('ocean')) {
      factors.push('tsunamis', 'water contamination', 'ecosystem collapse');
    } else if (geoData.eco_name?.toLowerCase().includes('forest')) {
      factors.push('wildfires', 'biodiversity loss', 'air pollution');
    } else if (geoData.eco_name?.toLowerCase().includes('urban')) {
      factors.push('infrastructure damage', 'air pollution', 'water contamination');
    } else {
      factors.push('ecosystem collapse', 'soil salinization', 'biodiversity loss');
    }
    
    return factors;
  };

  if (!isOpen || !geoData) return null;

  const riskDescription = getRiskDescription(geoData);
  const riskFactors = getDefaultRiskFactors(geoData);

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
        <div className="space-y-2 text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Eco Zone:</span>
            <span className="text-white text-right max-w-[200px] truncate" title={geoData.eco_name}>
              {geoData.eco_name || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Biome:</span>
            <span className="text-white">#{geoData.biome || "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Realm:</span>
            <span className="text-white">{geoData.realm || "Unknown"}</span>
          </div>
        </div>

        {/* Impact Assessment Section */}
        <div className="mt-3 pt-3 border-t border-slate-600">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-300 font-mono">IMPACT ASSESSMENT</span>
          </div>

          {/* Possible Threats */}
          <div className="space-y-3">
            <div>
              <span className="text-slate-300 text-xs block mb-2">Potential Threats:</span>
              <div className="flex flex-wrap gap-2">
                {riskFactors.map((factor, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center space-x-1 px-3 py-2 bg-orange-500/20 text-orange-300 text-xs rounded-lg border border-orange-500/30"
                  >
                    <span className="text-sm">{getRiskFactorIcon(factor)}</span>
                    <span>{formatRiskFactor(factor)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Description */}
            <div>
              <span className="text-slate-300 text-xs block mb-2">Risk Description:</span>
              <p className="text-slate-300 text-xs leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-600/30">
                {riskDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar for auto-close */}
        <div className="mt-3 h-0.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-500 transition-all duration-10000 ease-linear"
            style={{ width: opacity * 100 + '%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Modal;