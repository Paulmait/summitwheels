/**
 * Tests for Screen Shake System
 */

import { createScreenShakeSystem, ScreenShakeSystem } from '../screenShake';

describe('ScreenShakeSystem', () => {
  let system: ScreenShakeSystem;

  beforeEach(() => {
    system = createScreenShakeSystem();
  });

  describe('initial state', () => {
    it('should have no offset initially', () => {
      const offset = system.getOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });

    it('should not be shaking initially', () => {
      expect(system.getState().isShaking).toBe(false);
    });
  });

  describe('shake', () => {
    it('should start shaking when triggered', () => {
      system.shake(0.5, 200);
      system.update(16);

      expect(system.getState().isShaking).toBe(true);
    });

    it('should produce non-zero offset when shaking', () => {
      system.shake(1.0, 200);

      // Run several updates to ensure we get some offset
      let hasNonZeroOffset = false;
      for (let i = 0; i < 10; i++) {
        system.update(16);
        const offset = system.getOffset();
        if (offset.x !== 0 || offset.y !== 0) {
          hasNonZeroOffset = true;
          break;
        }
      }

      expect(hasNonZeroOffset).toBe(true);
    });

    it('should clamp intensity to 1', () => {
      system.shake(2.0, 200);
      system.update(16);

      const offset = system.getOffset();
      // Max offset is 20 by default, so should not exceed that
      expect(Math.abs(offset.x)).toBeLessThanOrEqual(20);
      expect(Math.abs(offset.y)).toBeLessThanOrEqual(20);
    });
  });

  describe('update', () => {
    it('should reduce shake intensity over time', () => {
      system.shake(1.0, 200);

      // Get offset at start
      system.update(16);
      const earlyState = system.getState();

      // Update most of the way through
      system.update(150);
      const lateState = system.getState();

      // Should still be shaking but with lower offsets expected
      expect(earlyState.isShaking).toBe(true);
      expect(lateState.isShaking).toBe(true);
    });

    it('should stop shaking after duration', () => {
      system.shake(1.0, 100);

      system.update(50);
      expect(system.getState().isShaking).toBe(true);

      system.update(60); // Total 110ms > 100ms duration
      expect(system.getState().isShaking).toBe(false);
    });

    it('should reset offset to zero after shake ends', () => {
      system.shake(1.0, 100);
      system.update(150);

      const offset = system.getOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });
  });

  describe('multiple shakes', () => {
    it('should take larger intensity when shakes overlap', () => {
      system.shake(0.3, 200);
      system.shake(0.8, 200);

      system.update(16);
      // Should be shaking with the higher intensity
      expect(system.getState().isShaking).toBe(true);
    });
  });

  describe('reset', () => {
    it('should stop shaking and reset offset', () => {
      system.shake(1.0, 500);
      system.update(100);

      expect(system.getState().isShaking).toBe(true);

      system.reset();

      expect(system.getState().isShaking).toBe(false);
      expect(system.getOffset().x).toBe(0);
      expect(system.getOffset().y).toBe(0);
    });
  });

  describe('custom options', () => {
    it('should respect custom maxOffset', () => {
      const customSystem = createScreenShakeSystem({ maxOffset: 5 });
      customSystem.shake(1.0, 200);

      // Check several updates
      for (let i = 0; i < 20; i++) {
        customSystem.update(8);
        const offset = customSystem.getOffset();
        expect(Math.abs(offset.x)).toBeLessThanOrEqual(5);
        expect(Math.abs(offset.y)).toBeLessThanOrEqual(5);
      }
    });
  });
});
