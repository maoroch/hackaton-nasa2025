// components/moduleWindows/CustomAsteroidCreator.tsx
"use client";

import { useState, useEffect } from "react";

interface CustomAsteroidData {
  name: string;
  diameter: number;
  density: number;
  velocity: number;
  angle: number;
}

interface ImpactResult {
  kinetic_energy: number;
  crater_diameter: number;
  ejecta_radius: number;
  dust_height: number;
}

interface CustomAsteroidCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAsteroid: (data: CustomAsteroidData, result: ImpactResult) => void;
}

const CustomAsteroidCreator = ({ isOpen, onClose, onCreateAsteroid }: CustomAsteroidCreatorProps) => {
  const [formData, setFormData] = useState<CustomAsteroidData>({
    name: "",
    diameter: 100,
    density: 3000,
    velocity: 17,
    angle: 45
  });

  const [impactResult, setImpactResult] = useState<ImpactResult | null>(null);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.8);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Расчет визуального размера астероида
  const getAsteroidSize = (diameter: number) => {
    const minDiameter = 1;
    const maxDiameter = 1000;
    const minSize = 20;
    const maxSize = 120;
    
    const logMin = Math.log(minDiameter);
    const logMax = Math.log(maxDiameter);
    const logValue = Math.log(Math.max(diameter, minDiameter));
    
    const normalized = (logValue - logMin) / (logMax - logMin);
    return minSize + normalized * (maxSize - minSize);
  };

  // Расчет цвета в зависимости от размера и плотности
  const getAsteroidColor = (diameter: number, density: number) => {
    const sizeFactor = Math.min(diameter / 500, 1);
    const densityFactor = Math.min((density - 1000) / 7000, 1);
    
    const red = Math.floor(150 + sizeFactor * 105);
    const green = Math.floor(100 + (1 - sizeFactor) * 100);
    const blue = Math.floor(80 + (1 - densityFactor) * 100);
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  // Расчеты при изменении параметров
  useEffect(() => {
    if (isOpen) {
      calculateImpact();
    }
  }, [formData, isOpen]);

  // Анимация появления
  useEffect(() => {
    if (isOpen) {
      setOpacity(1);
      setScale(1);
    } else {
      setOpacity(0);
      setScale(0.8);
    }
  }, [isOpen]);

  const calculateImpact = () => {
    const { diameter, density, velocity, angle } = formData;
    
    // Расчет массы (сфера)
    const radius = diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const mass = volume * density;
    
    // Кинетическая энергия (0.5 * m * v^2)
    const kinetic_energy = 0.5 * mass * Math.pow(velocity * 1000, 2);
    
    // Учет угла падения
    const angleFactor = Math.sin(angle * Math.PI / 180);
    
    // Расчет кратера
    const crater_diameter = diameter * 20 * angleFactor;
    const ejecta_radius = crater_diameter * 1.2;
    const dust_height = crater_diameter * 0.1;
    
    setImpactResult({
      kinetic_energy,
      crater_diameter,
      ejecta_radius,
      dust_height
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && impactResult) {
      setIsSubmitting(true);
      
      try {
        console.log("🚀 Отправка данных на сервер:", formData);
        
        // Отправляем данные на сервер Flask
        const response = await fetch("http://127.0.0.1:5000/api/asteroids/custom", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
        }

        const result = await response.json();
        console.log("✅ Астероид создан на сервере:", result.asteroid);
        
        // Вызываем колбэк с данными
        onCreateAsteroid(formData, impactResult);
        
        // Показываем сообщение об успехе
        alert(`✅ Астероид "${formData.name}" создан и сохранен на сервере!`);
        
        // Закрываем модальное окно
        onClose();
        
      } catch (error) {
        console.error("❌ Ошибка при создании астероида:", error);
        alert(`❌ Ошибка при создании астероида: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (field: keyof CustomAsteroidData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const asteroidSize = getAsteroidSize(formData.diameter);
  const asteroidColor = getAsteroidColor(formData.diameter, formData.density);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ease-in-out pointer-events-auto"
        style={{ opacity: opacity * 0.5 }}
        onClick={onClose}
      />
      
      {/* Основное модальное окно */}
      <div
        className="bg-gradient-to-br from-blue-900/95 via-purple-900/90 to-indigo-800/85 backdrop-blur-xl rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl border border-blue-400/20 pointer-events-auto relative transition-all duration-500 ease-out"
        style={{ 
          opacity,
          transform: `scale(${scale}) translateY(${(1 - scale) * 20}px)`
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-2 h-2 bg-blue-300 rounded-full top-4 left-6 animate-pulse"></div>
          <div className="absolute w-2 h-2 bg-purple-400 rounded-full top-8 right-8 animate-pulse delay-200"></div>
          <div className="absolute w-2 h-2 bg-indigo-500 rounded-full bottom-6 left-12"></div>
          <div className="absolute w-2 h-2 bg-blue-300 rounded-full bottom-12 right-16 animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-orbitron text-blue-300 font-bold">
                🚀 СОЗДАТЬ МЕТЕОРИТ
              </h2>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-300"></div>
            </div>
            <p className="text-blue-200/80 font-space-mono text-sm">
              Настройте параметры и посмотрите результат удара
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Левая колонка - Визуализация */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-blue-900/30 rounded-lg p-6 w-full text-center">
                  <h3 className="font-orbitron text-blue-300 text-sm mb-4">ВИЗУАЛИЗАЦИЯ</h3>
                  
                  {/* Астероид */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div
                      className="rounded-full relative shadow-2xl transition-all duration-500 ease-out"
                      style={{
                        width: `${asteroidSize}px`,
                        height: `${asteroidSize}px`,
                        background: `radial-gradient(circle at 30% 30%, ${asteroidColor}, ${asteroidColor}dd)`,
                        boxShadow: `
                          inset -${asteroidSize * 0.1}px -${asteroidSize * 0.05}px ${asteroidSize * 0.2}px rgba(255,255,255,0.3),
                          inset ${asteroidSize * 0.1}px ${asteroidSize * 0.05}px ${asteroidSize * 0.2}px rgba(0,0,0,0.5),
                          0 0 ${asteroidSize * 0.3}px ${asteroidColor}80
                        `
                      }}
                    >
                      {/* Кратеры на поверхности */}
                      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gray-800/50 rounded-full"></div>
                      <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-gray-900/60 rounded-full"></div>
                      <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-gray-700/40 rounded-full"></div>
                    </div>
                    
                    {/* Информация о размере */}
                    <div className="text-center">
                      <p className="text-blue-200 font-space-mono text-sm">
                        Диаметр: <span className="text-white">{formData.diameter} м</span>
                      </p>
                      <p className="text-blue-200 font-space-mono text-sm">
                        Масштаб: 1:{Math.round(1000 / asteroidSize)}
                      </p>
                    </div>
                  </div>

                  {/* Сравнительная шкала */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs text-blue-300">
                      <span>Маленький</span>
                      <span>Средний</span>
                      <span>Большой</span>
                    </div>
                    <div className="w-full bg-blue-800/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(Math.log(formData.diameter) / Math.log(1000)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-blue-300">
                      <span>10 м</span>
                      <span>100 м</span>
                      <span>1 км</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Центральная колонка - Параметры */}
              <div className="space-y-4">
                {/* Название */}
                <div className="bg-blue-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-blue-300 text-sm mb-3">НАЗВАНИЕ МЕТЕОРИТА</h3>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Введите название..."
                    className="w-full bg-blue-800/20 border border-blue-600/30 rounded-lg px-3 py-2 text-white font-space-mono placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-colors"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Диаметр */}
                <div className="bg-purple-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-purple-300 text-sm mb-3">
                    ДИАМЕТЕР: {formData.diameter} м
                  </h3>
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    value={formData.diameter}
                    onChange={(e) => handleInputChange('diameter', parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-800/20 rounded-lg appearance-none cursor-pointer slider"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-purple-200 mt-2">
                    <span>1 м</span>
                    <span>1000 м</span>
                  </div>
                </div>

                {/* Плотность */}
                <div className="bg-indigo-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-indigo-300 text-sm mb-3">
                    ПЛОТНОСТЬ: {formData.density} кг/м³
                  </h3>
                  <input
                    type="range"
                    min="1000"
                    max="8000"
                    step="100"
                    value={formData.density}
                    onChange={(e) => handleInputChange('density', parseInt(e.target.value))}
                    className="w-full h-2 bg-indigo-800/20 rounded-lg appearance-none cursor-pointer slider"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-indigo-200 mt-2">
                    <span>1000 кг/м³</span>
                    <span>8000 кг/м³</span>
                  </div>
                  <p className="text-xs text-indigo-300/70 mt-2">
                    {formData.density < 2000 ? 'Лёгкий (лед)' : 
                     formData.density < 4000 ? 'Средний (камень)' : 
                     formData.density < 6000 ? 'Тяжёлый (металл)' : 'Очень тяжёлый'}
                  </p>
                </div>
              </div>

              {/* Правая колонка - Параметры и результаты */}
              <div className="space-y-4">
                {/* Скорость */}
                <div className="bg-blue-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-blue-300 text-sm mb-3">
                    СКОРОСТЬ: {formData.velocity} км/с
                  </h3>
                  <input
                    type="range"
                    min="1"
                    max="72"
                    value={formData.velocity}
                    onChange={(e) => handleInputChange('velocity', parseInt(e.target.value))}
                    className="w-full h-2 bg-blue-800/20 rounded-lg appearance-none cursor-pointer slider"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-blue-200 mt-2">
                    <span>1 км/с</span>
                    <span>72 км/с</span>
                  </div>
                  <p className="text-xs text-blue-300/70 mt-2">
                    {formData.velocity < 10 ? 'Медленная' : 
                     formData.velocity < 30 ? 'Средняя' : 
                     formData.velocity < 50 ? 'Высокая' : 'Очень высокая'}
                  </p>
                </div>

                {/* Угол падения */}
                <div className="bg-purple-900/30 rounded-lg p-4">
                  <h3 className="font-orbitron text-purple-300 text-sm mb-3">
                    УГОЛ ПАДЕНИЯ: {formData.angle}°
                  </h3>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={formData.angle}
                    onChange={(e) => handleInputChange('angle', parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-800/20 rounded-lg appearance-none cursor-pointer slider"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-purple-200 mt-2">
                    <span>15°</span>
                    <span>90°</span>
                  </div>
                  <p className="text-xs text-purple-300/70 mt-2">
                    {formData.angle === 90 ? 'Вертикальное падение' : 
                     formData.angle >= 60 ? 'Крутой угол' :
                     formData.angle >= 30 ? 'Средний угол' : 'Пологий угол'}
                  </p>
                </div>

                {/* Предварительные результаты */}
                {impactResult && (
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-800/30 rounded-lg p-4 border border-green-500/20">
                    <h3 className="font-orbitron text-green-300 text-sm mb-3">ПРЕДВАРИТЕЛЬНЫЙ РАСЧЕТ</h3>
                    <div className="space-y-2 font-space-mono text-sm">
                      <p className="flex justify-between">
                        <span className="text-green-200">Кинетическая энергия:</span>
                        <span className="text-white">{impactResult.kinetic_energy.toExponential(2)} Дж</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-green-200">Диаметр кратера:</span>
                        <span className="text-white">{impactResult.crater_diameter.toFixed(1)} м</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Детальные результаты */}
            {impactResult && (
              <div className="bg-gradient-to-r from-amber-900/30 to-orange-800/30 rounded-lg p-4 border border-amber-500/20">
                <h3 className="font-orbitron text-amber-300 text-sm mb-3">ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ УДАРА</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-space-mono text-sm">
                  <div className="text-center">
                    <p className="text-amber-200">Кинетическая энергия</p>
                    <p className="text-white text-lg">{impactResult.kinetic_energy.toExponential(2)} Дж</p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-200">Кратер</p>
                    <p className="text-white text-lg">{impactResult.crater_diameter.toFixed(1)} м</p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-200">Радиус выброса</p>
                    <p className="text-white text-lg">{impactResult.ejecta_radius.toFixed(1)} м</p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-200">Высота пыли</p>
                    <p className="text-white text-lg">{impactResult.dust_height.toFixed(1)} м</p>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 font-orbitron py-3 rounded-lg border border-gray-600/30 transition-all duration-200 hover:border-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ОТМЕНА
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim() || isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-orbitron py-3 rounded-lg border border-blue-400/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    СОЗДАНИЕ...
                  </>
                ) : (
                  'СОЗДАТЬ МЕТЕОРИТ'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl border border-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default CustomAsteroidCreator;