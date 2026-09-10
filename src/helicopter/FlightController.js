import * as THREE from 'three';

export class FlightController {
  constructor(body, model, inputManager) {
    this.body = body;
    this.model = model;
    this.input = inputManager;
    this.mass = 2200;
    this.maxTiltImpulse = 2.8;
  }

  update(delta) {
    const forward = this.input.isKeyDown('KeyW') ? 1 : this.input.isKeyDown('KeyS') ? -1 : 0;
    const roll = this.input.isKeyDown('KeyD') ? 1 : this.input.isKeyDown('KeyA') ? -1 : 0;
    const yaw = this.input.isKeyDown('KeyE') ? 1 : this.input.isKeyDown('KeyQ') ? -1 : 0;
    const lift = (this.input.isKeyDown('ShiftLeft') || this.input.isKeyDown('Space') ? 1 : 0)
      - (this.input.isKeyDown('ControlLeft') ? 1 : 0);
    const velocity = this.body.linvel();
    const targetVerticalSpeed = lift * 16;
    const verticalImpulse = (targetVerticalSpeed - velocity.y) * this.mass * delta;

    this.body.applyImpulse({ x: 0, y: verticalImpulse, z: 0 }, true);
    this.body.applyTorqueImpulse({
      x: -forward * this.maxTiltImpulse * delta,
      y: yaw * this.maxTiltImpulse * 0.7 * delta,
      z: -roll * this.maxTiltImpulse * delta,
    }, true);

    const rotation = this.body.rotation();
    const orientation = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    const thrust = new THREE.Vector3(0, 0, -forward * 1600 * delta).applyQuaternion(orientation);
    this.body.applyImpulse({ x: thrust.x, y: thrust.y, z: thrust.z }, true);
    this.model.update(delta);
  }
}

export default FlightController;