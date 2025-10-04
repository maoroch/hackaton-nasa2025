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