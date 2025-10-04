// Main.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import Asteroid from "./Asteroid";
import Modal from "./moduleWindows/ModalResult";

interface GeoData {
  lat: number;
  lon: number;
  eco_name: string;
  biome: string;
  realm: string;
}

const Earth = ({ 
  setEarthMesh, 
  onGeoDataReceived 
}: { 
  setEarthMesh: (mesh: THREE.Mesh | null) => void;
  onGeoDataReceived: (data: GeoData) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  // Загрузка текстур Земли
  const [earthTexture, bumpTexture, specularTexture] = useLoader(TextureLoader, [
    "/textures/Albedo.jpg",
    "/textures/night_lights_modified.png",
    "/textures/night_lights_modified.png",
  ]);

  // Координаты точек в формате (широта, долгота)
  const points = [
    { lat: 0, lon: 0 },   // (0,0)
    { lat: 90, lon: 0 },  // (90,0)
    { lat: 0, lon: 180 }, // (0,180)
  ];

  // Функция для конвертации географических координат в 3D координаты
  function latLonToVector3(lat: number, lon: number, radius = 5) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

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
  }, [gl, setEarthMesh, onGeoDataReceived]);

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
      {/* Добавление маркеров для каждой точки */}
      {points.map((point, index) => {
        const position = latLonToVector3(point.lat, point.lon, 5.05);
        return (
          <mesh key={index} position={position}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="red" />
          </mesh>
        );
      })}
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

  const handleGeoDataReceived = (data: GeoData) => {
    setGeoData(data);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGeoData(null);
  };

  return (
    <>
      <Canvas camera={{ position: [0, 0, 12] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 3, 5]} intensity={1} />
        <Earth 
          setEarthMesh={setEarthMesh} 
          onGeoDataReceived={handleGeoDataReceived}
        />
        <Asteroid earthMesh={earthMesh} />
        <DreiOrbitControls enableDamping={true} />
      </Canvas>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        geoData={geoData} 
      />
    </>
  );
}