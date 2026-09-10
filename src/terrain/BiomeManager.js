import { createNoise2D } from 'simplex-noise';

function seededRandom(seed) {
  let value = Math.floor(seed) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export const BIOMES = Object.freeze({
  JUNGLE: 'jungle',
  HIGHLANDS: 'highlands',
  MEKONG: 'mekong',
  COASTAL: 'coastal',
});

const colors = {
  [BIOMES.JUNGLE]: [0.18, 0.34, 0.12],
  [BIOMES.HIGHLANDS]: [0.34, 0.31, 0.18],
  [BIOMES.MEKONG]: [0.28, 0.42, 0.18],
  [BIOMES.COASTAL]: [0.58, 0.48, 0.25],
};

export class BiomeManager {
  constructor(seed = 1) {
    this.noise2D = createNoise2D(seededRandom(seed + 17));
  }

  getBiome(worldX, worldZ) {
    const region = this.noise2D(worldX * 0.0007, worldZ * 0.0007);
    if (region < -0.45) return BIOMES.MEKONG;
    if (region < -0.05) return BIOMES.COASTAL;
    if (region > 0.48) return BIOMES.HIGHLANDS;
    return BIOMES.JUNGLE;
  }

  getColor(worldX, worldZ, defoliation = 0, crater = 0) {
    const base = colors[this.getBiome(worldX, worldZ)];
    const dead = Math.min(1, defoliation * 0.75 + crater * 0.35);
    return [
      base[0] * (1 - dead) + 0.34 * dead,
      base[1] * (1 - dead) + 0.27 * dead,
      base[2] * (1 - dead) + 0.16 * dead,
    ];
  }
}

export default BiomeManager;