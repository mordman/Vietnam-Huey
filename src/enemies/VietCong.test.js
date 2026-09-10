import { describe, expect, it } from 'vitest';
import { ENEMY_STATES, VietCong } from './VietCong.js';

function meshAt(x, z) {
  return {
    position: { x, y: 0, z, distanceTo(point) { return Math.hypot(this.x - point.x, this.z - point.z); } },
    rotation: { y: 0 },
    lookAt() {},
  };
}

describe('VietCong', () => {
  it('transitions from patrol to alert and attack by distance', () => {
    const enemy = new VietCong(meshAt(200, 0), {}, { destroyed: false });
    enemy.update(1, { x: 0, y: 0, z: 0 });
    expect(enemy.state).toBe(ENEMY_STATES.PATROL);

    enemy.mesh.position.x = 100;
    enemy.update(1, { x: 0, y: 0, z: 0 });
    expect(enemy.state).toBe(ENEMY_STATES.ALERT);

    enemy.mesh.position.x = 40;
    enemy.update(1, { x: 0, y: 0, z: 0 });
    expect(enemy.state).toBe(ENEMY_STATES.ATTACK);
  });

  it('ignores an update without a player position', () => {
    const enemy = new VietCong(meshAt(10, 0), {}, { destroyed: false });

    expect(() => enemy.update(1, undefined)).not.toThrow();
    expect(enemy.state).toBe(ENEMY_STATES.PATROL);
  });
});