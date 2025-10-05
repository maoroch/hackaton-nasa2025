// utils/asteroidSize.ts
export const getAsteroidDisplaySize = (diameterMeters: number): number => {
  // Логарифмическое масштабирование для лучшего визуального отображения
  // Реальные диаметры: от 1м до 1000м (1км)
  // Визуальные размеры: от 8px до 120px
  
  const minRealSize = 1; // 1 метр
  const maxRealSize = 1000; // 1 километр
  const minDisplaySize = 8; // пикселей
  const maxDisplaySize = 120; // пикселей
  
  // Логарифмическое масштабирование
  const logMin = Math.log(minRealSize);
  const logMax = Math.log(maxRealSize);
  const logValue = Math.log(Math.max(diameterMeters, minRealSize));
  
  const normalized = (logValue - logMin) / (logMax - logMin);
  return minDisplaySize + normalized * (maxDisplaySize - minDisplaySize);
};

export const getAsteroidColor = (diameter: number, isHazardous: boolean): string => {
  // Цвет зависит от размера и опасности
  const sizeFactor = Math.min(diameter / 500, 1);
  
  if (isHazardous) {
    // Опасные - красные оттенки
    const red = 200 + Math.floor(sizeFactor * 55);
    const green = 100 - Math.floor(sizeFactor * 80);
    const blue = 100 - Math.floor(sizeFactor * 80);
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    // Безопасные - синие/зеленые оттенки
    const red = 100 + Math.floor(sizeFactor * 50);
    const green = 150 + Math.floor(sizeFactor * 50);
    const blue = 200 - Math.floor(sizeFactor * 50);
    return `rgb(${red}, ${green}, ${blue})`;
  }
};