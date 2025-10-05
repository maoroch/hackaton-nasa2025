// Asteroid.tsx - ОСТАВЛЯЕМ только один обработчик клика
"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { useAsteroid } from './context/AsteroidContext';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

interface AsteroidProps {
  earthMesh: THREE.Mesh | null;
  onGeoDataReceived: (data: any) => void;
  setImpactData: (data: any) => void;
}

const Asteroid = ({ earthMesh, onGeoDataReceived, setImpactData }: AsteroidProps) => {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { selectedAsteroid } = useAsteroid();
  const { camera, gl, scene } = useThree();

  // Загрузка текстур для нового дизайна астероида
  const [asteroidTexture, asteroidNormal, asteroidRoughness] = useLoader(THREE.TextureLoader, [
    '/textures/asteroid/asteroid_diffuse.jpg',
    '/textures/asteroid/asteroid_normal.jpg', 
    '/textures/asteroid/asteroid_roughness.jpg'
  ]);

  // Текстура для декали (кратера)
  const craterTexture = useLoader(THREE.TextureLoader, '/textures/asteroid/crater_decal.png');

  const cartesianToLatLon = (position: THREE.Vector3): { lat: number; lon: number } => {
    const normalized = position.clone().normalize();
    const lat = Math.asin(normalized.y) * (180 / Math.PI);
    const lon = Math.atan2(normalized.z, normalized.x) * (180 / Math.PI);
    return { lat, lon };
  };

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

  // Создаем более детализированную и угловатую геометрию астероида
  const asteroidGeometry = useMemo(() => {
    // Используем IcosahedronGeometry для более угловатой формы
    const geometry = new THREE.IcosahedronGeometry(0.6, 2);
    
    // Добавляем случайные неровности для реалистичности
    const positionAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      
      // Более агрессивный шум для угловатой формы
      const noise = 0.2 + Math.random() * 0.4;
      const distance = vertex.length();
      vertex.normalize().multiplyScalar(distance * (1 + noise * 0.4));
      
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    
    // Добавляем displacement для большей детализации
    const displacement = new Float32Array(positionAttribute.count);
    for (let i = 0; i < displacement.length; i++) {
      displacement[i] = Math.random() * 0.3;
    }
    geometry.setAttribute('displacement', new THREE.BufferAttribute(displacement, 1));
    
    return geometry;
  }, []);

  // Основной материал астероида - более темный и каменистый
  const asteroidMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: asteroidTexture,
    normalMap: asteroidNormal,
    roughnessMap: asteroidRoughness,
    roughness: 0.95,
    metalness: 0.05,
    transparent: true,
    emissive: new THREE.Color(0x111111),
    emissiveIntensity: 0.05,
    bumpScale: 0.1
  }), [asteroidTexture, asteroidNormal, asteroidRoughness]);

  // Материал для свечения при нагреве - более интенсивный
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  }), []);

  // Геометрия для свечения (немного больше астероида)
  const glowGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(0.75, 1);
  }, []);

  // Создаем геометрию для частиц хвоста
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(params.trailLength * 3);
    const colors = new Float32Array(params.trailLength * 3);
    const sizes = new Float32Array(params.trailLength);

    for (let i = 0; i < params.trailLength; i++) {
      const i3 = i * 3;
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      
      // Более красный и интенсивный цвет хвоста
      const intensity = 1 - (i / params.trailLength) * 0.5;
      colors[i3] = 1.0 * intensity;
      colors[i3 + 1] = 0.3 * intensity;
      colors[i3 + 2] = 0.0;
      
      sizes[i] = 0.08 * (1 - i / params.trailLength);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, [params.trailLength]);

  // Материал для частиц хвоста
  const trailMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    opacity: 0.9
  }), []);

  // Геометрия для пыли при ударе
  const dustGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(150 * 3);
    const velocities = new Float32Array(150 * 3);
    const colors = new Float32Array(150 * 3);
    
    for (let i = 0; i < 150; i++) {
      const i3 = i * 3;
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      
      // Более разнообразные скорости
      velocities[i3] = (Math.random() - 0.5) * 0.3;
      velocities[i3 + 1] = Math.random() * 0.4;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;
      
      // Цвета пыли от серого до коричневого
      colors[i3] = 0.6 + Math.random() * 0.2;
      colors[i3 + 1] = 0.4 + Math.random() * 0.2;
      colors[i3 + 2] = 0.2 + Math.random() * 0.2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.userData.velocities = velocities;
    
    return geometry;
  }, []);

  // Материал для пыли
  const dustMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.NormalBlending,
    sizeAttenuation: true
  }), []);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const trailPositions = useRef(new Float32Array(params.trailLength * 3));

  const calculateStartPosition = (target: THREE.Vector3) => {
    const start = new THREE.Vector3(20, 15, 15);
    
    animationState.current.rotationAxis.set(
      Math.random() - 0.5,
      Math.random() - 0.5, 
      Math.random() - 0.5
    ).normalize();
    
    return start;
  };

  const updateTrail = (currentPos: THREE.Vector3) => {
    if (!particlesRef.current) return;

    for (let i = params.trailLength - 1; i > 0; i--) {
      const i3 = i * 3;
      const prevI3 = (i - 1) * 3;
      
      trailPositions.current[i3] = trailPositions.current[prevI3];
      trailPositions.current[i3 + 1] = trailPositions.current[prevI3 + 1];
      trailPositions.current[i3 + 2] = trailPositions.current[prevI3 + 2];
    }
    
    trailPositions.current[0] = currentPos.x;
    trailPositions.current[1] = currentPos.y;
    trailPositions.current[2] = currentPos.z;
    
    trailGeometry.attributes.position.needsUpdate = true;
  };

  // НОВАЯ ФУНКЦИЯ: Создание декали-кратера вместо сложной геометрии
  const createCraterDecal = (position: THREE.Vector3, force: number, earthMesh: THREE.Mesh) => {
    if (!earthMesh) return null;

    // Нормализуем позицию для получения направления
    const direction = position.clone().normalize();
    
    // Создаем матрицу преобразования для декали
    const size = new THREE.Vector3(force * 0.8, force * 0.8, force * 0.4);
    const orientation = new THREE.Euler();
    
    // Вычисляем ориентацию относительно нормали поверхности Земли
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, direction);
    orientation.setFromQuaternion(quaternion);

    // Создаем геометрию декали
    const decalGeometry = new DecalGeometry(
      earthMesh,
      position,
      orientation,
      size
    );

    // Создаем материал для декали
    const decalMaterial = new THREE.MeshStandardMaterial({
      map: craterTexture,
      transparent: true,
      opacity: 0.9,
      roughness: 0.9,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1 // Чтобы декаль была поверх Земли
    });

    // Создаем меш декали
    const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
    decalMesh.name = 'crater-decal';
    
    // Добавляем в сцену
    scene.add(decalMesh);
    
    return decalMesh;
  };

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

  const handleClick = async (event: MouseEvent) => {
    if (!earthMesh || !selectedAsteroid || animationState.current.isMoving) {
      if (!selectedAsteroid) {
        console.log("❌ Сначала выберите астероид из списка!");
      }
      return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObject(earthMesh);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const latLon = cartesianToLatLon(point);
      console.log("🎯 Запуск астероида к точке:", point, "Координаты:", latLon);

      // Рассчитываем силу удара на основе характеристик астероида
      const diameter = selectedAsteroid.estimated_diameter.meters.estimated_diameter_min;
      const velocity = parseFloat(selectedAsteroid.relative_velocity.kilometers_per_second);
      const impactForce = Math.min((diameter / 100) * (velocity / 10), 3.0); // Ограничиваем максимальную силу
      
      animationState.current.targetPoint = point.clone();
      animationState.current.startPosition = calculateStartPosition(point);
      animationState.current.time = 0;
      animationState.current.fadeOpacity = 1;
      animationState.current.impactForce = impactForce;
      animationState.current.isMoving = true;

      // Настраиваем размер астероида в зависимости от диаметра
      const scale = Math.min(diameter / 80, 1.5); // Меньший масштаб для угловатой формы
      if (asteroidRef.current) {
        asteroidRef.current.scale.setScalar(scale);
        asteroidRef.current.position.copy(animationState.current.startPosition);
        asteroidRef.current.visible = true;
        asteroidMaterial.opacity = 1;
      }

      if (glowRef.current) {
        glowRef.current.scale.setScalar(scale * 1.3);
        glowRef.current.visible = true;
        glowMaterial.opacity = 0.4;
      }

      if (particlesRef.current) {
        particlesRef.current.visible = true;
        trailMaterial.opacity = 0.9;
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

      // Устанавливаем данные для модального окна удара
      const impactData = {
  name: selectedAsteroid.name,
  coordinates: latLon,
  mass: formatMass(selectedAsteroid.mass_kg),
  diameter: `${selectedAsteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} м`,
  velocity: `${parseFloat(selectedAsteroid.relative_velocity.kilometers_per_second).toFixed(2)} км/с`,
  kinetic_energy: selectedAsteroid.kinetic_energy_joules ? 
    `${selectedAsteroid.kinetic_energy_joules.toExponential(2)} Дж` : "Неизвестно",
  crater: { // Всегда создаем объект crater
    diameter: `${(impactForce * 0.8).toFixed(1)} км`,
    dust_radius: `${(impactForce * 1.5).toFixed(1)} км`,
    dust_height: `${(impactForce * 0.3).toFixed(1)} км`
  },
  is_hazardous: selectedAsteroid.is_potentially_hazardous_asteroid
};

      
      setImpactData(impactData);

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
  };

  useEffect(() => {
    gl.domElement.addEventListener("click", handleClick);
    return () => {
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, earthMesh, selectedAsteroid, onGeoDataReceived, setImpactData]);

  useFrame((state) => {
    const stateRef = animationState.current;
    
    if (!asteroidRef.current || !earthMesh) return;

    if (stateRef.isMoving) {
      stateRef.time += params.speed;
      
      if (stateRef.time <= 1) {
        const progress = stateRef.time * stateRef.time;
        const currentPos = new THREE.Vector3();
        currentPos.lerpVectors(stateRef.startPosition, stateRef.targetPoint, progress);
        
        asteroidRef.current.position.copy(currentPos);
        asteroidRef.current.rotateOnAxis(stateRef.rotationAxis, params.rotationSpeed);
        updateTrail(currentPos);

        const distanceToCenter = currentPos.length();
        const heatFactor = Math.max(0, 1 - distanceToCenter / 10);
        
        if (heatFactor > 0.3) {
          const heatIntensity = heatFactor * params.heatIntensity;
          asteroidMaterial.emissive.setRGB(heatIntensity, heatIntensity * 0.3, 0);
          asteroidMaterial.emissiveIntensity = heatIntensity * 0.4;
          
          if (glowRef.current) {
            glowMaterial.opacity = heatIntensity * 0.5;
            glowMaterial.color.setRGB(heatIntensity, heatIntensity * 0.2, 0);
          }
        }

        if (distanceToCenter < 8.3) { // Земля радиус 8 + астероид радиус 0.3
          console.log("💥 COLLISION! Impact force:", stateRef.impactForce);
          stateRef.isMoving = false;
          stateRef.fadeStartTime = state.clock.getElapsedTime();
          
          // ИСПОЛЬЗУЕМ ДЕКАЛЬ ВМЕСТО СЛОЖНОГО КРАТЕРА
          createCraterDecal(stateRef.targetPoint, stateRef.impactForce, earthMesh);
          
          if (dustRef.current) {
            dustRef.current.visible = true;
            const positions = dustGeometry.attributes.position.array as Float32Array;
            const velocities = dustGeometry.userData.velocities as Float32Array;
            
            for (let i = 0; i < 150; i++) {
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

    if (dustRef.current?.visible) {
      const positions = dustGeometry.attributes.position.array as Float32Array;
      const velocities = dustGeometry.userData.velocities as Float32Array;
      
      for (let i = 0; i < 150; i++) {
        const i3 = i * 3;
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
        velocities[i3 + 1] -= 0.002; // Увеличиваем гравитацию
      }
      dustGeometry.attributes.position.needsUpdate = true;
    }

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
      <mesh 
        ref={asteroidRef} 
        geometry={asteroidGeometry} 
        material={asteroidMaterial} 
        visible={false}
        castShadow
      />
      <mesh 
        ref={glowRef} 
        geometry={glowGeometry} 
        material={glowMaterial} 
        visible={false}
      />
      <points 
        ref={particlesRef} 
        geometry={trailGeometry} 
        material={trailMaterial} 
        visible={false}
      />
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