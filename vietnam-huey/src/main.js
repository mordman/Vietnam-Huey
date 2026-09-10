/**
 * Vietnam Huey - Main Entry Point
 * Этап 0-1: Инициализация проекта + физическое ядро
 */

import { Game } from './core/Game.js';

// Глобальная переменная для доступа из консоли
window.game = null;

/**
 * Основная функция инициализации
 */
async function init() {
  try {
    // Создание игры
    const game = new Game();
    await game.init();
    
    // Сохраняем глобально для отладки
    window.game = game;
    
    // Запуск
    game.start();
    
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
