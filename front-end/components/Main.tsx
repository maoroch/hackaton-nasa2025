// Earth.tsx - УДАЛЯЕМ обработчик клика из Earth
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

interface GeoData {
  lat: number;
  lon: number;
  eco_name: string;
  biome: string;
  realm: string;
}

// Функция для форматирования массы
const formatMass = (massKg: number | undefined): string => {
  if (massKg === undefined || massKg === null || isNaN(massKg)) {
    return "Неизвестно";
  }
  
  if (massKg >= 1e12) {
    return `${(massKg / 1e12).toFixed(2)} млрд тонн`;
  } else if (massKg >= 1e9) {
    return `${(massKg / 1e9).toFixed(2)} млн тонн`;
  } else if (massKg >= 1e6) {
    return `${(massKg / 1e6).toFixed(2)} тыс. тонн`;
  } else if (massKg >= 1e3) {
    return `${(massKg / 1e3).toFixed(2)} тонн`;
  } else {
    return `${massKg.toFixed(2)} кг`;
  }
};

// Компонент Земли - БЕЗ обработчика клика
const Earth = ({ 
  setEarthMesh
}: { 
  setEarthMesh: (mesh: THREE.Mesh | null) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  // Загрузка текстур Земли
  const [earthTexture, bumpTexture, specularTexture] = useLoader(TextureLoader, [
    "/textures/Albedo.jpg",
    "/textures/night_lights_modified.png",
    "/textures/night_lights_modified.png",
  ]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0; // Медленное вращение Земли
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

// Главный компонент Earth
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
          
          {/* Передаем earthMesh и onGeoDataReceived в Asteroid */}
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

        {/* Баннер выбранного астероида */}
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
                <h3 className="font-bold text-cyan-300">✅ Выбран астероид: {selectedAsteroid.name}</h3>
                <p className="text-sm text-cyan-200">Кликните на Землю чтобы имитировать удар!</p>
              </div>
            </div>
          </div>
        )}

        {!selectedAsteroid && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg border border-gray-600 z-40">
            <p className="text-sm">👆 Выберите астероид из списка, затем кликните на Землю</p>
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