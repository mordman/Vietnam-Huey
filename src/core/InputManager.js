/**
 * InputManager.js - Управление вводом (клавиатура, мышь)
 */

export class InputManager {
  constructor() {
    this.keys = new Map();
    this.mouse = { x: 0, y: 0, leftDown: false, rightDown: false };
    this.callbacks = new Map();
  }

  /**
   * Инициализация обработчиков событий
   */
  init() {
    // Клавиатура
    window.addEventListener('keydown', (e) => {
      this.trigger('keydown-any', e);
      if (!this.keys.get(e.code)) {
        this.keys.set(e.code, true);
        this.trigger('keydown', e);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
      this.trigger('keyup', e);
    });

    // Мышь
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.movementX || 0;
      this.mouse.y = e.movementY || 0;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.leftDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
      this.trigger('mousedown', e);
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
      this.trigger('mouseup', e);
    });

    // Блокировка контекстного меню для ПКМ
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    return this;
  }

  /**
   * Проверка состояния клавиши
   * @param {string} code - код клавиши (например, 'KeyW')
   * @returns {boolean}
   */
  isKeyDown(code) {
    return this.keys.get(code) || false;
  }

  /**
   * Получить состояние мыши
   * @returns {Object}
   */
  getMouseState() {
    return { ...this.mouse };
  }

  /**
   * Сброс дельты мыши (вызывать каждый кадр)
   */
  resetMouseDelta() {
    this.mouse.x = 0;
    this.mouse.y = 0;
  }

  /**
   * Подписаться на событие ввода
   * @param {string} event - тип события
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  /**
   * Отписаться от события
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (this.callbacks.has(event)) {
      const list = this.callbacks.get(event);
      const index = list.indexOf(callback);
      if (index > -1) {
        list.splice(index, 1);
      }
    }
  }

  /**
   * Вызвать коллбеки события
   * @private
   */
  trigger(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach(cb => cb(data));
    }
  }

  /**
   * Очистка
   */
  dispose() {
    this.callbacks.clear();
    this.keys.clear();
  }
}

export default InputManager;
