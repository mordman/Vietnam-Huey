/**
 * Конфигурация игры с feature-флагами
 * Используется для включения/отключения подсистем во время разработки
 */

export const config = {
  // Feature flags
  ENABLE_PHYSICS: true,
  ENABLE_TERRAIN: false,
  ENABLE_HUEY: false,
  ENABLE_WEAPONS: false,
  ENABLE_ENEMIES: false,
  ENABLE_DAMAGE: false,
  ENABLE_AUDIO: false,
  ENABLE_HUD: true,
  
  // Настройки физики
  PHYSICS: {
    TIMESTEP: 1 / 60,
    GRAVITY: { x: 0, y: -9.81, z: 0 },
  },
  
  // Настройки рендеринга
  RENDER: {
    FOV: 75,
    NEAR: 0.1,
    FAR: 10000,
  },
  
  // Отладка
  DEBUG: {
    SHOW_COLLIDERS: false,
    SHOW_FPS: true,
  },
};

export default config;
