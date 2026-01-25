/**
 * Tests for Seeded RNG
 */

import {
  createSeededRng,
  getDailySeed,
  stringToSeed,
} from '../terrain/seededRng';

describe('SeededRng', () => {
  describe('createSeededRng', () => {
    it('should return deterministic sequence for same seed', () => {
      const rng1 = createSeededRng(12345);
      const rng2 = createSeededRng(12345);

      // Generate 10 numbers from each
      const sequence1 = Array.from({ length: 10 }, () => rng1.random());
      const sequence2 = Array.from({ length: 10 }, () => rng2.random());

      expect(sequence1).toEqual(sequence2);
    });

    it('should return different sequences for different seeds', () => {
      const rng1 = createSeededRng(12345);
      const rng2 = createSeededRng(54321);

      const sequence1 = Array.from({ length: 10 }, () => rng1.random());
      const sequence2 = Array.from({ length: 10 }, () => rng2.random());

      expect(sequence1).not.toEqual(sequence2);
    });

    it('should return numbers between 0 and 1', () => {
      const rng = createSeededRng(42);

      for (let i = 0; i < 100; i++) {
        const value = rng.random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should have stored seed value', () => {
      const seed = 99999;
      const rng = createSeededRng(seed);
      expect(rng.seed).toBe(seed);
    });
  });

  describe('randomInt', () => {
    it('should return integers within range', () => {
      const rng = createSeededRng(123);

      for (let i = 0; i < 100; i++) {
        const value = rng.randomInt(0, 10);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
      }
    });

    it('should be deterministic', () => {
      const rng1 = createSeededRng(456);
      const rng2 = createSeededRng(456);

      const ints1 = Array.from({ length: 10 }, () => rng1.randomInt(0, 100));
      const ints2 = Array.from({ length: 10 }, () => rng2.randomInt(0, 100));

      expect(ints1).toEqual(ints2);
    });
  });

  describe('randomRange', () => {
    it('should return numbers within specified range', () => {
      const rng = createSeededRng(789);
      const min = -50;
      const max = 50;

      for (let i = 0; i < 100; i++) {
        const value = rng.randomRange(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThan(max);
      }
    });
  });

  describe('getDailySeed', () => {
    it('should return same seed for same date', () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T23:59:59Z');

      expect(getDailySeed(date1)).toBe(getDailySeed(date2));
    });

    it('should return different seed for different dates', () => {
      const date1 = new Date('2024-01-15T00:00:00Z');
      const date2 = new Date('2024-01-16T00:00:00Z');

      expect(getDailySeed(date1)).not.toBe(getDailySeed(date2));
    });

    it('should return a number', () => {
      const seed = getDailySeed();
      expect(typeof seed).toBe('number');
      expect(Number.isFinite(seed)).toBe(true);
    });
  });

  describe('stringToSeed', () => {
    it('should return same seed for same string', () => {
      expect(stringToSeed('test')).toBe(stringToSeed('test'));
    });

    it('should return different seed for different strings', () => {
      expect(stringToSeed('hello')).not.toBe(stringToSeed('world'));
    });

    it('should return a positive number', () => {
      const seed = stringToSeed('any string');
      expect(seed).toBeGreaterThanOrEqual(0);
    });
  });
});
