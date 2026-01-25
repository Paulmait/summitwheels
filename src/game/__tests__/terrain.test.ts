/**
 * Tests for Terrain Generator
 */

import { createTerrainGenerator, createFlatGround } from '../terrain/terrain';

describe('TerrainGenerator', () => {
  describe('createTerrainGenerator', () => {
    it('should be deterministic given the same seed', () => {
      const seed = 12345;
      const gen1 = createTerrainGenerator(seed);
      const gen2 = createTerrainGenerator(seed);

      // Generate segments for the same range
      const segments1 = gen1.generateSegments(0, 1000);
      gen1.reset();
      gen2.reset();

      const gen1b = createTerrainGenerator(seed);
      const gen2b = createTerrainGenerator(seed);

      const segments1b = gen1b.generateSegments(0, 1000);
      const segments2b = gen2b.generateSegments(0, 1000);

      // Should have same number of segments
      expect(segments1b.length).toBe(segments2b.length);

      // Segment positions should match
      for (let i = 0; i < segments1b.length; i++) {
        expect(segments1b[i].startX).toBe(segments2b[i].startX);
        expect(segments1b[i].endX).toBe(segments2b[i].endX);
      }
    });

    it('should produce different terrain for different seeds', () => {
      const gen1 = createTerrainGenerator(11111);
      const gen2 = createTerrainGenerator(22222);

      const segments1 = gen1.generateSegments(0, 1000);
      const segments2 = gen2.generateSegments(0, 1000);

      // Vertices should differ (check first segment's first vertex)
      // Note: Due to randomness, they should be different
      const v1 = segments1[0].vertices;
      const v2 = segments2[0].vertices;

      // At least one vertex should be different
      const allSame = v1.every(
        (vertex, i) => vertex.x === v2[i].x && vertex.y === v2[i].y
      );
      expect(allSame).toBe(false);
    });

    it('should generate segments within specified range', () => {
      const gen = createTerrainGenerator(999);
      const segments = gen.generateSegments(0, 1000);

      expect(segments.length).toBeGreaterThan(0);

      // All segments should be within or covering the range
      const minStart = Math.min(...segments.map((s) => s.startX));
      const maxEnd = Math.max(...segments.map((s) => s.endX));

      expect(minStart).toBeLessThanOrEqual(0);
      expect(maxEnd).toBeGreaterThanOrEqual(1000);
    });

    it('should have continuous segments', () => {
      const gen = createTerrainGenerator(42);
      const segments = gen.generateSegments(0, 2000);

      // Sort by startX
      const sorted = [...segments].sort((a, b) => a.startX - b.startX);

      // Each segment should end where the next begins
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].endX).toBe(sorted[i + 1].startX);
      }
    });

    it('should return stored seed', () => {
      const seed = 55555;
      const gen = createTerrainGenerator(seed);
      expect(gen.getSeed()).toBe(seed);
    });
  });

  describe('getGroundY', () => {
    it('should return a number for any x position', () => {
      const gen = createTerrainGenerator(123);
      gen.generateSegments(0, 1000); // Populate height map

      const y = gen.getGroundY(500);
      expect(typeof y).toBe('number');
      expect(Number.isFinite(y)).toBe(true);
    });
  });

  describe('reset', () => {
    it('should clear height map on reset', () => {
      const gen = createTerrainGenerator(111);
      gen.generateSegments(0, 500);

      expect(gen.heightMap.size).toBeGreaterThan(0);

      gen.reset();

      expect(gen.heightMap.size).toBe(0);
    });
  });

  describe('createFlatGround', () => {
    it('should create a static body', () => {
      const ground = createFlatGround(0, 200, 50, 800);

      expect(ground).toBeDefined();
      expect(ground.isStatic).toBe(true);
      expect(ground.label).toBe('flatGround');
    });

    it('should be positioned correctly', () => {
      const screenHeight = 800;
      const width = 200;
      const height = 50;
      const x = 100;

      const ground = createFlatGround(x, width, height, screenHeight);

      // Center should be at x + width/2
      expect(ground.position.x).toBe(x + width / 2);
      // Y should be near bottom
      expect(ground.position.y).toBe(screenHeight - height / 2);
    });
  });
});
