import * as THREE from 'three';

export class M60 {
  constructor(scene, camera, physicsWorld, inputManager, playerController, damageSystem = null, audio = null) {
    this.scene = scene;
    this.camera = camera;
    this.physicsWorld = physicsWorld;
    this.input = inputManager;
    this.player = playerController;
    this.damageSystem = damageSystem;
    this.audio = audio;
    this.cooldown = 0;
    this.fireInterval = 60 / 600;
    this.ammo = 500;
    this.tracers = [];
  }

  update(delta) {
    this.cooldown = Math.max(0, this.cooldown - delta);
    this.tracers = this.tracers.filter((tracer) => {
      tracer.ttl -= delta;
      if (tracer.ttl <= 0) {
        this.scene.remove(tracer.line);
        tracer.line.geometry.dispose();
        tracer.line.material.dispose();
        return false;
      }
      return true;
    });

    if (this.player.position === 2 && this.input.mouse.leftDown && this.cooldown === 0 && this.ammo > 0) {
      this.fire();
    }
    const ammoElement = document.getElementById('ammo-count');
    if (ammoElement) ammoElement.textContent = this.ammo;
  }

  fire() {
    this.cooldown = this.fireInterval;
    this.ammo -= 1;
    this.audio?.playShot();
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    const end = origin.clone().addScaledVector(direction, 500);
    const hit = this.physicsWorld.raycast(origin, end);
    const tracerEnd = hit?.point ? new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z) : end;
    if (hit?.mesh && hit.mesh !== this.player.helicopter) {
      this.damageSystem?.applyDamage(hit.mesh, 10);
    }
    const geometry = new THREE.BufferGeometry().setFromPoints([origin, tracerEnd]);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffe8a0 }));
    this.scene.add(line);
    this.tracers.push({ line, ttl: 0.08 });
  }
}

export default M60;