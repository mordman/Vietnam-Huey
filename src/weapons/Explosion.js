import * as THREE from 'three';

export class Explosion {
  constructor(scene, damageSystem, audio = null) {
    this.scene = scene;
    this.damageSystem = damageSystem;
    this.audio = audio;
    this.effects = [];
  }

  detonate(position, targetMesh, { radius = 12, damage = 35 } = {}) {
    this.audio?.playExplosion();
    const geometry = new THREE.SphereGeometry(1, 12, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff9d32,
      transparent: true,
      opacity: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.effects.push({ mesh, ttl: 0.35, radius });
    if (targetMesh && position.distanceTo(targetMesh.position) <= radius) {
      this.damageSystem.applyDamage(targetMesh, damage, 'fuselage');
    }
  }

  update(delta) {
    this.effects = this.effects.filter((effect) => {
      effect.ttl -= delta;
      effect.mesh.scale.setScalar(effect.radius * (1 - Math.max(0, effect.ttl) / 0.35));
      effect.mesh.material.opacity = Math.max(0, effect.ttl / 0.35);
      if (effect.ttl > 0) return true;
      this.scene.remove(effect.mesh);
      effect.mesh.geometry.dispose();
      effect.mesh.material.dispose();
      return false;
    });
  }

  dispose() {
    for (const effect of this.effects) {
      this.scene.remove(effect.mesh);
      effect.mesh.geometry.dispose();
      effect.mesh.material.dispose();
    }
    this.effects = [];
  }
}

export default Explosion;