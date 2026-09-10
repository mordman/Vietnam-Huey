import { describe, expect, it } from 'vitest';
import { TerrainGenerator } from './TerrainGenerator.js';

describe('TerrainGenerator', () => {
  it('generates deterministic heights for the same seed and chunk', () => {
    const first = new TerrainGenerator({ resolution: 16, seed: 42 }).generate(2, -1);
    const second = new TerrainGenerator({ resolution: 16, seed: 42 }).generate(2, -1);

    expect(Array.from(first.heights)).toEqual(Array.from(second.heights));
  });

  it('generates a complete heightfield within the configured scale', () => {
    const heightScale = 80;
    const { heights } = new TerrainGenerator({
      resolution: 16,
      heightScale,
      seed: 7,
    }).generate(0, 0);

    expect(heights).toHaveLength(16 * 16);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(-heightScale);
    expect(Math.max(...heights)).toBeLessThanOrEqual(heightScale);
    expect(Math.max(...heights)).toBeGreaterThan(Math.min(...heights));
  });
});