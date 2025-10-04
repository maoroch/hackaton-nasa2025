// Asteroid.tsx
"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

interface AsteroidProps {
  earthMesh: THREE.Mesh | null;
}

const Asteroid = ({ earthMesh }: AsteroidProps) => {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const craterRef = useRef<THREE.Mesh>(null);
  const { camera, gl, scene } = useThree();

  // Состояния для управления анимацией
  const animationState = useRef({
    isMoving: false,
    targetPoint: new THREE.Vector3(),
    startPosition: new THREE.Vector3(),
    time: 0,
    fadeStartTime: 0,
    fadeOpacity: 1
  });

  // Параметры астероида
  const params = {
    speed: 0.01,
    rotationSpeed: 0.05,
    fadeDuration: 1.0,
  };

  // Геометрия и материалы
  const asteroidGeometry = new THREE.SphereGeometry(0.3, 12, 12);
  const asteroidMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4500,
    roughness: 0.8,
    metalness: 0.2,
    transparent: true,
  });

  // Частицы
  const particleCount = 100;
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xff0000,
    size: 0.1,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const calculateStartPosition = (target: THREE.Vector3) => {
    // Стартуем с фиксированной позиции над Землей
    const start = new THREE.Vector3(15, 15, 15);
    console.log();
    return start;
  };

  const handleClick = (event: MouseEvent) => {
    if (!earthMesh) {
      console.log("❌ Earth mesh not available");
      return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObject(earthMesh);
    console.log("🎯 Intersects count:", intersects.length);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      console.log("📍 Clicked point on Earth:", point);
      
      animationState.current.targetPoint = point.clone();
      animationState.current.startPosition = calculateStartPosition(point);
      animationState.current.time = 0;
      animationState.current.fadeOpacity = 1;
      animationState.current.isMoving = true;

      if (asteroidRef.current) {
        asteroidRef.current.position.copy(animationState.current.startPosition);
        asteroidRef.current.visible = true;
        asteroidMaterial.opacity = 1;
        console.log("🌠 Asteroid positioned at start");
      }
      
      if (particlesRef.current) {
        particlesRef.current.visible = true;
        particlesMaterial.opacity = 1;
      }

      // Удаляем старый кратер
      if (craterRef.current) {
        scene.remove(craterRef.current);
        craterRef.current = null;
      }
    }
  };

  useEffect(() => {
    console.log("🔧 Asteroid component mounted");
    console.log("🌍 Earth mesh:", earthMesh);
    
    gl.domElement.addEventListener("click", handleClick);
    return () => {
      gl.domElement.removeEventListener("click", handleClick);
      if (craterRef.current) {
        scene.remove(craterRef.current);
      }
    };
  }, [gl, earthMesh, scene]);

  useFrame((state) => {
    const stateRef = animationState.current;
    
    if (!asteroidRef.current || !earthMesh) return;

    if (stateRef.isMoving) {
      stateRef.time += params.speed;
      
      console.log();
      
      if (stateRef.time <= 1) {
        // Простая линейная интерполяция
        const currentPos = new THREE.Vector3();
        currentPos.lerpVectors(stateRef.startPosition, stateRef.targetPoint, stateRef.time);
        
        asteroidRef.current.position.copy(currentPos);
        asteroidRef.current.rotation.x += params.rotationSpeed;
        asteroidRef.current.rotation.y += params.rotationSpeed;

        // Проверка столкновения - расстояние до центра Земли
        const distanceToCenter = currentPos.length();
        console.log();
        
        if (distanceToCenter < 5.5) { // Земля радиус 5 + астероид радиус 0.3
          console.log("💥 COLLISION! Creating crater");
          stateRef.isMoving = false;
          stateRef.fadeStartTime = state.clock.getElapsedTime();
          
          // Создаем простой маркер вместо кратера для теста
          const markerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
          const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.copy(stateRef.targetPoint);
          scene.add(marker);
          craterRef.current = marker;
        }

        // Эффект частиц при приближении
        if (distanceToCenter < 8 && particlesRef.current) {
          particlesRef.current.visible = true;
          const positions = particlesGeometry.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = currentPos.x + (Math.random() - 0.5) * 0.5;
            positions[i3 + 1] = currentPos.y + (Math.random() - 0.5) * 0.5;
            positions[i3 + 2] = currentPos.z + (Math.random() - 0.5) * 0.5;
          }
          particlesGeometry.attributes.position.needsUpdate = true;
        }
      } else {
        console.log("⏰ Time expired without collision");
        stateRef.isMoving = false;
        stateRef.fadeStartTime = state.clock.getElapsedTime();
      }
    }

    // Fade out после столкновения
    if (!stateRef.isMoving && stateRef.fadeOpacity > 0) {
      const elapsed = state.clock.getElapsedTime() - stateRef.fadeStartTime;
      stateRef.fadeOpacity = Math.max(0, 1 - elapsed / params.fadeDuration);
      
      asteroidMaterial.opacity = stateRef.fadeOpacity;
      particlesMaterial.opacity = stateRef.fadeOpacity;
      
      if (stateRef.fadeOpacity <= 0) {
        asteroidRef.current.visible = false;
        if (particlesRef.current) {
          particlesRef.current.visible = false;
        }
      }
    }
  });

  return (
    <>
      <mesh 
        ref={asteroidRef} 
        geometry={asteroidGeometry} 
        material={asteroidMaterial} 
        visible={false}
      />
      <points 
        ref={particlesRef} 
        geometry={particlesGeometry} 
        material={particlesMaterial} 
        visible={false}
      />
    </>
  );
};

export default Asteroid;