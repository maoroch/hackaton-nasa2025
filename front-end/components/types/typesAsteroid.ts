// types/asteroid.ts
export interface Asteroid {
  name: string;
  date: string;
  mass_kg?: number;
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
  kinetic_energy_joules?: number;
  crater?: {
    diameter_m: number;
    dust_radius_m: number;
    dust_height_m: number;
  };
}



// Утилитные функции
export const AsteroidUtils = {
  getDiameter(asteroid: Asteroid): number {
    return asteroid.estimated_diameter.meters.estimated_diameter_min;
  },
  
  getVelocity(asteroid: Asteroid): number {
    return parseFloat(asteroid.relative_velocity.kilometers_per_second);
  },
  
  getMissDistance(asteroid: Asteroid): number {
    return parseFloat(asteroid.miss_distance.kilometers);
  },
  
  formatMass(massKg: number | undefined): string {
    if (massKg === undefined || massKg === null || isNaN(massKg)) {
      return "Неизвестно";
    }
    
    if (massKg >= 1e12) return `${(massKg / 1e12).toFixed(2)} млрд тонн`;
    if (massKg >= 1e9) return `${(massKg / 1e9).toFixed(2)} млн тонн`;
    if (massKg >= 1e6) return `${(massKg / 1e6).toFixed(2)} тыс. тонн`;
    if (massKg >= 1e3) return `${(massKg / 1e3).toFixed(2)} тонн`;
    return `${massKg.toFixed(2)} кг`;
  }
};

// types/typesAsteroid.ts
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
  // Добавляем опциональное поле для кастомных астероидов
  is_custom?: boolean;
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
  // Добавляем поле для совместимости
  is_custom?: boolean;
}


// types/typesAsteroid.ts
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
  // Добавляем опциональное поле для кастомных астероидов
  is_custom?: boolean;
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
  // Добавляем поле для совместимости
  is_custom?: boolean;
}

// Объединенный тип для работы в компонентах
export type AnyAsteroid = Asteroid | CustomAsteroid;

// Type guards для проверки типа
export const isCustomAsteroid = (asteroid: AnyAsteroid): asteroid is CustomAsteroid => {
  return 'diameter' in asteroid && 'velocity' in asteroid && 'created_at' in asteroid;
};

export const isNasaAsteroid = (asteroid: AnyAsteroid): asteroid is Asteroid => {
  return 'estimated_diameter' in asteroid && 'relative_velocity' in asteroid;
};