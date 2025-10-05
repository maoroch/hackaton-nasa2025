"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import Modal from "./moduleWindows/ModalResult";
import AsteroidImpactModal from "./moduleWindows/AsteroidImpactModal";
import { useAsteroid } from './context/AsteroidContext';
import Asteroid from "./Asteroid";
import DebugInfo from './DebugInfo';
import ForceSelectAsteroid from './ForceSelectAsteroid';

interface GeoData {
  lat: number;
  lon: number;
  eco_name: string;
  biome: string;
  realm: string;
}

// Function for formatting mass
const formatMass = (massKg: number | undefined): string => {
  if (massKg === undefined || massKg === null || isNaN(massKg)) {
    return "Unknown";
  }
  
  if (massKg >= 1e12) {
    return `${(massKg / 1e12).toFixed(2)} billion tons`;
  } else if (massKg >= 1e9) {
    return `${(massKg / 1e9).toFixed(2)} million tons`;
  } else if (massKg >= 1e6) {
    return `${(massKg / 1e6).toFixed(2)} thousand tons`;
  } else if (massKg >= 1e3) {
    return `${(massKg / 1e3).toFixed(2)} tons`;
  } else {
    return `${massKg.toFixed(2)} kg`;
  }
};

// Earth component
const Earth = ({ 
  setEarthMesh
}: { 
  setEarthMesh: (mesh: THREE.Mesh | null) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  // Loading Earth textures
  const [earthTexture, bumpTexture, specularTexture] = useLoader(TextureLoader, [
    "/textures/Albedo.jpg",
    "/textures/background.jpg", // Note: Consider using a proper bump map instead
    "/textures/background.jpg", // Note: Consider using a proper specular map instead
  ]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0; // Slow Earth rotation
    }
  });

  useEffect(() => {
    setEarthMesh(meshRef.current);
  }, [setEarthMesh]);

  return (
    <>
      <mesh ref={meshRef} rotation={[0, Math.PI, 0]}>
        <sphereGeometry args={[8, 128, 128]} />
        <meshPhongMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={0.08}
          specularMap={specularTexture}
          specular={new THREE.Color("grey")}
          shininess={30}
        />
      </mesh>
    </>
  );
};

// Component for setting background
const SceneBackground = () => {
  const { scene } = useThree();
  const backgroundTexture = useLoader(TextureLoader, "/textures/background.jpg");

  useEffect(() => {
    scene.background = backgroundTexture; // Set scene background
    return () => {
      // Cleanup on unmount
      scene.background = null;
    };
  }, [scene, backgroundTexture]);

  return null;
};

function cartesianToLatLon(point: THREE.Vector3) {
  const radius = point.length();
  const earthRadius = 8;
  const normalizedPoint = point.clone().normalize().multiplyScalar(earthRadius);
  
  const lat = 90 - (Math.acos(normalizedPoint.y / earthRadius) * 180 / Math.PI);
  const lon = ((Math.atan2(normalizedPoint.z, -normalizedPoint.x) * 180 / Math.PI) + 360) % 360;
  
  return { 
    lat: parseFloat(lat.toFixed(6)), 
    lon: parseFloat(lon.toFixed(6)) 
  };
}

// Main Earth component
export default function GlobeCanvas() {
  const [earthMesh, setEarthMesh] = useState<THREE.Mesh | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const { selectedAsteroid, impactData, setImpactData } = useAsteroid();

  const handleGeoDataReceived = (data: GeoData) => {
    setGeoData(data);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGeoData(null);
  };

  const handleCloseImpactModal = () => {
    setImpactData(null);
  };

  return (
    <>
      <div className="relative w-full h-full">
        <Canvas camera={{ position: [0, 0, 18], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 5, 10]} intensity={1.2} castShadow />
          <pointLight position={[-10, -5, -10]} intensity={0.5} />
          
          <Earth setEarthMesh={setEarthMesh} />
          <SceneBackground /> {/* Add background component */}
          
          <Asteroid 
            earthMesh={earthMesh} 
            onGeoDataReceived={handleGeoDataReceived}
            setImpactData={setImpactData}
          />
          
          <DreiOrbitControls 
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={10}
            maxDistance={30}
            rotateSpeed={0.5}
          />
        </Canvas>
        <DebugInfo />
        <ForceSelectAsteroid />

        {selectedAsteroid && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-cyan-900/90 backdrop-blur-lg text-white p-4 rounded-xl border border-cyan-400/50 z-40 shadow-2xl max-w-md">
            <div className="flex items-center space-x-3">
              <div
                className="flex-shrink-0 rounded-full"
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'radial-gradient(circle at 30% 30%, #ff4500, #000)',
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                  border: '1px solid #00ffff'
                }}
              />
              <div>
                <h3 className="font-bold text-cyan-300">✅ Selected asteroid: {selectedAsteroid.name}</h3>
                <p className="text-sm text-cyan-200">Click on Earth to simulate impact!</p>
              </div>
            </div>
          </div>
        )}

        {!selectedAsteroid && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg border border-gray-600 z-40">
            <p className="text-sm">👆 Select an asteroid from the list, then click on Earth</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        geoData={geoData} 
      />

      <AsteroidImpactModal 
        isOpen={!!impactData}
        onClose={handleCloseImpactModal}
        impactData={impactData}
      />
    </>
  );
}