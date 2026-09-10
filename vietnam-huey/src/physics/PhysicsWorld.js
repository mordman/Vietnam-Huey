/**
 * PhysicsWorld.js - Обёртка над Rapier3D
 * Управляет физическим миром, синхронизацией с Three.js мешами
 */

import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

export class PhysicsWorld {
  constructor() {
    this.world = null;
    this.bodyMeshMap = new Map(); // rigidBody -> mesh
    this.meshBodyMap = new Map(); // mesh -> rigidBody
    this.debugMesh = null;
    this.debugScene = null;
  }

  /**
   * Инициализация физического мира
   */
  async init() {
    await RAPIER.init();
    
    const gravity = { x: 0, y: -9.81, z: 0 };
    this.world = new RAPIER.World(gravity);
    
    // Настройка timestep
    this.world.timestep = 1 / 60;
    
    console.log('Physics world initialized');
    return this;
  }

  /**
   * Создать статическое тело (плоскость, стены)
   * @param {THREE.Mesh} mesh - Three.js меш
   * @param {Object} colliderDesc - описание коллайдера
   * @returns {RAPIER.RigidBody}
   */
  createStaticBody(mesh, colliderDesc) {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed();
    const body = this.world.createRigidBody(bodyDesc);
    
    const collider = this.world.createCollider(colliderDesc, body);
    
    this.bodyMeshMap.set(body, mesh);
    this.meshBodyMap.set(mesh, body);
    
    return body;
  }

  /**
   * Создать динамическое тело
   * @param {THREE.Mesh} mesh - Three.js меш
   * @param {Object} colliderDesc - описание коллайдера
   * @param {number} mass - масса тела
   * @param {boolean} ccd - включить continuous collision detection
   * @returns {RAPIER.RigidBody}
   */
  createDynamicBody(mesh, colliderDesc, mass = 1, ccd = false) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic();
    
    if (ccd) {
      bodyDesc.enableCcd(true);
    }
    
    const body = this.world.createRigidBody(bodyDesc);
    const collider = this.world.createCollider(colliderDesc, body);
    
    // Установка массы
    if (mass > 0) {
      body.setMass(mass);
    }
    
    this.bodyMeshMap.set(body, mesh);
    this.meshBodyMap.set(mesh, body);
    
    return body;
  }

  /**
   * Создать составной коллайдер для вертолёта
   * @param {RAPIER.RigidBody} body - тело вертолёта
   * @param {Array} parts - массив частей {shape, position, rotation}
   */
  createCompoundCollider(body, parts) {
    parts.forEach(part => {
      const colliderDesc = part.shape;
      if (part.position) {
        colliderDesc.setTranslation(part.position.x, part.position.y, part.position.z);
      }
      if (part.rotation) {
        colliderDesc.setRotation(part.rotation);
      }
      this.world.createCollider(colliderDesc, body);
    });
  }

  /**
   * Применить силу к телу
   * @param {THREE.Mesh} mesh - меш тела
   * @param {Object} force - вектор силы {x, y, z}
   * @param {boolean} wake - разбудить тело
   */
  applyForce(mesh, force, wake = true) {
    const body = this.meshBodyMap.get(mesh);
    if (body) {
      body.applyImpulse({ x: force.x, y: force.y, z: force.z }, wake);
    }
  }

  /**
   * Применить момент силы (вращение)
   * @param {THREE.Mesh} mesh - меш тела
   * @param {Object} torque - вектор момента {x, y, z}
   */
  applyTorque(mesh, torque) {
    const body = this.meshBodyMap.get(mesh);
    if (body) {
      body.applyTorqueImpulse({ x: torque.x, y: torque.y, z: torque.z }, true);
    }
  }

  /**
   * Шаг физики
   */
  step() {
    if (this.world) {
      this.world.step();
    }
  }

  /**
   * Синхронизировать физические тела с Three.js мешами
   */
  sync() {
    for (const [body, mesh] of this.bodyMeshMap.entries()) {
      if (body.isFixed()) continue; // Статические тела не двигаются
      
      const translation = body.translation();
      const rotation = body.rotation();
      
      mesh.position.set(translation.x, translation.y, translation.z);
      mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  }

  /**
   * Raycast - луч из точки в направлении
   * @param {Object} from - начало луча {x, y, z}
   * @param {Object} to - конец луча {x, y, z}
   * @param {number} filterGroups - группы коллизий для фильтрации
   * @returns {Object|null} результат попадания или null
   */
  raycast(from, to, filterGroups = null) {
    const ray = {
      origin: { x: from.x, y: from.y, z: from.z },
      dir: { 
        x: to.x - from.x, 
        y: to.y - from.y, 
        z: to.z - from.z 
      }
    };
    
    // Нормализация направления
    const len = Math.sqrt(ray.dir.x ** 2 + ray.dir.y ** 2 + ray.dir.z ** 2);
    if (len > 0) {
      ray.dir.x /= len;
      ray.dir.y /= len;
      ray.dir.z /= len;
    }
    
    const maxToi = len;
    
    let result = null;
    
    // Простой raycast без фильтрации групп
    const hit = this.world.castRay(ray, maxToi, true, filterGroups);
    
    if (hit && hit.collider) {
      result = {
        point: hit.toi ? {
          x: from.x + ray.dir.x * hit.toi,
          y: from.y + ray.dir.y * hit.toi,
          z: from.z + ray.dir.z * hit.toi,
        } : null,
        distance: hit.toi || 0,
      };
    }
    
    return result;
  }

  /**
   * Очистка
   */
  dispose() {
    this.bodyMeshMap.clear();
    this.meshBodyMap.clear();
    if (this.world) {
      this.world.free();
    }
  }
}

export default PhysicsWorld;
