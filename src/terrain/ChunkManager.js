import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator.js';
import { createHeightfieldCollider } from './TerrainPhysics.js';
import { BiomeManager } from './BiomeManager.js';
import { CraterSystem } from './CraterSystem.js';
import { DefoliationSystem } from './DefoliationSystem.js';
import { WaterSystem } from './WaterSystem.js';
import { Vegetation } from './Vegetation.js';

export class ChunkManager {
  constructor(scene, physicsWorld, options = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.chunkSize = options.chunkSize ?? 256;
    this.resolution = options.resolution ?? 64;
    this.heightScale = options.heightScale ?? 40;
    this.renderDistance = options.renderDistance ?? 2;
    this.generator = new TerrainGenerator({
      resolution: this.resolution,
      chunkSize: this.chunkSize,
      heightScale: this.heightScale,
      seed: options.seed ?? 1,
    });
    this.biomeManager = new BiomeManager(options.seed ?? 1);
    this.craterSystem = new CraterSystem({
      chunkSize: this.chunkSize,
      seed: options.seed ?? 1,
    });
    this.defoliationSystem = new DefoliationSystem(options.seed ?? 1);
    this.waterSystem = new WaterSystem(this.chunkSize);
    this.vegetation = new Vegetation(this.chunkSize, options.seed ?? 1);
    this.chunks = new Map();
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
    });
  }

  update(position) {
    const centerX = Math.floor(position.x / this.chunkSize);
    const centerZ = Math.floor(position.z / this.chunkSize);
    const required = new Set();

    for (let z = centerZ - this.renderDistance; z <= centerZ + this.renderDistance; z += 1) {
      for (let x = centerX - this.renderDistance; x <= centerX + this.renderDistance; x += 1) {
        const key = this.getKey(x, z);
        required.add(key);
        if (!this.chunks.has(key)) this.createChunk(x, z, key);
      }
    }

    for (const [key, chunk] of this.chunks) {
      if (!required.has(key)) this.removeChunk(key, chunk);
    }
  }

  createChunk(chunkX, chunkZ, key) {
    const { heights } = this.generator.generate(chunkX, chunkZ);
    this.craterSystem.apply(heights, this.resolution, chunkX, chunkZ);
    const craters = this.craterSystem.getCraters(chunkX, chunkZ);
    const geometry = new THREE.PlaneGeometry(
      this.chunkSize,
      this.chunkSize,
      this.resolution - 1,
      this.resolution - 1
    );
    geometry.rotateX(-Math.PI / 2);
    const vertices = geometry.attributes.position;
    const colors = new Float32Array(heights.length * 3);
    for (let index = 0; index < heights.length; index += 1) {
      vertices.setY(index, heights[index]);
      const x = index % this.resolution;
      const z = Math.floor(index / this.resolution);
      const worldX = chunkX * this.chunkSize + x * (this.chunkSize / (this.resolution - 1));
      const worldZ = chunkZ * this.chunkSize + z * (this.chunkSize / (this.resolution - 1));
      const defoliation = this.defoliationSystem.getMask(worldX, worldZ);
      const crater = this.craterSystem.getStrength(worldX, worldZ, craters);
      const color = this.biomeManager.getColor(worldX, worldZ, defoliation, crater);
      colors[index * 3] = color[0];
      colors[index * 3 + 1] = color[1];
      colors[index * 3 + 2] = color[2];
    }
    vertices.needsUpdate = true;
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.set((chunkX + 0.5) * this.chunkSize, 0, (chunkZ + 0.5) * this.chunkSize);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const collider = createHeightfieldCollider(
      heights,
      this.resolution,
      this.chunkSize,
      this.heightScale
    );
    collider.setTranslation(mesh.position.x, 0, mesh.position.z);
    const body = this.physicsWorld.createStaticBody(mesh, collider);
    const water = this.waterSystem.createForChunk(
      this.scene,
      chunkX,
      chunkZ,
      this.biomeManager
    );
    const vegetation = this.vegetation.createForChunk(
      this.scene,
      chunkX,
      chunkZ,
      heights,
      this.resolution,
      this.biomeManager,
      this.defoliationSystem
    );
    this.chunks.set(key, { mesh, body, water, vegetation });
  }

  removeChunk(key, chunk) {
    this.scene.remove(chunk.mesh);
    chunk.mesh.geometry.dispose();
    this.waterSystem.remove(this.scene, chunk.water);
    this.vegetation.remove(this.scene, chunk.vegetation);
    this.physicsWorld.removeBody(chunk.body);
    this.chunks.delete(key);
  }

  getKey(x, z) {
    return `${x}:${z}`;
  }

  dispose() {
    for (const [key, chunk] of this.chunks) this.removeChunk(key, chunk);
    this.material.dispose();
    this.waterSystem.dispose();
    this.vegetation.dispose();
  }
}

export default ChunkManager;