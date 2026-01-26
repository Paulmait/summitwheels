/**
 * Tests for Trick Detection System
 */

import {
  createTrickSystem,
  TrickSystem,
  DEFAULT_TRICK_CONFIG,
  getTrickColor,
  formatTrickDisplay,
} from '../tricks';

describe('TrickSystem', () => {
  let trickSystem: TrickSystem;

  beforeEach(() => {
    trickSystem = createTrickSystem();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = trickSystem.getState();

      expect(state.isAirborne).toBe(false);
      expect(state.totalTrickPoints).toBe(0);
      expect(state.recentTricks).toHaveLength(0);
      expect(state.flipsCompleted).toBe(0);
    });

    it('should use default config', () => {
      const config = trickSystem.getConfig();

      expect(config.flipPoints).toBe(DEFAULT_TRICK_CONFIG.flipPoints);
      expect(config.doubleFlipPoints).toBe(DEFAULT_TRICK_CONFIG.doubleFlipPoints);
    });

    it('should accept custom config', () => {
      const customSystem = createTrickSystem({ flipPoints: 1000 });
      const config = customSystem.getConfig();

      expect(config.flipPoints).toBe(1000);
    });
  });

  describe('airborne detection', () => {
    it('should detect transition to airborne', () => {
      trickSystem.update(false, 0, 0, 1000); // Airborne

      const state = trickSystem.getState();
      expect(state.isAirborne).toBe(true);
    });

    it('should track air time while airborne', () => {
      trickSystem.update(false, 0, 0, 0); // Start airborne at t=0
      trickSystem.update(false, 0, 0, 2000); // Still airborne at t=2000

      const state = trickSystem.getState();
      expect(state.currentAirTime).toBe(2);
    });

    it('should detect landing', () => {
      trickSystem.update(false, 0, 0, 0); // Airborne
      trickSystem.update(true, 0, 0, 500); // Landed

      const state = trickSystem.getState();
      expect(state.isAirborne).toBe(false);
    });
  });

  describe('flip detection', () => {
    it('should detect a frontflip (positive rotation)', () => {
      const startTime = 0;
      trickSystem.update(false, 0, 0, startTime); // Start airborne

      // Simulate 360° rotation (2π radians) over time with finer steps
      const steps = 70; // Enough steps to exceed 2π
      const angleStep = (Math.PI * 2.1) / steps; // Go slightly beyond 2π
      for (let i = 1; i <= steps; i++) {
        const angle = i * angleStep;
        trickSystem.update(false, angle, 0, startTime + i * 10);
      }

      // Land
      const tricks = trickSystem.update(true, Math.PI * 2.1, 5, startTime + 1000);

      expect(tricks.some((t) => t.type === 'frontflip')).toBe(true);
    });

    it('should detect a backflip (negative rotation)', () => {
      const startTime = 0;
      trickSystem.update(false, 0, 0, startTime);

      // Simulate -360° rotation with finer steps
      const steps = 70;
      const angleStep = (Math.PI * 2.1) / steps;
      for (let i = 1; i <= steps; i++) {
        const angle = -i * angleStep;
        trickSystem.update(false, angle, 0, startTime + i * 10);
      }

      const tricks = trickSystem.update(true, -Math.PI * 2.1, 5, startTime + 1000);

      expect(tricks.some((t) => t.type === 'backflip')).toBe(true);
    });

    it('should award more points for backflip', () => {
      const frontflipPoints = DEFAULT_TRICK_CONFIG.flipPoints;
      const backflipPoints = Math.round(
        DEFAULT_TRICK_CONFIG.flipPoints * DEFAULT_TRICK_CONFIG.backflipMultiplier
      );

      expect(backflipPoints).toBeGreaterThan(frontflipPoints);
    });

    it('should detect double flip', () => {
      const startTime = 0;
      trickSystem.update(false, 0, 0, startTime);

      // Simulate 720° rotation (4π radians) with finer steps
      const steps = 140;
      const angleStep = (Math.PI * 4.1) / steps;
      for (let i = 1; i <= steps; i++) {
        const angle = i * angleStep;
        trickSystem.update(false, angle, 0, startTime + i * 5);
      }

      const tricks = trickSystem.update(true, Math.PI * 4.1, 5, startTime + 1000);

      expect(tricks.some((t) => t.type === 'doubleFlip')).toBe(true);
    });
  });

  describe('air time bonus', () => {
    it('should award air time bonus for long jumps', () => {
      const startTime = 0;
      trickSystem.update(false, 0, 0, startTime);

      // Stay airborne for 2 seconds
      trickSystem.update(false, 0, 0, startTime + 2000);

      const tricks = trickSystem.update(true, 0, 5, startTime + 2000);

      expect(tricks.some((t) => t.type === 'airTime')).toBe(true);
    });

    it('should not award air time bonus for short jumps', () => {
      const startTime = 0;
      trickSystem.update(false, 0, 0, startTime);

      // Stay airborne for 0.5 seconds
      trickSystem.update(false, 0, 0, startTime + 500);

      const tricks = trickSystem.update(true, 0, 5, startTime + 500);

      expect(tricks.some((t) => t.type === 'airTime')).toBe(false);
    });
  });

  describe('perfect landing', () => {
    it('should award perfect landing for smooth landings after tricks', () => {
      const startTime = 0;
      trickSystem.update(false, 0, 0, startTime);

      // Do a flip with proper rotation
      const steps = 70;
      const angleStep = (Math.PI * 2.1) / steps;
      for (let i = 1; i <= steps; i++) {
        const angle = i * angleStep;
        trickSystem.update(false, angle, 0, startTime + i * 10);
      }

      // Land with low velocity (smooth landing)
      const tricks = trickSystem.update(true, Math.PI * 2.1, 1, startTime + 1000);

      expect(tricks.some((t) => t.type === 'perfectLanding')).toBe(true);
    });

    it('should not award perfect landing without tricks', () => {
      const startTime = 0;
      trickSystem.update(false, 0, 0, startTime);
      trickSystem.update(false, 0, 0, startTime + 500);

      // Land without any tricks
      const tricks = trickSystem.update(true, 0, 1, startTime + 500);

      expect(tricks.some((t) => t.type === 'perfectLanding')).toBe(false);
    });
  });

  describe('point accumulation', () => {
    it('should accumulate total trick points', () => {
      const startTime = 0;
      trickSystem.update(false, 0, 0, startTime);

      // Do a flip with proper rotation
      const steps = 70;
      const angleStep = (Math.PI * 2.1) / steps;
      for (let i = 1; i <= steps; i++) {
        const angle = i * angleStep;
        trickSystem.update(false, angle, 0, startTime + i * 10);
      }

      trickSystem.update(true, Math.PI * 2.1, 5, startTime + 1000);

      const state = trickSystem.getState();
      expect(state.totalTrickPoints).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      trickSystem.update(false, 0, 0, 0);
      trickSystem.update(false, Math.PI, 0, 500);

      trickSystem.reset();

      const state = trickSystem.getState();
      expect(state.isAirborne).toBe(false);
      expect(state.totalTrickPoints).toBe(0);
      expect(state.totalRotation).toBe(0);
    });
  });

  describe('clearOldTricks', () => {
    it('should remove tricks older than display duration', () => {
      const startTime = 0;
      trickSystem.update(false, 0, 0, startTime);

      // Do a flip with proper rotation
      const steps = 70;
      const angleStep = (Math.PI * 2.1) / steps;
      for (let i = 1; i <= steps; i++) {
        const angle = i * angleStep;
        trickSystem.update(false, angle, 0, startTime + i * 10);
      }
      trickSystem.update(true, Math.PI * 2.1, 5, startTime + 1000);

      // Should have tricks in recent list
      let state = trickSystem.getState();
      expect(state.recentTricks.length).toBeGreaterThan(0);

      // Clear old tricks (after display duration)
      trickSystem.clearOldTricks(startTime + 5000);

      state = trickSystem.getState();
      expect(state.recentTricks).toHaveLength(0);
    });
  });
});

describe('Trick helpers', () => {
  describe('getTrickColor', () => {
    it('should return gold for high value tricks', () => {
      const trick = {
        type: 'doubleFlip' as const,
        value: 1500,
        label: 'DOUBLE FLIP!',
        timestamp: 0,
      };

      expect(getTrickColor(trick)).toBe('#FFD700');
    });

    it('should return orange for medium value tricks', () => {
      const trick = {
        type: 'frontflip' as const,
        value: 500,
        label: 'FRONTFLIP!',
        timestamp: 0,
      };

      expect(getTrickColor(trick)).toBe('#FF6B35');
    });

    it('should return green for low value tricks', () => {
      const trick = {
        type: 'perfectLanding' as const,
        value: 200,
        label: 'PERFECT LANDING!',
        timestamp: 0,
      };

      expect(getTrickColor(trick)).toBe('#4CAF50');
    });
  });

  describe('formatTrickDisplay', () => {
    it('should format trick for display', () => {
      const trick = {
        type: 'frontflip' as const,
        value: 500,
        label: 'FRONTFLIP!',
        timestamp: 0,
      };

      expect(formatTrickDisplay(trick)).toBe('+500 FRONTFLIP!');
    });
  });
});
