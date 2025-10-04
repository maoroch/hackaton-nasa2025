// contexts/AsteroidContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Asteroid {
  name: string;
  date: string;
  estimated_diameter: {
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  relative_velocity: {
    kilometers_per_second: string;
  };
  miss_distance: {
    kilometers: string;
  };
  is_potentially_hazardous_asteroid: boolean;
  mass_kg?: number;
  kinetic_energy_joules?: number;
  crater?: {
    diameter_m: number;
    dust_radius_m: number;
    dust_height_m: number;
  };
}

export interface AsteroidImpactData {
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

interface AsteroidContextType {
  selectedAsteroid: Asteroid | null;
  setSelectedAsteroid: (asteroid: Asteroid | null) => void;
  impactData: AsteroidImpactData | null;
  setImpactData: (data: AsteroidImpactData | null) => void;
}

const AsteroidContext = createContext<AsteroidContextType | undefined>(undefined);

export const AsteroidProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);
  const [impactData, setImpactData] = useState<AsteroidImpactData | null>(null);

  return (
    <AsteroidContext.Provider value={{ 
      selectedAsteroid, 
      setSelectedAsteroid,
      impactData,
      setImpactData 
    }}>
      {children}
    </AsteroidContext.Provider>
  );
};

export const useAsteroid = () => {
  const context = useContext(AsteroidContext);
  if (context === undefined) {
    throw new Error('useAsteroid must be used within an AsteroidProvider');
  }
  return context;
};