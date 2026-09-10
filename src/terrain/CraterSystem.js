function hash(x, z) {
  const value = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export class CraterSystem {
  constructor({ chunkSize = 256, seed = 1, density = 0.65 } = {}) {
    this.chunkSize = chunkSize;
    this.seed = seed;
    this.density = density;
  }

  getCraters(chunkX, chunkZ) {
    const craters = [];
    const count = Math.floor(this.density * 5);
    for (let index = 0; index < count; index += 1) {
      const sample = hash(chunkX * 31 + index + this.seed, chunkZ * 17 - index);
      const sampleZ = hash(chunkX * 13 - index, chunkZ * 29 + this.seed);
      craters.push({
        x: (chunkX + sample) * this.chunkSize,
        z: (chunkZ + sampleZ) * this.chunkSize,
        radius: 8 + hash(chunkX + index, chunkZ - index) * 17,
        depth: 3 + hash(chunkX - index, chunkZ + index) * 8,
      });
    }
    return craters;
  }

  apply(heights, resolution, chunkX, chunkZ) {
    const step = this.chunkSize / (resolution - 1);
    const craters = this.getCraters(chunkX, chunkZ);
    for (let z = 0; z < resolution; z += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const worldX = chunkX * this.chunkSize + x * step;
        const worldZ = chunkZ * this.chunkSize + z * step;
        for (const crater of craters) {
          const distance = Math.hypot(worldX - crater.x, worldZ - crater.z);
          if (distance < crater.radius) {
            const factor = 1 - distance / crater.radius;
            heights[z * resolution + x] -= crater.depth * factor * factor;
          }
        }
      }
    }
    return heights;
  }

  getStrength(worldX, worldZ, craters) {
    let strength = 0;
    for (const crater of craters) {
      const factor = 1 - Math.hypot(worldX - crater.x, worldZ - crater.z) / crater.radius;
      strength = Math.max(strength, factor > 0 ? factor : 0);
    }
    return strength;
  }
}

export default CraterSystem;