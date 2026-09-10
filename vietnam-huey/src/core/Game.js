/**
 * Game.js - Оркестратор игры
 * Управляет основными подсистемами и игровым циклом
 */

import * as THREE from 'three';
import { config } from '../config.js';
import { Time } from './Time.js';
import { InputManager } from './InputManager.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { DebugRenderer } from '../physics/DebugRenderer.js';

export class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.time = null;
    this.inputManager = null;
    this.physicsWorld = null;
    this.debugRenderer = null;
    this.isRunning = false;
    this.objects = []; // Объекты для обновления
  }

  /**
   * Инициализация игры
   */
  async init() {
    console.log('Vietnam Huey - Initializing...');
    
    // Время
    this.time = new Time();
    this.time.init();
    
    // Ввод
    this.inputManager = new InputManager();
    this.inputManager.init();
    
    // Сцена
    this.initScene();
    
    // Физика
    if (config.ENABLE_PHYSICS) {
      this.physicsWorld = new PhysicsWorld();
      await this.physicsWorld.init();
      
      // Debug renderer
      this.debugRenderer = new DebugRenderer(this.physicsWorld);
      this.debugRenderer.init();
      this.debugRenderer.addToScene(this.scene);
    }
    
    // Тестовые объекты
    this.createTestObjects();
    
    console.log('Vietnam Huey - Initialization complete');
    return this;
  }

  /**
   * Инициализация Three.js сцены
   */
  initScene() {
    // Сцена
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 1000);

    // Камера
    this.camera = new THREE.PerspectiveCamera(
      config.RENDER.FOV,
      window.innerWidth / window.innerHeight,
      config.RENDER.NEAR,
      config.RENDER.FAR
    );
    this.camera.position.set(0, 10, 30);
    this.camera.lookAt(0, 5, 0);

    // Рендерер
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    // Свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Обработчики событий
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Создать тестовые объекты (куб + плоскость)
   */
  createTestObjects() {
    if (!config.ENABLE_PHYSICS || !this.physicsWorld) return;

    import('@dimforge/rapier3d-compat').then(RAPIER => {
      // Куб
      const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
      const cubeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6600,
        roughness: 0.7,
        metalness: 0.3
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(0, 20, 0);
      cube.castShadow = true;
      this.scene.add(cube);

      const colliderDesc = RAPIER.ColliderDesc.cuboid(1, 1, 1);
      this.physicsWorld.createDynamicBody(cube, colliderDesc, 10, false);

      // Плоскость (земля)
      const groundSize = 200;
      const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a7d3a,
        roughness: 1,
        metalness: 0
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);

      const groundColliderDesc = RAPIER.ColliderDesc.cuboid(groundSize / 2, 0.1, groundSize / 2);
      this.physicsWorld.createStaticBody(ground, groundColliderDesc);
    });
  }

  /**
   * Обработка изменения размера окна
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Добавить объект для обновления
   * @param {Object} obj - объект с методом update(delta)
   */
  addObject(obj) {
    this.objects.push(obj);
  }

  /**
   * Удалить объект из обновления
   * @param {Object} obj
   */
  removeObject(obj) {
    const index = this.objects.indexOf(obj);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }

  /**
   * Игровой цикл
   */
  gameLoop(timestamp) {
    if (!this.isRunning) return;

    requestAnimationFrame((ts) => this.gameLoop(ts));

    // Обновление времени
    const delta = this.time.update(timestamp);

    // Шаг физики (фиксированный timestep)
    if (config.ENABLE_PHYSICS && this.physicsWorld) {
      while (this.time.shouldPhysicsStep()) {
        this.physicsWorld.step();
        this.time.physicsStep();
      }
      
      // Синхронизация мешей с физикой
      this.physicsWorld.sync();
    }

    // Отладочный рендер
    if (this.debugRenderer) {
      this.debugRenderer.render();
    }

    // Обновление объектов
    this.objects.forEach(obj => {
      if (obj.update) {
        obj.update(delta);
      }
    });

    // Сброс дельты мыши
    if (this.inputManager) {
      this.inputManager.resetMouseDelta();
    }

    // Обновление FPS counter
    this.updateFPSCounter();

    // Рендер сцены
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Обновить счётчик FPS
   */
  updateFPSCounter() {
    const fpsElement = document.getElementById('fps-counter');
    if (fpsElement && config.DEBUG.SHOW_FPS) {
      fpsElement.textContent = `FPS: ${this.time.getFPS()}`;
    }
  }

  /**
   * Запуск игры
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Vietnam Huey - Starting game loop');
    requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  /**
   * Остановка игры
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Очистка ресурсов
   */
  dispose() {
    this.stop();
    
    if (this.inputManager) {
      this.inputManager.dispose();
    }
    
    if (this.physicsWorld) {
      this.physicsWorld.dispose();
    }
    
    if (this.debugRenderer) {
      this.debugRenderer.dispose();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
    
    this.objects = [];
  }
}

export default Game;
