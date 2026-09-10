/**
 * Vietnam Huey - Main Entry Point
 * Этап 2: Процедурная генерация мира + физика terrain
 */

import { Game } from './core/Game.js';
import { config } from './config.js';

// Включаем terrain для этапа 2
config.ENABLE_TERRAIN = true;

// Глобальная переменная для доступа из консоли
window.game = null;

/**
 * Основная функция инициализации
 */
async function init() {
  try {
    console.log('Vietnam Huey - Stage 2: Terrain Generation');
    
    // Создание игры
    const game = new Game();
    await game.init();
    
    // Сохраняем глобально для отладки
    window.game = game;
    
    // Запуск
    game.start();
    
    // Скрываем экран загрузки
    setTimeout(() => {
      const loadingEl = document.getElementById('loading');
      if (loadingEl) {
        loadingEl.classList.add('hidden');
      }
      
      // Обновляем статус в debug info
      const physicsStatus = document.getElementById('physics-status');
      const terrainStatus = document.getElementById('terrain-status');
      if (physicsStatus) physicsStatus.textContent = config.ENABLE_PHYSICS ? 'ON' : 'OFF';
      if (terrainStatus) terrainStatus.textContent = config.ENABLE_TERRAIN ? 'ON' : 'OFF';
    }, 1000);
    
  } catch (err) {
    console.error('Initialization error:', err);
    throw err;
  }
}

// Старт после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
