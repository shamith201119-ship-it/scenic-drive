import { describe, it, expect } from 'vitest';
import { roadAt, ROAD_WIDTH, seededRandom, biomeAt } from '../src/world/road';
import { terrainHeight } from '../src/world/terrain';
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
