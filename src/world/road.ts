export const ROAD_WIDTH = 9;
export const CHUNK_LENGTH = 160;
export const WORLD_SEED = 731;
export type Biome = 'forest' | 'alpine' | 'desert' | 'coastal';
const biomes: Biome[] = ['forest', 'alpine', 'desert', 'coastal'];
export function biomeAt(z: number): Biome {
  return biomes[((Math.floor(z / 2000) % 4) + 4) % 4];
}
export function seededRandom(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export interface RoadSample { x: number; y: number; heading: number; slope: number }
export function roadAt(z: number, seed = WORLD_SEED): RoadSample {
  const p = seed * 0.137;
  const x = 55 * Math.sin(z * 0.003 + p) + 18 * Math.sin(z * 0.009 + p * 2);
  const y = 22 + 11 * Math.sin(z * 0.0021 + p) + 3 * Math.sin(z * 0.007 + p);
  const dx = 0.165 * Math.cos(z * 0.003 + p) + 0.162 * Math.cos(z * 0.009 + p * 2);
  const slope = 0.0231 * Math.cos(z * 0.0021 + p) + 0.021 * Math.cos(z * 0.007 + p);
  return { x, y, heading: Math.atan(dx), slope };
}
export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
