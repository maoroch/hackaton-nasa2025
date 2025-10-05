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