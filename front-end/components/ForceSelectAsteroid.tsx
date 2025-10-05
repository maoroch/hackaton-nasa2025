// components/ForceSelectAsteroid.tsx
"use client";

import { useAsteroid } from './context/AsteroidContext';

export default function ForceSelectAsteroid() {
  const { selectedAsteroid, setSelectedAsteroid, customAsteroids } = useAsteroid();

  const selectLastAsteroid = () => {
    if (customAsteroids.length > 0) {
      const lastAsteroid = customAsteroids[customAsteroids.length - 1];
      console.log("🔧 Принудительный выбор:", lastAsteroid.name);
      setSelectedAsteroid(lastAsteroid);
    } else {
      console.log("❌ Нет кастомных астероидов для выбора");
    }
  };

  const logState = () => {
    console.log("=== 📊 СОСТОЯНИЕ КОНТЕКСТА ===");
    console.log("selectedAsteroid:", selectedAsteroid);
    console.log("customAsteroids:", customAsteroids);
    console.log("customAsteroids.length:", customAsteroids.length);
  };

  return (
    <div>
    </div>
  );
}