// Asteroid.tsx
"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { useAsteroid } from './context/AsteroidContext';

interface AsteroidProps {
  earthMesh: THREE.Mesh | null;
}

const Asteroid = ({ earthMesh }: AsteroidProps) => {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { selectedAsteroid } = useAsteroid();
  const { camera, gl, scene } = useThree();

  // Загрузка текстур
  const [rockTexture, rockNormal, rockRoughness] = useLoader(THREE.TextureLoader, [
    '/textures/asteroid/rock_diffuse.jpg',
    '/textures/asteroid/rock_normal.jpg',
    '/textures/asteroid/rock_roughness.jpg'
  ]);

  // Состояния для управления анимацией
  const animationState = useRef({
    isMoving: false,
    targetPoint: new THREE.Vector3(),
    startPosition: new THREE.Vector3(),
    time: 0,
    fadeStartTime: 0,
    fadeOpacity: 1,
    impactForce: 1,
    rotationAxis: new THREE.Vector3()
  });

  // Параметры астероида
  const params = {
    speed: 0.008,
    rotationSpeed: 0.02,
    fadeDuration: 2.0,
    trailLength: 50,
    heatIntensity: 2.0
  };

  // Создаем реалистичную геометрию астероида с неровностями
  const asteroidGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    
    // Добавляем случайные неровности для реалистичности
    const positionAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      
      // Случайное смещение вершин для создания неровной поверхности
      const noise = 0.1 + Math.random() * 0.2;
      vertex.multiplyScalar(1 + noise * 0.3);
      
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  // Основной материал астероида
  const asteroidMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: rockTexture,
    normalMap: rockNormal,
    roughnessMap: rockRoughness,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    emissive: new THREE.Color(0x222222),
    emissiveIntensity: 0.1
  }), [rockTexture, rockNormal, rockRoughness]);

  // Материал для свечения при нагреве
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xff4500,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  }), []);

  // Создаем геометрию для частиц хвоста
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(params.trailLength * 3);
    const colors = new Float32Array(params.trailLength * 3);
    const sizes = new Float32Array(params.trailLength);

    for (let i = 0; i < params.trailLength; i++) {
      const i3 = i * 3;
      // Начальные позиции будут обновляться
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      
      // Цвет от оранжевого к красному
      colors[i3] = 1.0;     // R
      colors[i3 + 1] = 0.5; // G
      colors[i3 + 2] = 0.0; // B
      
      // Размер уменьшается к концу хвоста
      sizes[i] = 0.05 * (1 - i / params.trailLength);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, [params.trailLength]);

  // Материал для частиц хвоста
  const trailMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    opacity: 0.8
  }), []);

  // Геометрия для пыли при ударе
  const dustGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(200 * 3);
    const velocities = new Float32Array(200 * 3);
    
    for (let i = 0; i < 200; i++) {
      const i3 = i * 3;
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      
      // Случайные начальные скорости
      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = Math.random() * 0.3;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData.velocities = velocities;
    
    return geometry;
  }, []);

  // Материал для пыли
  const dustMaterial = useMemo(() => new THREE.PointsMaterial({
    color: 0x888888,
    size: 0.03,
    transparent: true,
    opacity: 0.7,
    blending: THREE.NormalBlending
  }), []);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const trailPositions = useRef(new Float32Array(params.trailLength * 3));

  const calculateStartPosition = (target: THREE.Vector3) => {
    // Стартуем с фиксированной позиции над Землей с учетом размера астероида
    const start = new THREE.Vector3(20, 15, 15);
    
    // Случайная ось вращения для реалистичности
    animationState.current.rotationAxis.set(
      Math.random() - 0.5,
      Math.random() - 0.5, 
      Math.random() - 0.5
    ).normalize();
    
    return start;
  };

  const updateTrail = (currentPos: THREE.Vector3) => {
    if (!particlesRef.current) return;

    // Сдвигаем все позиции хвоста
    for (let i = params.trailLength - 1; i > 0; i--) {
      const i3 = i * 3;
      const prevI3 = (i - 1) * 3;
      
      trailPositions.current[i3] = trailPositions.current[prevI3];
      trailPositions.current[i3 + 1] = trailPositions.current[prevI3 + 1];
      trailPositions.current[i3 + 2] = trailPositions.current[prevI3 + 2];
    }
    
    // Новая позиция в начале хвоста
    trailPositions.current[0] = currentPos.x;
    trailPositions.current[1] = currentPos.y;
    trailPositions.current[2] = currentPos.z;
    
    trailGeometry.attributes.position.needsUpdate = true;
  };

  const createCrater = (position: THREE.Vector3, force: number) => {
    const craterGroup = new THREE.Group();
    
    // Основной кратер
    const craterGeometry = new THREE.SphereGeometry(force * 0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const craterMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 1.0,
      metalness: 0.0
    });
    const crater = new THREE.Mesh(craterGeometry, craterMaterial);
    crater.position.copy(position);
    crater.scale.set(1, 0.3, 1);
    craterGroup.add(crater);

    // Обломки вокруг кратера
    for (let i = 0; i < 15; i++) {
      const debrisGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 6, 6);
      const debrisMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8
      });
      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 0.5 + Math.random() * force * 0.5;
      debris.position.set(
        position.x + Math.cos(angle) * distance,
        position.y + Math.random() * 0.2,
        position.z + Math.sin(angle) * distance
      );
      
      craterGroup.add(debris);
    }

    scene.add(craterGroup);
    return craterGroup;
  };

  const handleClick = (event: MouseEvent) => {
    if (!earthMesh || !selectedAsteroid) {
      console.log("❌ Earth mesh or asteroid not available");
      return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObject(earthMesh);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      
      // Рассчитываем силу удара на основе характеристик астероида
      const diameter = selectedAsteroid.estimated_diameter.meters.estimated_diameter_min;
      const velocity = parseFloat(selectedAsteroid.relative_velocity.kilometers_per_second);
      const impactForce = (diameter / 100) * (velocity / 10);
      
      animationState.current.targetPoint = point.clone();
      animationState.current.startPosition = calculateStartPosition(point);
      animationState.current.time = 0;
      animationState.current.fadeOpacity = 1;
      animationState.current.impactForce = impactForce;
      animationState.current.isMoving = true;

      // Настраиваем размер астероида в зависимости от диаметра
      const scale = Math.min(diameter / 50, 2.0); // Ограничиваем максимальный размер
      if (asteroidRef.current) {
        asteroidRef.current.scale.setScalar(scale);
        asteroidRef.current.position.copy(animationState.current.startPosition);
        asteroidRef.current.visible = true;
        asteroidMaterial.opacity = 1;
      }

      if (glowRef.current) {
        glowRef.current.scale.setScalar(scale * 1.5);
        glowRef.current.visible = true;
        glowMaterial.opacity = 0.3;
      }

      if (particlesRef.current) {
        particlesRef.current.visible = true;
        trailMaterial.opacity = 0.8;
      }

      if (dustRef.current) {
        dustRef.current.visible = false;
      }

      // Инициализируем хвост
      for (let i = 0; i < params.trailLength; i++) {
        const i3 = i * 3;
        trailPositions.current[i3] = animationState.current.startPosition.x;
        trailPositions.current[i3 + 1] = animationState.current.startPosition.y;
        trailPositions.current[i3 + 2] = animationState.current.startPosition.z;
      }
      trailGeometry.attributes.position.needsUpdate = true;
    }
  };

  useEffect(() => {
    gl.domElement.addEventListener("click", handleClick);
    return () => {
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, earthMesh, scene, selectedAsteroid]);

  useFrame((state) => {
    const stateRef = animationState.current;
    
    if (!asteroidRef.current || !earthMesh) return;

    if (stateRef.isMoving) {
      stateRef.time += params.speed;
      
      if (stateRef.time <= 1) {
        // Квадратичная интерполяция для более естественного движения
        const progress = stateRef.time * stateRef.time;
        const currentPos = new THREE.Vector3();
        currentPos.lerpVectors(stateRef.startPosition, stateRef.targetPoint, progress);
        
        asteroidRef.current.position.copy(currentPos);
        
        // Вращение вокруг случайной оси
        asteroidRef.current.rotateOnAxis(stateRef.rotationAxis, params.rotationSpeed);
        
        // Обновляем хвост
        updateTrail(currentPos);

        // Эффект нагрева при приближении к Земле
        const distanceToCenter = currentPos.length();
        const heatFactor = Math.max(0, 1 - distanceToCenter / 10);
        
        if (heatFactor > 0.3) {
          const heatIntensity = heatFactor * params.heatIntensity;
          asteroidMaterial.emissive.setRGB(heatIntensity, heatIntensity * 0.5, 0);
          asteroidMaterial.emissiveIntensity = heatIntensity * 0.3;
          
          if (glowRef.current) {
            glowMaterial.opacity = heatIntensity * 0.4;
            glowMaterial.color.setRGB(heatIntensity, heatIntensity * 0.3, 0);
          }
        }

        // Проверка столкновения
        if (distanceToCenter < 5.3) {
          console.log("💥 COLLISION! Impact force:", stateRef.impactForce);
          stateRef.isMoving = false;
          stateRef.fadeStartTime = state.clock.getElapsedTime();
          
          // Создаем кратер
          createCrater(stateRef.targetPoint, stateRef.impactForce);
          
          // Активируем пыль
          if (dustRef.current) {
            dustRef.current.visible = true;
            const positions = dustGeometry.attributes.position.array as Float32Array;
            const velocities = dustGeometry.userData.velocities as Float32Array;
            
            for (let i = 0; i < 200; i++) {
              const i3 = i * 3;
              positions[i3] = stateRef.targetPoint.x;
              positions[i3 + 1] = stateRef.targetPoint.y;
              positions[i3 + 2] = stateRef.targetPoint.z;
            }
            dustGeometry.attributes.position.needsUpdate = true;
          }
        }

      } else {
        stateRef.isMoving = false;
        stateRef.fadeStartTime = state.clock.getElapsedTime();
      }
    }

    // Анимация пыли после удара
    if (dustRef.current?.visible) {
      const positions = dustGeometry.attributes.position.array as Float32Array;
      const velocities = dustGeometry.userData.velocities as Float32Array;
      
      for (let i = 0; i < 200; i++) {
        const i3 = i * 3;
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
        
        // Гравитация
        velocities[i3 + 1] -= 0.001;
      }
      dustGeometry.attributes.position.needsUpdate = true;
    }

    // Fade out после столкновения
    if (!stateRef.isMoving && stateRef.fadeOpacity > 0) {
      const elapsed = state.clock.getElapsedTime() - stateRef.fadeStartTime;
      stateRef.fadeOpacity = Math.max(0, 1 - elapsed / params.fadeDuration);
      
      asteroidMaterial.opacity = stateRef.fadeOpacity;
      trailMaterial.opacity = stateRef.fadeOpacity * 0.8;
      glowMaterial.opacity = stateRef.fadeOpacity * 0.3;
      dustMaterial.opacity = stateRef.fadeOpacity;
      
      if (stateRef.fadeOpacity <= 0) {
        asteroidRef.current.visible = false;
        if (glowRef.current) glowRef.current.visible = false;
        if (particlesRef.current) particlesRef.current.visible = false;
        if (dustRef.current) dustRef.current.visible = false;
      }
    }
  });

  return (
    <>
      {/* Основной астероид */}
      <mesh 
        ref={asteroidRef} 
        geometry={asteroidGeometry} 
        material={asteroidMaterial} 
        visible={false}
        castShadow
      />
      
      {/* Свечение при нагреве */}
      <mesh 
        ref={glowRef} 
        geometry={asteroidGeometry} 
        material={glowMaterial} 
        visible={false}
      />
      
      {/* Хвост из частиц */}
      <points 
        ref={particlesRef} 
        geometry={trailGeometry} 
        material={trailMaterial} 
        visible={false}
      />
      
      {/* Пыль при ударе */}
      <points 
        ref={dustRef} 
        geometry={dustGeometry} 
        material={dustMaterial} 
        visible={false}
      />
    </>
  );
};

export default Asteroid;