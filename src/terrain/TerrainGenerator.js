import { createNoise2D } from 'simplex-noise';

function createSeededRandom(seed) {
  let value = Math.floor(seed) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export class TerrainGenerator {
  constructor({ resolution = 64, chunkSize = 256, heightScale = 40, seed = 1 } = {}) {
    this.resolution = resolution;
    this.chunkSize = chunkSize;
    this.heightScale = heightScale;
    this.noise2D = createNoise2D(createSeededRandom(seed));
  }

  generate(chunkX, chunkZ) {
    const { resolution, chunkSize } = this;
    const heights = new Float32Array(resolution * resolution);
    const step = chunkSize / (resolution - 1);

    for (let z = 0; z < resolution; z += 1) {
      for (let x = 0; x < resolution; x += 1) {
        const worldX = chunkX * chunkSize + x * step;
        const worldZ = chunkZ * chunkSize + z * step;
        let value = 0;
        let amplitude = 1;
        let frequency = 0.004;
        let amplitudeSum = 0;

        for (let octave = 0; octave < 6; octave += 1) {
          value += this.noise2D(worldX * frequency, worldZ * frequency) * amplitude;
          amplitudeSum += amplitude;
          amplitude *= 0.5;
          frequency *= 2;
        }

        heights[z * resolution + x] = (value / amplitudeSum) * this.heightScale;
      }
    }

    return { heights, step };
  }
}

export default TerrainGenerator;