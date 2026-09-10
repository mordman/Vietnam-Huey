export const ENEMY_STATES = Object.freeze({
  PATROL: 'patrol',
  ALERT: 'alert',
  ATTACK: 'attack',
  FLEE: 'flee',
});

export class VietCong {
  constructor(mesh, body, damageEntity) {
    this.mesh = mesh;
    this.body = body;
    this.damageEntity = damageEntity;
    this.state = ENEMY_STATES.PATROL;
    this.alertDistance = 150;
    this.attackDistance = 70;
  }

  update(delta, playerPosition) {
    if (this.damageEntity.destroyed || !playerPosition) return;
    const distance = this.mesh.position.distanceTo(playerPosition);
    if (distance <= this.attackDistance) this.state = ENEMY_STATES.ATTACK;
    else if (distance <= this.alertDistance) this.state = ENEMY_STATES.ALERT;
    else this.state = ENEMY_STATES.PATROL;

    if (this.state === ENEMY_STATES.ALERT || this.state === ENEMY_STATES.ATTACK) {
      this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
    } else {
      this.mesh.rotation.y += delta * 0.2;
    }
  }
}

export default VietCong;