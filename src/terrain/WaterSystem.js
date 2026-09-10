import * as THREE from 'three';
import { BIOMES } from './BiomeManager.js';

export class WaterSystem {
  constructor(chunkSize) {
    this.chunkSize = chunkSize;
    this.material = new THREE.MeshStandardMaterial({
      color: 0x2f7890,
      transparent: true,
      opacity: 0.55,
      roughness: 0.15,
      metalness: 0.05,
      depthWrite: false,
    });
  }

  createForChunk(scene, chunkX, chunkZ, biomeManager) {
    const centerX = (chunkX + 0.5) * this.chunkSize;
    const centerZ = (chunkZ + 0.5) * this.chunkSize;
    const biome = biomeManager.getBiome(centerX, centerZ);
    if (biome !== BIOMES.MEKONG) return null;

    const geometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize);
    geometry.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(geometry, this.material);
    water.position.set(centerX, 0, centerZ);
    water.renderOrder = 1;
    scene.add(water);
    return water;
  }

  remove(scene, water) {
    if (!water) return;
    scene.remove(water);
    water.geometry.dispose();
  }

  dispose() {
    this.material.dispose();
  }
}

export default WaterSystem;