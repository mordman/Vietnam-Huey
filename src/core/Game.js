/**
 * Game.js - Оркестратор игры
 * Управляет основными подсистемами и игровым циклом
 */

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { config } from '../config.js';
import { Time } from './Time.js';
import { InputManager } from './InputManager.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { DebugRenderer } from '../physics/DebugRenderer.js';
import { ChunkManager } from '../terrain/ChunkManager.js';
import { HueyModel } from '../helicopter/HueyModel.js';
import { FlightController } from '../helicopter/FlightController.js';
import { PlayerController } from '../player/PlayerController.js';
import { M60 } from '../weapons/M60.js';
import { DamageSystem } from '../helicopter/DamageSystem.js';
import { EnemyManager } from '../enemies/EnemyManager.js';
import { ProjectileManager } from '../weapons/Projectiles.js';
import { Explosion } from '../weapons/Explosion.js';
import { AAAGun } from '../enemies/AAAGun.js';
import { HUD } from '../ui/HUD.js';
import { AudioManager } from './AudioManager.js';
import { PauseMenu } from '../ui/PauseMenu.js';

export class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.time = null;
    this.inputManager = null;
    this.physicsWorld = null;
    this.debugRenderer = null;
    this.chunkManager = null;
    this.helicopter = null;
    this.flightController = null;
    this.playerController = null;
    this.m60 = null;
    this.damageSystem = null;
    this.enemyManager = null;
    this.projectileManager = null;
    this.explosion = null;
    this.aaGun = null;
    this.hud = null;
    this.audio = null;
    this.pauseMenu = null;
    this.paused = false;
    this.isRunning = false;
    this.objects = []; // Объекты для обновления
    
    // Камера для свободного полёта (для тестирования terrain)
    this.cameraAngle = 0;
    this.cameraHeight = 50;
    this.cameraDistance = 100;
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
    this.audio = new AudioManager();
    this.inputManager.on('keydown-any', (event) => {
      this.audio.resume();
      if (event.code === 'Escape') this.togglePause();
    });
    
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
    
    // Terrain (Этап 2)
    if (config.ENABLE_TERRAIN && this.physicsWorld) {
      this.chunkManager = new ChunkManager(
        this.scene,
        this.physicsWorld,
        {
          chunkSize: 256,
          resolution: 128,
          heightScale: 400,
          renderDistance: 3,
          seed: Math.random() * 10000
        }
      );
      
      // Генерируем начальные чанки вокруг камеры
      const cameraPos = this.camera.position;
      this.chunkManager.update(cameraPos);
      
      console.log('Terrain system initialized');
    }

    if (config.ENABLE_HUEY && this.physicsWorld) {
      this.damageSystem = new DamageSystem();
      this.createHuey();
      this.createTestTarget();
      this.damageSystem.register(this.helicopter, {
        health: 200,
        zone: 'fuselage',
        onDestroyed: () => { this.helicopter.visible = false; },
      });
      this.explosion = new Explosion(this.scene, this.damageSystem, this.audio);
      this.projectileManager = new ProjectileManager(
        this.scene,
        this.physicsWorld,
        this.damageSystem,
        this.explosion
      );
      this.aaGun = new AAAGun(this.scene, this.projectileManager, this.explosion, this.helicopter);
      this.aaGun.place(new THREE.Vector3(70, 8, -80));
      this.addObject(this.projectileManager);
      this.addObject(this.explosion);
      this.addObject(this.aaGun);
      if (config.ENABLE_ENEMIES) {
        this.enemyManager = new EnemyManager(
          this.scene,
          this.physicsWorld,
          this.damageSystem,
          { seed: 3, maxEnemies: 8 }
        );
        this.enemyManager.spawnAround(this.helicopter.position);
        this.addObject(this.enemyManager);
      }
      if (config.ENABLE_HUD) {
        this.hud = new HUD(document.getElementById('hud'), {
          helicopter: this.helicopter,
          flightController: this.flightController,
          playerController: this.playerController,
          m60: this.m60,
          damageSystem: this.damageSystem,
        });
        this.addObject(this.hud);
      }
    }
    
    // Тестовые объекты (только если terrain отключён)
    if (!config.ENABLE_TERRAIN) {
      this.createTestObjects();
    } else if (!config.ENABLE_HUEY) {
      // Создаём тестовый куб над terrain
      this.createTestCube();
    }
    
    console.log('Vietnam Huey - Initialization complete');
    this.pauseMenu = new PauseMenu(document.getElementById('pause-menu'), () => this.togglePause(false));
    return this;
  }

  createHuey() {
    const model = new HueyModel();
    model.root.position.set(0, 120, 0);
    this.scene.add(model.root);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(3.8, 1.8, 7);
    const body = this.physicsWorld.createDynamicBody(model.root, colliderDesc, 2200, true);
    this.helicopter = model.root;
    this.flightController = new FlightController(body, model, this.inputManager);
    this.playerController = new PlayerController(model.root, this.inputManager);
    this.m60 = new M60(
      this.scene,
      this.camera,
      this.physicsWorld,
      this.inputManager,
      this.playerController,
        this.damageSystem,
        this.audio
    );
    this.addObject(this.flightController);
    this.addObject(this.playerController);
    this.addObject(this.m60);
  }

  createTestTarget() {
    const geometry = new THREE.BoxGeometry(5, 7, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x9c3026, roughness: 0.8 });
    const target = new THREE.Mesh(geometry, material);
    target.position.set(0, 120, -80);
    target.castShadow = true;
    this.scene.add(target);
    const body = this.physicsWorld.createStaticBody(target, RAPIER.ColliderDesc.cuboid(2.5, 3.5, 1));
    this.damageSystem.register(target, {
      health: 100,
      zone: 'target',
      onDestroyed: () => {
        target.visible = false;
        this.physicsWorld.removeBody(body);
      },
    });
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
   * Создать тестовый куб для падения на terrain
   */
  createTestCube() {
    if (!config.ENABLE_PHYSICS || !this.physicsWorld) return;

    import('@dimforge/rapier3d-compat').then(RAPIER => {
      // Куб
      const cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
      const cubeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6600,
        roughness: 0.7,
        metalness: 0.3
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(0, 200, 0); // Высоко над terrain
      cube.castShadow = true;
      this.scene.add(cube);

      const colliderDesc = RAPIER.ColliderDesc.cuboid(2, 2, 2);
      this.physicsWorld.createDynamicBody(cube, colliderDesc, 100, true);
      
      console.log('Test cube created above terrain');
    });
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

    if (this.paused) {
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame((ts) => this.gameLoop(ts));
      return;
    }

    // Обработка ввода для камеры (свободный полёт)
    if (!this.helicopter) this.handleCameraInput(delta);

    // Обновление terrain чанков
    if (this.chunkManager && config.ENABLE_TERRAIN) {
      this.chunkManager.update(this.helicopter?.position ?? this.camera.position);
      
      // Обновляем счётчик чанков в debug info
      const chunksCountEl = document.getElementById('chunks-count');
      if (chunksCountEl) {
        chunksCountEl.textContent = this.chunkManager.chunks.size;
      }
    }

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

    if (this.flightController) {
      const velocity = this.flightController.body.linvel();
      this.audio.update(Math.hypot(velocity.x, velocity.y, velocity.z));
    }

    if (this.helicopter) this.updateHelicopterCamera(delta);

    // Сброс дельты мыши
    if (this.inputManager) {
      this.inputManager.resetMouseDelta();
    }

    // Обновление FPS counter
    this.updateFPSCounter();

    // Рендер сцены
    this.renderer.render(this.scene, this.camera);
  }

  togglePause(force = null) {
    this.paused = force === null ? !this.paused : force;
    this.pauseMenu?.toggle(this.paused);
    if (this.paused) this.audio.context?.suspend();
    else this.audio.resume();
  }

  updateHelicopterCamera(delta) {
    const view = this.playerController.getCameraTarget(this.camera);
    const blend = Math.min(1, delta * 4);
    this.camera.position.lerp(view.position, blend);
    this.camera.lookAt(view.lookAt.x, view.lookAt.y, view.lookAt.z);
  }

  /**
   * Обработка ввода для свободного полёта камеры
   */
  handleCameraInput(delta) {
    const speed = 50 * delta; // Скорость камеры
    const rotSpeed = 1.5 * delta;
    
    // Вращение камеры мышью
    if (this.inputManager.mouse.x !== 0 || this.inputManager.mouse.y !== 0) {
      this.cameraAngle -= this.inputManager.mouse.x * 0.002;
      this.cameraHeight = Math.max(10, Math.min(200, this.cameraHeight - this.inputManager.mouse.y * 0.5));
    }
    
    // Движение клавишами WASD
    const forward = this.inputManager.isKeyDown('KeyW');
    const backward = this.inputManager.isKeyDown('KeyS');
    const left = this.inputManager.isKeyDown('KeyA');
    const right = this.inputManager.isKeyDown('KeyD');
    const up = this.inputManager.isKeyDown('ShiftLeft') || this.inputManager.isKeyDown('Space');
    const down = this.inputManager.isKeyDown('ControlLeft');
    
    // Вычисляем направление движения
    const dirX = Math.sin(this.cameraAngle);
    const dirZ = Math.cos(this.cameraAngle);
    
    if (forward) {
      this.camera.position.x += dirX * speed;
      this.camera.position.z += dirZ * speed;
    }
    if (backward) {
      this.camera.position.x -= dirX * speed;
      this.camera.position.z -= dirZ * speed;
    }
    if (left) {
      this.camera.position.x += Math.sin(this.cameraAngle - Math.PI/2) * speed;
      this.camera.position.z += Math.cos(this.cameraAngle - Math.PI/2) * speed;
    }
    if (right) {
      this.camera.position.x += Math.sin(this.cameraAngle + Math.PI/2) * speed;
      this.camera.position.z += Math.cos(this.cameraAngle + Math.PI/2) * speed;
    }
    if (up) {
      this.camera.position.y += speed;
    }
    if (down) {
      this.camera.position.y -= speed;
    }
    
    // Камера смотрит вперёд по углу
    const lookAtX = this.camera.position.x + Math.sin(this.cameraAngle) * 10;
    const lookAtZ = this.camera.position.z + Math.cos(this.cameraAngle) * 10;
    const lookAtY = this.camera.position.y;
    
    this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
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
    
    if (this.chunkManager) {
      this.chunkManager.dispose();
    }

    if (this.enemyManager) {
      this.enemyManager.dispose();
    }

    if (this.projectileManager) this.projectileManager.dispose();
    if (this.explosion) this.explosion.dispose();
    if (this.aaGun) this.aaGun.dispose();

    if (this.physicsWorld) {
      this.physicsWorld.dispose();
    }

    this.audio?.dispose();

    if (this.damageSystem) {
      this.damageSystem.dispose();
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
