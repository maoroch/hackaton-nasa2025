"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import Modal from "./moduleWindows/ModalResult"; // Импортируем оригинальный Modal
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

// Утилиты для размера астероида
const getAsteroidDisplaySize = (diameterMeters: number): number => {
  const minRealSize = 1;
  const maxRealSize = 1000;
  const minDisplaySize = 0.1;
  const maxDisplaySize = 2;
  
  const logMin = Math.log(minRealSize);
  const logMax = Math.log(maxRealSize);
  const logValue = Math.log(Math.max(diameterMeters, minRealSize));
  
  const normalized = (logValue - logMin) / (logMax - logMin);
  return minDisplaySize + normalized * (maxDisplaySize - minDisplaySize);
};

const getAsteroidColor = (diameter: number, isHazardous: boolean): string => {
  const sizeFactor = Math.min(diameter / 500, 1);
  
  if (isHazardous) {
    return `rgb(${200 + Math.floor(sizeFactor * 55)}, ${100 - Math.floor(sizeFactor * 80)}, ${100 - Math.floor(sizeFactor * 80)})`;
  } else {
    return `rgb(${100 + Math.floor(sizeFactor * 50)}, ${150 + Math.floor(sizeFactor * 50)}, ${200 - Math.floor(sizeFactor * 50)})`;
  }
};

// Компонент астероида в Three.js сцене
const Asteroid = ({ earthMesh }: { earthMesh: THREE.Mesh | null }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { selectedAsteroid } = useAsteroid();
  
  useFrame((state) => {
    if (meshRef.current && selectedAsteroid && earthMesh) {
      // Позиционируем астероид над Землей
      const time = state.clock.getElapsedTime();
      const radius = 12; // Увеличиваем радиус орбиты для большей Земли
      
      meshRef.current.position.x = Math.cos(time * 0.5) * radius;
      meshRef.current.position.z = Math.sin(time * 0.5) * radius;
      meshRef.current.position.y = Math.sin(time * 0.3) * 3;
      
      meshRef.current.rotation.x = time * 0.5;
      meshRef.current.rotation.y = time * 0.3;
    }
  });

  if (!selectedAsteroid) return null;

  const displaySize = getAsteroidDisplaySize(
    selectedAsteroid.estimated_diameter.meters.estimated_diameter_min
  );
  const asteroidColor = getAsteroidColor(
    selectedAsteroid.estimated_diameter.meters.estimated_diameter_min,
    selectedAsteroid.is_potentially_hazardous_asteroid
  );

  // Конвертируем цвет из RGB строки в THREE.Color
  const threeColor = new THREE.Color(asteroidColor);

  return (
    <mesh ref={meshRef} scale={displaySize}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        color={threeColor}
        roughness={0.7}
        metalness={0.3}
        emissive={threeColor}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

// Компонент Земли
const Earth = ({ 
  setEarthMesh, 
  onGeoDataReceived
}: { 
  setEarthMesh: (mesh: THREE.Mesh | null) => void;
  onGeoDataReceived: (data: GeoData) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const { selectedAsteroid, setImpactData } = useAsteroid();

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
        console.log("🌍 Координаты удара:", latLon);

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

        // Получаем геоданные
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
      meshRef.current.rotation.y += 0.001; // Медленное вращение Земли
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
        {/* УВЕЛИЧИВАЕМ РАЗМЕР ЗЕМЛИ С 5 ДО 8 */}
        <sphereGeometry args={[8, 128, 128]} /> {/* Увеличили радиус и детализацию */}
        <meshPhongMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={0.08} // Увеличили рельеф для большей Земли
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
  // Для правильного расчета координат учитываем увеличенный радиус Земли
  const earthRadius = 8; // Должно совпадать с радиусом в sphereGeometry
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
        {/* УВЕЛИЧИВАЕМ РАССТОЯНИЕ КАМЕРЫ ДЛЯ БОЛЬШОЙ ЗЕМЛИ */}
        <Canvas camera={{ position: [0, 0, 18], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 5, 10]} intensity={1.2} castShadow />
          <pointLight position={[-10, -5, -10]} intensity={0.5} />
          
          <Earth 
            setEarthMesh={setEarthMesh} 
            onGeoDataReceived={handleGeoDataReceived}
          />
          <Asteroid earthMesh={earthMesh} />
          
          {/* Настраиваем контролы для большей Земли */}
          <DreiOrbitControls 
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={10}  // Минимальное расстояние до Земли
            maxDistance={30}  // Максимальное расстояние
            rotateSpeed={0.5} // Скорость вращения
          />
        </Canvas>

        {/* Баннер выбранного астероида */}
        {selectedAsteroid && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-cyan-900/90 backdrop-blur-lg text-white p-4 rounded-xl border border-cyan-400/50 z-40 shadow-2xl max-w-md">
            <div className="flex items-center space-x-3">
              {/* Визуализация астероида */}
              <div
                className="flex-shrink-0 rounded-full"
                style={{
                  width: '24px',
                  height: '24px',
                  background: `radial-gradient(circle at 30% 30%, ${getAsteroidColor(
                    selectedAsteroid.estimated_diameter.meters.estimated_diameter_min,
                    selectedAsteroid.is_potentially_hazardous_asteroid
                  )}, #000)`,
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

        {/* Инструкция */}
        {!selectedAsteroid && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg border border-gray-600 z-40">
            <p className="text-sm">👆 Выберите астероид из списка, затем кликните на Землю</p>
          </div>
        )}
      </div>

      {/* Модальное окно с геоданными - ИСПОЛЬЗУЕМ ОРИГИНАЛЬНЫЙ КОМПОНЕНТ Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        geoData={geoData} 
      />

      {/* Модальное окно с информацией об ударе */}
      <AsteroidImpactModal 
        isOpen={!!impactData}
        onClose={handleCloseImpactModal}
        impactData={impactData}
      />
    </>
  );
}