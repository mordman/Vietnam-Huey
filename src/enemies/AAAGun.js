import * as THREE from 'three';

export class AAAGun {
  constructor(scene, projectileManager, explosion, target) {
    this.scene = scene;
    this.projectiles = projectileManager;
    this.explosion = explosion;
    this.target = target;
    this.cooldown = 2;
    this.position = new THREE.Vector3();
    this.mesh = this.createMesh();
  }

  createMesh() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x343c31, roughness: 1 })
    );
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 7, 8),
      new THREE.MeshStandardMaterial({ color: 0x171b18, metalness: 0.6 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -3.5;
    group.add(base, barrel);
    return group;
  }

  place(position) {
    this.position.copy(position);
    this.mesh.position.copy(position);
    this.scene.add(this.mesh);
  }

  update(delta) {
    if (!this.target || !this.target.visible) return;
    this.cooldown -= delta;
    this.mesh.lookAt(this.target.position);
    if (this.cooldown > 0) return;
    this.cooldown = 3;
    this.projectiles.launch(this.position.clone().add(new THREE.Vector3(0, 3, 0)), this.target.position);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      object.material.dispose();
    });
  }
}

export default AAAGun;