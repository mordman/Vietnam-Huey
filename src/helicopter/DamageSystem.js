export const DAMAGE_ZONES = Object.freeze({
  ENGINE: 'engine',
  TRANSMISSION: 'transmission',
  TAIL: 'tail',
  ROTOR: 'rotor',
  CABIN: 'cabin',
  FUSELAGE: 'fuselage',
});

export class DamageSystem {
  constructor() {
    this.entities = new Map();
  }

  register(mesh, { health = 100, zone = DAMAGE_ZONES.FUSELAGE, onDestroyed = null } = {}) {
    const entity = {
      health,
      maxHealth: health,
      zone,
      onDestroyed,
      destroyed: false,
    };
    this.entities.set(mesh, entity);
    mesh.userData.damageEntity = entity;
    return entity;
  }

  applyDamage(mesh, amount, zone = null) {
    const entity = this.entities.get(mesh) ?? mesh?.userData?.damageEntity;
    if (!entity || entity.destroyed) return null;
    entity.health = Math.max(0, entity.health - amount);
    if (entity.health === 0) {
      entity.destroyed = true;
      entity.onDestroyed?.(entity);
    }
    return { ...entity, zone: zone ?? entity.zone };
  }

  unregister(mesh) {
    this.entities.delete(mesh);
    if (mesh?.userData) delete mesh.userData.damageEntity;
  }

  dispose() {
    this.entities.clear();
  }
}

export default DamageSystem;