// Earth.tsx

'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as dat from 'dat.gui';

const reentryVertexShader = `
    uniform float time;
    uniform float size;
    attribute float randomness;
    varying vec3 vColor;
    
    void main() {
        vColor = mix(
            vec3(1.0, 0.7, 0.0),  // yellow/orange
            vec3(0.7, 0.0, 0.0),  // dark red
            randomness
        );
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (20.0 / -mvPosition.z) * mix(0.5, 1.0, randomness);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const reentryFragmentShader = `
    varying vec3 vColor;
    
    void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        
        vec3 finalColor = vColor;
        gl_FragColor = vec4(finalColor, 1.0 - (dist * 2.0));
    }
`;

interface EarthProps {
  className?: string;
}

const Earth = ({ className }: EarthProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Raycaster setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Animation state
    let isAsteroidMoving = false;
    let targetPoint = new THREE.Vector3();
    let time = 0;

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    scene.add(dirLight);

    const updateSunPosition = () => {
      const now = new Date();
      const hours = now.getUTCHours();
      const minutes = now.getUTCMinutes();
      const angleInDegrees = ((hours + minutes / 60) / 24) * 360;
      const angleInRadians = (angleInDegrees * Math.PI) / 180;
      const radius = 50;
      
      dirLight.position.x = Math.cos(angleInRadians) * radius;
      dirLight.position.z = Math.sin(angleInRadians) * radius;
    };
    
    updateSunPosition();

    // Earth setup
    const earthGeo = new THREE.SphereGeometry(10, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial();
    const earth = new THREE.Mesh(earthGeo, earthMat);
    
    const group = new THREE.Group();
    group.rotation.z = (23.5 / 360) * 2 * Math.PI;
    group.add(earth);
    scene.add(group);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    
    Promise.all([
        new Promise<THREE.Texture>((resolve) => textureLoader.load('/textures/Albedo.jpg', resolve)),
        new Promise<THREE.Texture>((resolve) => textureLoader.load('/textures/night_lights_modified.png', resolve)),
        new Promise<THREE.Texture>((resolve) => textureLoader.load('/textures/asteroid.jpg', resolve))
    ]).then(([albedoMap, nightMap, asteroidTexture]) => {
        // Earth textures
        albedoMap.colorSpace = THREE.SRGBColorSpace;
        earthMat.map = albedoMap;
        
        // Night lights
        earthMat.emissiveMap = nightMap;
        earthMat.emissive = new THREE.Color(0xffffff);
        earthMat.emissiveIntensity = 0.5;
        earthMat.needsUpdate = true;

        // Asteroid texture
        asteroidTexture.colorSpace = THREE.SRGBColorSpace;
        asteroidMaterial.map = asteroidTexture;
        asteroidMaterial.needsUpdate = true;
    });

    // Asteroid setup
    const asteroidGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: 'rgb(135,206,250)',
        roughness: 0.8,
        metalness: 0.2,
        bumpScale: 0.02
    });
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

    // Particles setup
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const randomness = new Float32Array(particleCount);

    for(let i = 0; i < particleCount; i++) {
        randomness[i] = Math.random();
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('randomness', new THREE.BufferAttribute(randomness, 1));

    const particlesMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            size: { value: 2.0 }
        },
        vertexShader: reentryVertexShader,
        fragmentShader: reentryFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Initial asteroid position
    const startPosition = new THREE.Vector3(30, 10, -30);
    asteroid.position.copy(startPosition);
    scene.add(asteroid);

    // Parameters
    const params = {
        asteroidSpeed: 0.0005,
        asteroidRotationSpeed: 0.02,
        trajectoryArc: 0.5,
        glowIntensity: 1.0,
        heatThreshold: 0.3,
        startColor: new THREE.Color(0x87CEFA),
        endColor: new THREE.Color(0xFF4500),
        heatColor: new THREE.Color(0xFFFF00)
    };

    // GUI setup
    const gui = new dat.GUI();
    gui.add(params, 'asteroidSpeed', 0.0001, 0.001, 0.0001).name('Speed');
    gui.add(params, 'asteroidRotationSpeed', 0, 0.1, 0.01).name('Rotation');
    gui.add(params, 'trajectoryArc', 0, 1, 0.1).name('Arc Height');
    gui.add(params, 'glowIntensity', 0, 3).name('Glow Intensity');
    gui.add(params, 'heatThreshold', 0.1, 0.5).name('Heat Threshold');
    gui.addColor(params, 'startColor').name('Start Color');
    gui.addColor(params, 'endColor').name('Impact Color');
    gui.addColor(params, 'heatColor').name('Heat Color');

    // Arc position calculator
    const calculateArcPosition = (
        start: THREE.Vector3,
        end: THREE.Vector3,
        progress: number,
        height: number
    ) => {
        const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
        mid.y += height * 20;

        const p0 = start;
        const p1 = mid;
        const p2 = end;

        const position = new THREE.Vector3();
        position.x = Math.pow(1 - progress, 2) * p0.x + 2 * (1 - progress) * progress * p1.x + Math.pow(progress, 2) * p2.x;
        position.y = Math.pow(1 - progress, 2) * p0.y + 2 * (1 - progress) * progress * p1.y + Math.pow(progress, 2) * p2.y;
        position.z = Math.pow(1 - progress, 2) * p0.z + 2 * (1 - progress) * progress * p1.z + Math.pow(progress, 2) * p2.z;

        return position;
    };

    // Click handler
    const handleClick = (event: MouseEvent) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(earth);
        
        if (intersects.length > 0) {
            targetPoint = intersects[0].point;
            time = 0;
            asteroid.position.copy(startPosition);
            isAsteroidMoving = true;
            console.log('New target point:', targetPoint);
        }
    };

    containerRef.current.addEventListener('click', handleClick);

    // Animation
    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        updateSunPosition();
        
        if (isAsteroidMoving) {
            time += params.asteroidSpeed;
            if (time <= 1) {
                const arcPosition = calculateArcPosition(
                    startPosition, 
                    targetPoint, 
                    time, 
                    params.trajectoryArc
                );
                asteroid.position.copy(arcPosition);

                asteroid.rotateX(params.asteroidRotationSpeed);
                asteroid.rotateY(params.asteroidRotationSpeed);
                asteroid.lookAt(targetPoint);

                const distance = asteroid.position.distanceTo(targetPoint);
                const maxDistance = startPosition.distanceTo(targetPoint);
                const normalizedDistance = distance / maxDistance;

                if (normalizedDistance < params.heatThreshold) {
                    const heatProgress = 1 - (normalizedDistance / params.heatThreshold);
                    asteroidMaterial.color = params.endColor;
                    asteroidMaterial.emissive = params.heatColor;
                    asteroidMaterial.emissiveIntensity = heatProgress * params.glowIntensity * 
                        (Math.sin(Date.now() * 0.01) * 0.2 + 0.8);

                    const positions = particles.geometry.attributes.position.array;
                    const direction = new THREE.Vector3()
                        .subVectors(targetPoint, asteroid.position)
                        .normalize();

                    for(let i = 0; i < particleCount; i++) {
                        const i3 = i * 3;
                        const rand = Math.random();
                        positions[i3] = asteroid.position.x - direction.x * (rand * 2);
                        positions[i3 + 1] = asteroid.position.y - direction.y * (rand * 2);
                        positions[i3 + 2] = asteroid.position.z - direction.z * (rand * 2);
                    }

                    particles.geometry.attributes.position.needsUpdate = true;
                    particlesMaterial.uniforms.time.value = time;
                    particles.visible = true;
                    particlesMaterial.uniforms.size.value = (1 - normalizedDistance) * 4.0;
                } else {
                    const currentColor = new THREE.Color();
                    currentColor.lerpColors(params.endColor, params.startColor, normalizedDistance);
                    asteroidMaterial.color = currentColor;
                    asteroidMaterial.emissive = new THREE.Color(0x000000);
                    asteroidMaterial.emissiveIntensity = 0;
                    particles.visible = false;
                }

                if (distance < 0.2) {
                    console.log('Direct hit at:', targetPoint);
                    isAsteroidMoving = false;
                }
                if (isAsteroidMoving) {
    time += params.asteroidSpeed;
    if (time <= 1) {
        const arcPosition = calculateArcPosition(
            startPosition, 
            targetPoint, 
            time, 
            params.trajectoryArc
        );

        // New: Prevent penetration (Earth center at (0,0,0), radius 10)
        const earthCenter = new THREE.Vector3(0, 0, 0);
        const distanceToCenter = arcPosition.distanceTo(earthCenter);
        const earthRadius = 10;
        const asteroidRadius = 0.5;
        if (distanceToCenter < earthRadius + asteroidRadius) {
            // Clamp to surface: normalize direction and set to exact impact distance
            arcPosition.normalize().multiplyScalar(earthRadius + asteroidRadius * 0.1); // Small offset to avoid clipping
            isAsteroidMoving = false; // Stop movement on "collision"
            console.log('Impact detected - stopped at surface');
        }

        asteroid.position.copy(arcPosition);

        // ... (rest of your code: rotation, lookAt, color/heat/particles, etc.)
    }
}
            }
        }

        earth.rotateY((2 * Math.PI) / (100000000 * 60));
        renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
        particlesGeometry.dispose();
        particlesMaterial.dispose();
        if (containerRef.current) {
            containerRef.current.removeChild(renderer.domElement);
            containerRef.current.removeEventListener('click', handleClick);
        }
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        gui.destroy();
    };
  }, []);

  return <div ref={containerRef} className={className} />;
};

export default Earth;