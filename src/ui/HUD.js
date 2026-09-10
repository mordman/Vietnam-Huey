export class HUD {
  constructor(root, { helicopter, flightController, playerController, m60, damageSystem }) {
    this.root = root;
    this.helicopter = helicopter;
    this.flightController = flightController;
    this.playerController = playerController;
    this.m60 = m60;
    this.damageSystem = damageSystem;
    this.healthEntity = damageSystem?.entities.get(helicopter) ?? null;
    this.elements = {
      altitude: root.querySelector('[data-hud="altitude"]'),
      speed: root.querySelector('[data-hud="speed"]'),
      health: root.querySelector('[data-hud="health"]'),
      ammo: root.querySelector('[data-hud="ammo"]'),
      position: root.querySelector('[data-hud="position"]'),
    };
  }

  update() {
    const velocity = this.flightController.body.linvel();
    this.elements.altitude.textContent = `${Math.max(0, this.helicopter.position.y).toFixed(0)} m`;
    this.elements.speed.textContent = `${Math.hypot(velocity.x, velocity.y, velocity.z).toFixed(0)} m/s`;
    this.elements.health.textContent = this.healthEntity
      ? `${this.healthEntity.health}/${this.healthEntity.maxHealth}`
      : '--';
    this.elements.ammo.textContent = `${this.m60.ammo}`;
    this.elements.position.textContent = ['PILOT', 'GUNNER', 'EXTERNAL'][this.playerController.position - 1] ?? 'EXTERNAL';
  }
}

export default HUD;