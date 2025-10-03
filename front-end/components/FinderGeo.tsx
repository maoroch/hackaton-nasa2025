// Globe.tsx
"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

const Earth = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  // Загрузка текстур Земли
  const [earthTexture, bumpTexture, specularTexture] = useLoader(TextureLoader, [
    "/textures/Albedo.jpg",
    "textures/night_lights_modified.png"    
  ]);

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
      meshRef.current.rotation.y += 0.001; // медленное вращение Земли
    }
  });

  useEffect(() => {
    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[5, 64, 64]} />
      <meshPhongMaterial
        map={earthTexture}
        bumpMap={bumpTexture}
        bumpScale={0.05}
        specularMap={specularTexture}
        specular={new THREE.Color("grey")}
      />
    </mesh>
  );
};

function cartesianToLatLon(point: THREE.Vector3) {
  const radius = Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2);
  const lat = Math.asin(point.y / radius) * (180 / Math.PI);
  const lon = Math.atan2(point.z, point.x) * (180 / Math.PI);
  return { lat, lon };
}

export default function GlobeCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 12] }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <Earth />
    </Canvas>
  );
}
