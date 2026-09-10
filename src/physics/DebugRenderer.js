/**
 * DebugRenderer.js - Визуализация коллайдеров для отладки
 * Включается по F3
 */

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class DebugRenderer {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;
    this.enabled = false;
    this.group = new THREE.Group();
    this.lines = [];
  }

  /**
   * Инициализация
   */
  init() {
    // Создаём материал для отладочных линий
    this.material = new THREE.LineBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        this.toggle();
      }
    });
    
    return this;
  }

  /**
   * Переключить видимость
   */
  toggle() {
    this.enabled = !this.enabled;
    this.group.visible = this.enabled;
    console.log(`Debug renderer: ${this.enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Отрисовать коллайдеры
   */
  render() {
    if (!this.enabled || !this.physicsWorld.world) return;

    // Очищаем старые линии
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      child.geometry.dispose();
      this.group.remove(child);
    }
    this.lines = [];

    // Проходим по всем телам
    for (const [body, mesh] of this.physicsWorld.bodyMeshMap.entries()) {
      const colliders = body.colliders();
      
      for (let i = 0; i < colliders.length; i++) {
        const collider = colliders[i];
        const shape = collider.shape();
        
        // Получаем трансформацию коллайдера
        const pos = collider.translation();
        const rot = collider.rotation();
        
        // Рисуем в зависимости от типа формы
        this.drawShape(shape, pos, rot);
      }
    }
  }

  /**
   * Нарисовать форму
   */
  drawShape(shape, position, rotation) {
    const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    const pos = new THREE.Vector3(position.x, position.y, position.z);
    
    // Определяем тип формы и рисуем соответствующий контур
    const type = shape.type;
    
    switch (type) {
      case 0: // Ball (сфера)
        this.drawSphere(pos, quaternion, shape.radius);
        break;
      case 1: // Cuboid (бокс)
        this.drawCuboid(pos, quaternion, shape.halfExtents);
        break;
      case 4: // Cylinder (цилиндр)
        this.drawCylinder(pos, quaternion, shape.halfHeight, shape.radius);
        break;
      default:
        // Для сложных форм рисуем упрощённый бокс
        this.drawCuboid(pos, quaternion, { x: 0.5, y: 0.5, z: 0.5 });
    }
  }

  /**
   * Нарисовать сферу
   */
  drawSphere(position, quaternion, radius) {
    const geometry = new THREE.SphereGeometry(radius, 8, 6);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, this.material);
    line.position.copy(position);
    line.quaternion.copy(quaternion);
    this.group.add(line);
  }

  /**
   * Нарисовать бокс
   */
  drawCuboid(position, quaternion, halfExtents) {
    const width = halfExtents.x * 2;
    const height = halfExtents.y * 2;
    const depth = halfExtents.z * 2;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, this.material);
    line.position.copy(position);
    line.quaternion.copy(quaternion);
    this.group.add(line);
  }

  /**
   * Нарисовать цилиндр
   */
  drawCylinder(position, quaternion, halfHeight, radius) {
    const geometry = new THREE.CylinderGeometry(radius, radius, halfHeight * 2, 8);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, this.material);
    line.position.copy(position);
    line.quaternion.copy(quaternion);
    this.group.add(line);
  }

  /**
   * Добавить группу в сцену
   * @param {THREE.Scene} scene
   */
  addToScene(scene) {
    scene.add(this.group);
  }

  /**
   * Очистка
   */
  dispose() {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      if (child.geometry) {
        child.geometry.dispose();
      }
      this.group.remove(child);
    }
    this.material.dispose();
  }
}

export default DebugRenderer;
