import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { roadAt, ROAD_WIDTH, seededRandom, biomeAt, CHUNK_LENGTH } from '../src/world/road';
import { terrainHeight, makeTerrain } from '../src/world/terrain';
import { ChunkWorld, qualitySettings, type Quality } from '../src/world/chunks';
describe('seeded road contract', () => {
  it('reproduces identical samples', () => {
    expect(roadAt(420, 12)).toEqual(roadAt(420, 12));
    expect(roadAt(420, 12).x).not.toBe(roadAt(420, 13).x);
  });
  it('bounds slope and lateral curvature over a long route', () => {
    for (let z = -10000; z < 10000; z += 11) {
      const a = roadAt(z), b = roadAt(z + 1);
      expect(Math.abs(b.y - a.y)).toBeLessThan(0.15);
      expect(Math.abs(b.x - a.x)).toBeLessThan(0.6);
      expect(Number.isFinite(a.heading)).toBe(true);
    }
  });
  it('keeps terrain flush beneath the entire road', () => {
    for (let z = -400; z <= 1200; z += 40) {
      const r = roadAt(z);
      for (const offset of [-ROAD_WIDTH / 2, 0, ROAD_WIDTH / 2]) {
        expect(terrainHeight(r.x + offset, z)).toBeCloseTo(r.y - 0.04, 5);
      }
    }
  });
  it('uses deterministic random streams and all four biomes', () => {
    const a = seededRandom(2), b = seededRandom(2);
    for (let i = 0; i < 30; i++) expect(a()).toBe(b());
    expect(new Set([0, 2000, 4000, 6000].map(z => biomeAt(z)))).toEqual(new Set(['forest','alpine','desert','coastal']));
  });
});
describe('terrain mesh characterization', () => {
  it('shares identical boundary positions between adjacent chunks', () => {
    const detail = 16;
    const a = makeTerrain(0, 'forest', detail);
    const b = makeTerrain(1, 'forest', detail);
    try {
      const pa = a.geometry.getAttribute('position');
      const pb = b.geometry.getAttribute('position');
      const columns = detail * 2 + 1;
      for (let i = 0; i < columns; i++) {
        const end = detail * columns + i;
        expect(pa.getX(end)).toBe(pb.getX(i));
        expect(pa.getY(end)).toBe(pb.getY(i));
        expect(pa.getZ(end)).toBe(pb.getZ(i));
      }
    } finally {
      for (const mesh of [a, b]) {
        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(material => material.dispose());
      }
    }
  });
});
describe('chunk streaming characterization', () => {
  it.each(['low', 'medium', 'high'] as Quality[])('bounds resident chunks on %s quality', quality => {
    const scene = new THREE.Scene();
    const world = new ChunkWorld(scene, quality);
    const origin = new THREE.Vector3();
    const maximum = qualitySettings[quality].radius * 2 + 1;
    try {
      for (const center of [0, 1, 30, -30, 1000]) {
        const z = center * CHUNK_LENGTH;
        origin.set(roadAt(z).x, 0, z);
        for (let frame = 0; frame < maximum + 1; frame++) world.update(z, origin);
        expect(world.count).toBe(maximum);
        expect(world.root.children.length).toBe(maximum);
        expect(world.root.position.toArray()).toEqual(origin.clone().negate().toArray());
      }
    } finally {
      world.clear();
    }
    expect(world.count).toBe(0);
    expect(world.root.children.length).toBe(0);
  });
  it('rebuilds using the new quality budget', () => {
    const world = new ChunkWorld(new THREE.Scene(), 'low');
    const origin = new THREE.Vector3();
    try {
      world.update(0, origin, true);
      expect(world.count).toBe(3);
      world.setQuality('medium');
      expect(world.count).toBe(0);
      for (let frame = 0; frame < 12; frame++) world.update(0, origin);
      expect(world.count).toBe(11);
    } finally {
      world.clear();
    }
  });
});
