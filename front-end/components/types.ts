// types.ts
import * as THREE from "three";

export interface GeoData {
  lat: number;
  lon: number;
  eco_name: string;
  biome: string;
  realm: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  geoData: GeoData | null;
}

export interface AsteroidProps {
  earthMesh: THREE.Mesh | null;
}


export interface AsteroidProps {
  earthMesh: THREE.Mesh | null;
  targetPoint: THREE.Vector3 | null;
}