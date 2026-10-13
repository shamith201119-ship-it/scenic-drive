import * as THREE from 'three';
import { CHUNK_LENGTH, seededRandom, roadAt, type Biome } from './road';
import { terrainHeight } from './terrain';
export function makeScenery(index: number, biome: Biome, density: number): THREE.Group {
  const group = new THREE.Group(), random = seededRandom(index * 193 + 731);
  const count = Math.floor(density * (biome === 'desert' ? 0.35 : 1));
  const foliage = new THREE.InstancedMesh(
    biome === 'desert' ? new THREE.CylinderGeometry(0.4, 0.6, 5, 6) : new THREE.ConeGeometry(3, 9, 7),
    new THREE.MeshStandardMaterial({ color: biome === 'alpine' ? 0x35584e : biome === 'desert' ? 0x5c7752 : 0x346b43, roughness: 1 }), count);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.45, 3, 5), new THREE.MeshStandardMaterial({ color: 0x64503b }), count);
  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: biome === 'desert' ? 0x9f865f : 0x828780, roughness: 1 }), 28);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const z = (index + random()) * CHUNK_LENGTH;
    const x = roadAt(z).x + (random() < 0.5 ? -1 : 1) * (14 + random() * 300);
    const y = terrainHeight(x, z), scale = 0.7 + random() * 1.4;
    dummy.position.set(x, y + 1.5 * scale, z); dummy.scale.set(scale, scale, scale); dummy.rotation.set(0, random() * Math.PI * 2, 0); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.y = y + (biome === 'desert' ? 3 : 5.8) * scale; dummy.updateMatrix(); foliage.setMatrixAt(i, dummy.matrix);
  }
  for (let i = 0; i < 28; i++) {
    const z = (index + random()) * CHUNK_LENGTH, x = roadAt(z).x + (random() < 0.5 ? -1 : 1) * (12 + random() * 180);
    dummy.position.set(x, terrainHeight(x,z) + 0.5, z); dummy.scale.set(1 + random()*3, 0.8 + random()*2, 1 + random()*2); dummy.rotation.set(random(), random()*6, random()); dummy.updateMatrix(); rocks.setMatrixAt(i,dummy.matrix);
  }
  for (const mesh of [foliage, trunks, rocks]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); }
  return group;
}
