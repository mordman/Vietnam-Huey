/**
 * Time.js - Управление временем и фиксированным шагом физики
 * Реализует accumulator + fixed timestep + интерполяцию
 */

export class Time {
  constructor() {
    this.fixedTimestep = 1 / 60; // 60 Гц физика
    this.accumulator = 0;
    this.lastTime = 0;
    this.currentTime = 0;
    this.alpha = 0; // Коэффициент интерполяции (0-1)
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateTime = 0;
  }

  /**
   * Инициализация временных счётчиков
   */
  init() {
    this.lastTime = performance.now();
    this.currentTime = this.lastTime;
  }

  /**
   * Обновление времени, возврат delta в секундах
   * @param {number} timestamp - текущее время в мс
   * @returns {number} delta time в секундах
   */
  update(timestamp) {
    this.currentTime = timestamp;
    const deltaTime = (this.currentTime - this.lastTime) / 1000;
    this.lastTime = this.currentTime;

    // Ограничение deltaTime для предотвращения спирали смерти
    const clampedDelta = Math.min(deltaTime, 0.25);
    
    this.accumulator += clampedDelta;
    
    // Вычисление alpha для интерполяции
    this.alpha = this.accumulator / this.fixedTimestep;

    // FPS counter
    this.frameCount++;
    if (this.currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = this.currentTime;
    }

    return clampedDelta;
  }

  /**
   * Шаг физики - вызывается каждый фиксированный интервал
   * @returns {boolean} true если нужно выполнить шаг физики
   */
  shouldPhysicsStep() {
    return this.accumulator >= this.fixedTimestep;
  }

  /**
   * Выполнить шаг физики и уменьшить accumulator
   */
  physicsStep() {
    this.accumulator -= this.fixedTimestep;
    this.alpha = this.accumulator / this.fixedTimestep;
  }

  /**
   * Получить коэффициент интерполяции для рендеринга
   * @returns {number} alpha (0-1)
   */
  getInterpolationAlpha() {
    return Math.max(0, Math.min(1, this.alpha));
  }

  /**
   * Получить текущий FPS
   * @returns {number}
   */
  getFPS() {
    return this.fps;
  }
}

export default Time;
