import { describe, expect, it, vi } from 'vitest';
import { DamageSystem } from './DamageSystem.js';

describe('DamageSystem', () => {
  it('reduces health and reports the active zone', () => {
    const system = new DamageSystem();
    const mesh = { userData: {} };
    system.register(mesh, { health: 30, zone: 'engine' });

    const result = system.applyDamage(mesh, 10);

    expect(result.health).toBe(20);
    expect(result.zone).toBe('engine');
  });

  it('calls the destruction callback once at zero health', () => {
    const system = new DamageSystem();
    const mesh = { userData: {} };
    const onDestroyed = vi.fn();
    system.register(mesh, { health: 10, onDestroyed });

    system.applyDamage(mesh, 15);
    system.applyDamage(mesh, 15);

    expect(onDestroyed).toHaveBeenCalledTimes(1);
    expect(mesh.userData.damageEntity.destroyed).toBe(true);
  });
});