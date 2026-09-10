import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class ProjectileManager {
  constructor(scene, physicsWorld, damageSystem, explosion = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.damageSystem = damageSystem;
    this.explosion = explosion;
    this.projectiles = [];
    this.geometry = new THREE.SphereGeometry(0.35, 8, 6);
    this.material = new THREE.MeshBasicMaterial({ color: 0xff6b32 });
  }

  launch(from, target, { speed = 90, damage = 25, ttl = 8 } = {}) {
    const mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.position.copy(from);
    this.scene.add(mesh);
    const direction = target.clone().sub(from).normalize();
    const body = this.physicsWorld.createDynamicBody(
      mesh,
      RAPIER.ColliderDesc.ball(0.35),
      1,
      true
    );
    body.setLinvel({ x: direction.x * speed, y: direction.y * speed, z: direction.z * speed }, true);
    this.projectiles.push({ mesh, body, damage, ttl });
  }

  update(delta, targetMesh) {
    for (const projectile of this.projectiles) {
      projectile.ttl -= delta;
      if (projectile.ttl <= 0) continue;
      if (targetMesh && projectile.mesh.position.distanceTo(targetMesh.position) < 5) {
        this.explosion?.detonate(projectile.mesh.position, targetMesh, {
          radius: 12,
          damage: projectile.damage,
        });
        if (!this.explosion) this.damageSystem.applyDamage(targetMesh, projectile.damage, 'cabin');
        projectile.ttl = 0;
      }
    }

    const active = [];
    for (const projectile of this.projectiles) {
      if (projectile.ttl > 0) {
        active.push(projectile);
        continue;
      }
      this.scene.remove(projectile.mesh);
      this.physicsWorld.removeBody(projectile.body);
    }
    this.projectiles = active;
  }

  dispose() {
    for (const projectile of this.projectiles) {
      this.scene.remove(projectile.mesh);
      this.physicsWorld.removeBody(projectile.body);
    }
    this.projectiles = [];
    this.geometry.dispose();
    this.material.dispose();
  }
}

export default ProjectileManager;