import * as THREE from 'three';

const asteroidGeometry = new  THREE.SphereGeometry(0.05, 32, 32);
const asteroidMaterial = new THREE.MeshStandardMaterial({
  color: 0x888888,
  roughness: 1,
  metalness: 0.2,
});
const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

// Стартовая позиция — где-то далеко от Земли
asteroid.position.set(5, 2, -5);
scene.add(asteroid);
