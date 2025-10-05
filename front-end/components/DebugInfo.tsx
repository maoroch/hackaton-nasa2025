// components/DebugInfo.tsx
"use client";

import { useAsteroid } from './context/AsteroidContext';

export default function DebugInfo() {
  const { selectedAsteroid, customAsteroids } = useAsteroid();
  
  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <h3 className="font-bold mb-2">🔧 ДЕБАГ ИНФО</h3>
      <div className="space-y-1">
        <p>Выбранный астероид: {selectedAsteroid ? selectedAsteroid.name : 'НЕТ'}</p>
        <p>Тип: {selectedAsteroid ? ('diameter' in selectedAsteroid ? 'Кастомный' : 'NASA') : '-'}</p>
        <p>Кастомных астероидов: {customAsteroids.length}</p>
        <p>ID: {selectedAsteroid?.id || '-'}</p>
      </div>
    </div>
  );
}