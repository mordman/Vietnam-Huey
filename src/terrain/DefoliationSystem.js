import { createNoise2D } from 'simplex-noise';

function seededRandom(seed) {
  let value = Math.floor(seed) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export class DefoliationSystem {
  constructor(seed = 1) {
    this.noise2D = createNoise2D(seededRandom(seed + 71));
  }

  getMask(worldX, worldZ) {
    const bands = Math.sin(worldX * 0.006 + Math.sin(worldZ * 0.002)) * 0.5 + 0.5;
    const patches = this.noise2D(worldX * 0.0025, worldZ * 0.0025) * 0.5 + 0.5;
    return Math.max(0, Math.min(1, (bands * 0.55 + patches * 0.45 - 0.66) * 3));
  }
}

export default DefoliationSystem;