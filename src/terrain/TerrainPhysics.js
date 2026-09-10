import RAPIER from '@dimforge/rapier3d-compat';

export function createHeightfieldCollider(heights, resolution, chunkSize, heightScale) {
  return RAPIER.ColliderDesc.heightfield(
    resolution - 1,
    resolution - 1,
    heights,
    { x: chunkSize, y: 1, z: chunkSize }
  );
}

export default createHeightfieldCollider;