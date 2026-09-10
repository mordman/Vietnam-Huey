import * as THREE from 'three';

export class PlayerController {
  constructor(helicopter, inputManager) {
    this.helicopter = helicopter;
    this.input = inputManager;
    this.position = 3;
    this.previousKeys = new Set();
    this.offsets = {
      1: new THREE.Vector3(0.9, 1.1, -2.8),
      2: new THREE.Vector3(-3.3, 0.8, 0.5),
      3: new THREE.Vector3(28, 16, 28),
    };
  }

  update() {
    for (const [code, position] of [['Digit1', 1], ['Digit2', 2], ['Digit3', 3]]) {
      if (this.input.isKeyDown(code) && !this.previousKeys.has(code)) this.position = position;
    }
    this.previousKeys = new Set(['Digit1', 'Digit2', 'Digit3'].filter(code => this.input.isKeyDown(code)));
  }

  getCameraTarget(camera) {
    const offset = this.offsets[this.position].clone();
    offset.applyQuaternion(this.helicopter.quaternion);
    const target = this.helicopter.position.clone().add(offset);
    if (this.position === 3) return { position: target, lookAt: this.helicopter.position.clone() };

    const lookDirection = new THREE.Vector3(0, 0, -12).applyQuaternion(this.helicopter.quaternion);
    return { position: target, lookAt: this.helicopter.position.clone().add(lookDirection) };
  }
}

export default PlayerController;