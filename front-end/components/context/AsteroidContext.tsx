// contexts/AsteroidContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Asteroid {
  id: string;
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

export interface CustomAsteroid {
  id: string;
  name: string;
  diameter: number;
  density: number;
  velocity: number;
  angle: number;
  mass_kg: number;
  kinetic_energy_joules: number;
  crater_diameter: number;
  ejecta_radius: number;
  dust_height: number;
  is_potentially_hazardous_asteroid: boolean;
  created_at: string;
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
  is_custom?: boolean;
}

export interface CustomAsteroidFormData {
  name: string;
  diameter: number;
  density: number;
  velocity: number;
  angle: number;
}

interface AsteroidContextType {
  selectedAsteroid: Asteroid | CustomAsteroid | null;
  setSelectedAsteroid: (asteroid: Asteroid | CustomAsteroid | null) => void;
  impactData: AsteroidImpactData | null;
  setImpactData: (data: AsteroidImpactData | null) => void;
  customAsteroids: CustomAsteroid[];
  addCustomAsteroid: (data: CustomAsteroidFormData, result: any) => void;
  isCustomCreatorOpen: boolean;
  setIsCustomCreatorOpen: (open: boolean) => void;
  
}

const AsteroidContext = createContext<AsteroidContextType | undefined>(undefined);

export const AsteroidProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | CustomAsteroid | null>(null);
  const [impactData, setImpactData] = useState<AsteroidImpactData | null>(null);
  const [customAsteroids, setCustomAsteroids] = useState<CustomAsteroid[]>([]);
  const [isCustomCreatorOpen, setIsCustomCreatorOpen] = useState(false);

// В контексте AsteroidContext - функция addCustomAsteroid
// contexts/AsteroidContext.tsx - функция addCustomAsteroid
// contexts/AsteroidContext.tsx - функция addCustomAsteroid
// contexts/AsteroidContext.tsx - обновите функцию addCustomAsteroid
const addCustomAsteroid = (data: CustomAsteroidFormData, result: any) => {
  console.log("🔄 addCustomAsteroid вызвана с данными:", data);
  
  const mass = (4/3) * Math.PI * Math.pow(data.diameter/2, 3) * data.density;
  const isHazardous = result.kinetic_energy > 1e12;

  const customAsteroid: CustomAsteroid = {
    id: `custom-${Date.now()}`,
    name: data.name,
    diameter: data.diameter,
    density: data.density,
    velocity: data.velocity,
    angle: data.angle,
    mass_kg: mass,
    kinetic_energy_joules: result.kinetic_energy,
    crater_diameter: result.crater_diameter,
    ejecta_radius: result.ejecta_radius,
    dust_height: result.dust_height,
    is_potentially_hazardous_asteroid: isHazardous,
    created_at: new Date().toISOString()
  };

  console.log("📦 Создан объект астероида:", customAsteroid);

  // ОБНОВЛЯЕМ СОСТОЯНИЕ СИНХРОННО
  setCustomAsteroids(prev => {
    const newAsteroids = [...prev, customAsteroid];
    console.log("📊 customAsteroids обновлен, теперь:", newAsteroids.length);
    return newAsteroids;
  });

  // УБЕДИТЕСЬ ЧТО ЭТО ВЫЗЫВАЕТСЯ
  console.log("🎯 Устанавливаем selectedAsteroid:", customAsteroid.name);
  setSelectedAsteroid(customAsteroid);

  // ПРОВЕРКА ЧЕРЕЗ 100ms
  setTimeout(() => {
    console.log("⏱️ Проверка через 100ms:");
    console.log("  - selectedAsteroid:", selectedAsteroid);
    console.log("  - customAsteroids.length:", customAsteroids.length);
  }, 100);
};
  return (
    <AsteroidContext.Provider value={{ 
      selectedAsteroid, 
      setSelectedAsteroid,
      impactData,
      setImpactData,
      customAsteroids,
      addCustomAsteroid,
      isCustomCreatorOpen,
      setIsCustomCreatorOpen
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