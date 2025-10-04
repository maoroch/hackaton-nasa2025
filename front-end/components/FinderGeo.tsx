// Globe.tsx
"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";

const Earth = () => {
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
  const phi = (90 - lat) * (Math.PI / 180); // широта
  const theta = (lon + 180) * (Math.PI / 180); // долгота +180 для текстуры
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}


  const handleClick = (event: MouseEvent) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    if (meshRef.current) {
      const intersects = raycaster.intersectObject(meshRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const latLon = cartesianToLatLon(point);
        console.log("🌍 Координаты:", latLon);

        fetch(`http://127.0.0.1:5000/geo?lat=${latLon.lat}&lon=${latLon.lon}`)
          .then(res => res.json())
          .then(data => console.log("📍 Ответ OSM:", data))
          .catch(err => console.error("Ошибка запроса:", err));
      }
    }
  };

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0; // медленное вращение Земли
    }
  });

  useEffect(() => {
    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, []);

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
const position = latLonToVector3(point.lat, point.lon, 5.05); // 5.05 вместо 5
        return (
          <mesh key={index} position={position}>
            <sphereGeometry args={[0.1, 16, 16]} /> {/* Маленькая сфера как маркер */}
            <meshBasicMaterial color="red" /> {/* Красный цвет для видимости */}
          </mesh>
        );
      })}
    </>
  );
};

function cartesianToLatLon(point: THREE.Vector3) {
  const radius = point.length();
  const lat = 90 - (Math.acos(point.y / radius) * 180 / Math.PI);
  const lon = Math.atan2(point.z, -point.x) * 180 / Math.PI; // минус для x
  return { lat, lon };
}


export default function GlobeCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 12] }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <Earth />
      <DreiOrbitControls enableDamping={true} />
    </Canvas>
  );
}