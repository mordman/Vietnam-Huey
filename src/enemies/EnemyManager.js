import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { VietCong } from './VietCong.js';

export class EnemyManager {
  constructor(scene, physicsWorld, damageSystem, { seed = 1, maxEnemies = 12 } = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.damageSystem = damageSystem;
    this.maxEnemies = maxEnemies;
    this.enemies = [];
    this.seed = seed;
    this.playerPosition = null;
    this.material = new THREE.MeshStandardMaterial({ color: 0x5a4730, roughness: 1 });
  }

  spawnAround(position) {
    this.playerPosition = position;
    while (this.enemies.length < this.maxEnemies) {
      const index = this.enemies.length;
      const angle = index * 2.399 + this.seed;
      const distance = 55 + (index % 4) * 18;
      const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 2.2, 4, 8), this.material);
      mesh.position.set(
        position.x + Math.cos(angle) * distance,
        position.y - 112,
        position.z + Math.sin(angle) * distance
      );
      mesh.castShadow = true;
      this.scene.add(mesh);
      const body = this.physicsWorld.createStaticBody(
        mesh,
        RAPIER.ColliderDesc.capsule(1.1, 0.7)
      );
      const damageEntity = this.damageSystem.register(mesh, {
        health: 30,
        zone: 'infantry',
        onDestroyed: () => {
          mesh.visible = false;
          this.physicsWorld.removeBody(body);
        },
      });
      this.enemies.push(new VietCong(mesh, body, damageEntity));
    }
  }

  update(delta, playerPosition = this.playerPosition) {
    if (!playerPosition) return;
    this.playerPosition = playerPosition;
    for (const enemy of this.enemies) enemy.update(delta, playerPosition);
    this.enemies = this.enemies.filter((enemy) => !enemy.damageEntity.destroyed);
  }

  dispose() {
    for (const enemy of this.enemies) {
      this.damageSystem.unregister(enemy.mesh);
      this.scene.remove(enemy.mesh);
      enemy.mesh.geometry.dispose();
      this.physicsWorld.removeBody(enemy.body);
    }
    this.enemies = [];
    this.material.dispose();
  }
}

export default EnemyManager;