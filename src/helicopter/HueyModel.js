import * as THREE from 'three';

export class HueyModel {
  constructor() {
    this.root = new THREE.Group();
    this.rotor = new THREE.Group();
    this.build();
  }

  build() {
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x5d6b4b, roughness: 0.8 });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x202622, roughness: 0.65, metalness: 0.2 });
    const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x244a52, transparent: true, opacity: 0.55 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 10), bodyMaterial);
    body.scale.set(1.7, 0.85, 3.2);
    body.castShadow = true;
    this.root.add(body);

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.9, 2.8), glassMaterial);
    cockpit.position.set(0, 0.55, -2.3);
    cockpit.castShadow = true;
    this.root.add(cockpit);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 8), bodyMaterial);
    tail.position.set(0, 0.25, 5.1);
    tail.castShadow = true;
    this.root.add(tail);

    const skidGeometry = new THREE.CylinderGeometry(0.12, 0.12, 7, 8);
    for (const x of [-2.5, 2.5]) {
      const skid = new THREE.Mesh(skidGeometry, darkMaterial);
      skid.rotation.z = Math.PI / 2;
      skid.position.set(x, -2.3, 0);
      skid.castShadow = true;
      this.root.add(skid);
    }

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8), darkMaterial);
    mast.position.y = 2.5;
    this.root.add(mast);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 15), darkMaterial);
    this.rotor.position.y = 3.1;
    this.rotor.add(blade);
    this.root.add(this.rotor);
  }

  update(delta) {
    this.rotor.rotation.y += delta * 18;
  }

  dispose() {
    this.root.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      object.material.dispose();
    });
  }
}

export default HueyModel;