// components/DebugInfo.tsx
"use client";

import { useAsteroid } from './context/AsteroidContext';

export default function DebugInfo() {
  const { selectedAsteroid, customAsteroids } = useAsteroid();
  
  return (
    <div>

    </div>
  );
}