import * as THREE from 'three';
import { roadAt, smoothstep, CHUNK_LENGTH, type Biome } from './road';
export const palettes: Record<Biome, number> = { forest: 0x547653, alpine: 0x89928a, desert: 0xc9ad74, coastal: 0x739c69 };
export function terrainHeight(x: number, z: number): number {
  const r = roadAt(z), d = Math.abs(x - r.x);
  const hills = 18 * Math.sin(x * 0.014 + z * 0.005) + 10 * Math.cos(x * 0.032 - z * 0.008) + 4 * Math.sin(x * 0.085 + z * 0.02);
  return r.y - 0.04 + smoothstep(6, 85, d) * hills;
}
export function makeTerrain(index: number, biome: Biome, detail: number): THREE.Mesh {
  const rows = detail, cols = detail * 2, width = 900;
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const base = new THREE.Color(palettes[biome]);
  for (let j = 0; j <= rows; j++) {
    const z = index * CHUNK_LENGTH + j / rows * CHUNK_LENGTH;
    const center = roadAt(z).x;
    for (let i = 0; i <= cols; i++) {
      // Nonuniform samples keep the road corridor resolved even at low quality.
      const u = i / cols * 2 - 1;
      const x = center + Math.sign(u) * Math.abs(u) ** 1.65 * width / 2;
      const y = terrainHeight(x, z);
      positions.push(x, y, z);
      const shade = 0.88 + 0.12 * Math.sin(x * 0.06 + z * 0.03);
      const c = base.clone().multiplyScalar(shade);
      if (biome === 'alpine' && y > 39) c.lerp(new THREE.Color(0xeeeeee), smoothstep(39, 52, y));
      colors.push(c.r, c.g, c.b);
      if (i < cols && j < rows) {
        const a = j * (cols + 1) + i, b = a + cols + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}
