import * as THREE from 'three';
import { BIOMES } from './BiomeManager.js';

function seededRandom(seed) {
  let value = Math.floor(seed) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export class Vegetation {
  constructor(chunkSize, seed = 1) {
    this.chunkSize = chunkSize;
    this.seed = seed;
    this.trunkGeometry = new THREE.CylinderGeometry(0.35, 0.55, 6, 6);
    this.canopyGeometry = new THREE.ConeGeometry(3.2, 9, 7);
    this.trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4b3020, roughness: 1 });
    this.canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x234d24, roughness: 1 });
  }

  createForChunk(scene, chunkX, chunkZ, heights, resolution, biomeManager, defoliationSystem) {
    const centerX = (chunkX + 0.5) * this.chunkSize;
    const centerZ = (chunkZ + 0.5) * this.chunkSize;
    const biome = biomeManager.getBiome(centerX, centerZ);
    const count = biome === BIOMES.HIGHLANDS ? 18 : biome === BIOMES.MEKONG ? 8 : 34;
    const random = seededRandom(this.seed + chunkX * 92821 + chunkZ * 68917);
    const positions = [];

    for (let index = 0; index < count; index += 1) {
      const localX = (random() - 0.5) * (this.chunkSize - 12);
      const localZ = (random() - 0.5) * (this.chunkSize - 12);
      const worldX = centerX + localX;
      const worldZ = centerZ + localZ;
      if (defoliationSystem.getMask(worldX, worldZ) > 0.82) continue;
      positions.push({ localX, localZ, height: this.sampleHeight(heights, resolution, localX, localZ) });
    }

    const group = new THREE.Group();
    group.position.set(centerX, 0, centerZ);
    const trunks = new THREE.InstancedMesh(this.trunkGeometry, this.trunkMaterial, positions.length);
    const canopies = new THREE.InstancedMesh(this.canopyGeometry, this.canopyMaterial, positions.length);
    const matrix = new THREE.Matrix4();
    const rotation = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();

    positions.forEach((tree, index) => {
      const treeScale = 0.7 + random() * 0.7;
      position.set(tree.localX, tree.height + 3 * treeScale, tree.localZ);
      scale.set(treeScale, treeScale, treeScale);
      matrix.compose(position, rotation, scale);
      trunks.setMatrixAt(index, matrix);
      position.y = tree.height + 9 * treeScale;
      matrix.compose(position, rotation, scale);
      canopies.setMatrixAt(index, matrix);
    });

    trunks.instanceMatrix.needsUpdate = true;
    canopies.instanceMatrix.needsUpdate = true;
    trunks.castShadow = true;
    canopies.castShadow = true;
    group.add(trunks, canopies);
    scene.add(group);
    return group;
  }

  sampleHeight(heights, resolution, localX, localZ) {
    const coordinate = this.chunkSize / 2;
    const x = Math.max(0, Math.min(resolution - 1, Math.round(((localX + coordinate) / this.chunkSize) * (resolution - 1))));
    const z = Math.max(0, Math.min(resolution - 1, Math.round(((localZ + coordinate) / this.chunkSize) * (resolution - 1))));
    return heights[z * resolution + x];
  }

  remove(scene, group) {
    if (group) scene.remove(group);
  }

  dispose() {
    this.trunkGeometry.dispose();
    this.canopyGeometry.dispose();
    this.trunkMaterial.dispose();
    this.canopyMaterial.dispose();
  }
}

export default Vegetation;