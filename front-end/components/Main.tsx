// Main.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import Asteroid from "./Asteroid";
import Modal from "./moduleWindows/ModalResult";
import AsteroidImpactModal from "./moduleWindows/AsteroidImpactModal";
import { useAsteroid } from './context/AsteroidContext';

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

const Earth = ({ 
  setEarthMesh, 
  onGeoDataReceived
}: { 
  setEarthMesh: (mesh: THREE.Mesh | null) => void;
  onGeoDataReceived: (data: GeoData) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const { selectedAsteroid, setImpactData } = useAsteroid(); // Используем контекст

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  // Загрузка текстур Земли
  const [earthTexture, bumpTexture, specularTexture] = useLoader(TextureLoader, [
    "/textures/Albedo.jpg",
    "/textures/night_lights_modified.png",
    "/textures/night_lights_modified.png",
  ]);

  const handleClick = async (event: MouseEvent) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    if (meshRef.current) {
      const intersects = raycaster.intersectObject(meshRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const latLon = cartesianToLatLon(point);
        console.log("🌍 Координаты:", latLon);

        // Если выбран астероид, показываем модальное окно удара
        if (selectedAsteroid) {
          const impactData = {
            name: selectedAsteroid.name,
            coordinates: latLon,
            mass: formatMass(selectedAsteroid.mass_kg),
            diameter: `${selectedAsteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} м`,
            velocity: `${parseFloat(selectedAsteroid.relative_velocity.kilometers_per_second).toFixed(2)} км/с`,
            kinetic_energy: selectedAsteroid.kinetic_energy_joules ? 
              `${selectedAsteroid.kinetic_energy_joules.toExponential(2)} Дж` : "Неизвестно",
            crater: selectedAsteroid.crater ? {
              diameter: `${selectedAsteroid.crater.diameter_m.toFixed(1)} м`,
              dust_radius: `${selectedAsteroid.crater.dust_radius_m.toFixed(1)} м`, 
              dust_height: `${selectedAsteroid.crater.dust_height_m.toFixed(1)} м`
            } : {
              diameter: "Неизвестно",
              dust_radius: "Неизвестно", 
              dust_height: "Неизвестно"
            },
            is_hazardous: selectedAsteroid.is_potentially_hazardous_asteroid
          };
          
          // Устанавливаем данные для модального окна удара
          setImpactData(impactData);
        }

        try {
          const response = await fetch(`http://127.0.0.1:5000/geo?lat=${latLon.lat}&lon=${latLon.lon}`);
          const data = await response.json();
          console.log("📍 Ответ OSM:", data);
          
          // Передаем данные в модальное окно
          onGeoDataReceived({
            lat: latLon.lat,
            lon: latLon.lon,
            eco_name: data.eco_name || "Unknown",
            biome: data.biome || "Unknown",
            realm: data.realm || "Unknown"
          });
        } catch (err) {
          console.error("Ошибка запроса:", err);
          // В случае ошибки показываем модалку с базовыми данными
          onGeoDataReceived({
            lat: latLon.lat,
            lon: latLon.lon,
            eco_name: "Data not available",
            biome: "Data not available",
            realm: "Data not available"
          });
        }
      }
    }
  };

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0; // Медленное вращение Земли
    }
  });

  useEffect(() => {
    setEarthMesh(meshRef.current);
    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [gl, setEarthMesh, onGeoDataReceived, selectedAsteroid, setImpactData]);

  return (
    <>
      <mesh ref={meshRef} rotation={[0, Math.PI, 0]}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshPhongMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={0.05}
          specularMap={specularTexture}
          specular={new THREE.Color("grey")}
        />
      </mesh>
    </>
  );
};

function cartesianToLatLon(point: THREE.Vector3) {
  const radius = point.length();
  const lat = 90 - (Math.acos(point.y / radius) * 180 / Math.PI);
  const lon = Math.atan2(point.z, -point.x) * 180 / Math.PI;
  return { lat, lon };
}

export default function GlobeCanvas() {
  const [earthMesh, setEarthMesh] = useState<THREE.Mesh | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const { selectedAsteroid, impactData, setImpactData } = useAsteroid(); // Используем контекст

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
      <Canvas camera={{ position: [0, 0, 12] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 3, 5]} intensity={1} />
        <Earth 
          setEarthMesh={setEarthMesh} 
          onGeoDataReceived={handleGeoDataReceived}
          // selectedAsteroid больше не передаем как пропс - используем контекст
        />
        <Asteroid earthMesh={earthMesh} />
        <DreiOrbitControls enableDamping={true} />
      </Canvas>

      {/* Модальное окно с геоданными */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        geoData={geoData} 
      />

      {/* Новое модальное окно с информацией об ударе */}
      <AsteroidImpactModal 
        isOpen={!!impactData}
        onClose={handleCloseImpactModal}
        impactData={impactData}
      />

      {/* Баннер выбранного астероида */}
      {selectedAsteroid && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-cyan-900/80 backdrop-blur-sm text-white p-4 rounded-lg border border-cyan-400 z-40">
          <h3 className="font-bold text-cyan-300">✅ Выбран астероид: {selectedAsteroid.name}</h3>
          <p className="text-sm text-cyan-200">Кликните на Землю чтобы имитировать удар!</p>
        </div>
      )}
    </>
  );
}