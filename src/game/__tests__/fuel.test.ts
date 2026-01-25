/**
 * Tests for Fuel System
 */

import {
  createFuelSystem,
  calculateFuelEfficiency,
  DEFAULT_FUEL_CONFIG,
} from '../systems/fuel';

describe('FuelSystem', () => {
  describe('createFuelSystem', () => {
    it('should start with full fuel', () => {
      const fuel = createFuelSystem();
      const state = fuel.getState();

      expect(state.current).toBe(DEFAULT_FUEL_CONFIG.maxFuel);
      expect(state.percentage).toBe(100);
      expect(state.isEmpty).toBe(false);
    });

    it('should use custom max fuel', () => {
      const fuel = createFuelSystem({ maxFuel: 200 });
      const state = fuel.getState();

      expect(state.current).toBe(200);
      expect(state.max).toBe(200);
    });
  });

  describe('consume', () => {
    it('should decrease fuel while running (idle)', () => {
      const fuel = createFuelSystem();
      const initialState = fuel.getState();

      // Consume for 1 second while idle
      fuel.consume(1, false, false);
      const afterState = fuel.getState();

      expect(afterState.current).toBeLessThan(initialState.current);
    });

    it('should consume more fuel when throttling', () => {
      const fuel1 = createFuelSystem();
      const fuel2 = createFuelSystem();

      // Both consume for same time
      fuel1.consume(1, false, false); // Idle
      fuel2.consume(1, true, false); // Throttling

      const idle = fuel1.getState();
      const throttle = fuel2.getState();

      expect(throttle.current).toBeLessThan(idle.current);
    });

    it('should not go below zero', () => {
      const fuel = createFuelSystem({ maxFuel: 10 });

      // Consume way more than available
      fuel.consume(100, true, true);
      const state = fuel.getState();

      expect(state.current).toBe(0);
      expect(state.isEmpty).toBe(true);
    });

    it('should return amount consumed', () => {
      const fuel = createFuelSystem({ maxFuel: 100 });
      const consumed = fuel.consume(1, true, false);

      expect(consumed).toBeGreaterThan(0);
    });
  });

  describe('refill', () => {
    it('should add fuel up to max', () => {
      const fuel = createFuelSystem({ maxFuel: 100 });
      fuel.consume(5, true, false); // Use some fuel

      const beforeRefill = fuel.getState();
      fuel.refill(10);
      const afterRefill = fuel.getState();

      expect(afterRefill.current).toBeGreaterThan(beforeRefill.current);
    });

    it('should not exceed max fuel', () => {
      const fuel = createFuelSystem({ maxFuel: 100 });

      fuel.refill(500); // Try to overfill
      const state = fuel.getState();

      expect(state.current).toBe(100);
    });

    it('should return actual amount added', () => {
      const fuel = createFuelSystem({ maxFuel: 100 });
      fuel.setFuel(90);

      const added = fuel.refill(50);

      expect(added).toBe(10); // Only 10 could be added
    });
  });

  describe('isLow', () => {
    it('should indicate low fuel at threshold', () => {
      const fuel = createFuelSystem({
        maxFuel: 100,
        lowFuelThreshold: 20,
      });

      fuel.setFuel(15);
      const state = fuel.getState();

      expect(state.isLow).toBe(true);
    });

    it('should not indicate low fuel above threshold', () => {
      const fuel = createFuelSystem({
        maxFuel: 100,
        lowFuelThreshold: 20,
      });

      fuel.setFuel(50);
      const state = fuel.getState();

      expect(state.isLow).toBe(false);
    });
  });

  describe('setMaxFuel', () => {
    it('should maintain percentage when changing max', () => {
      const fuel = createFuelSystem({ maxFuel: 100 });
      fuel.setFuel(50); // 50%

      fuel.setMaxFuel(200);
      const state = fuel.getState();

      expect(state.max).toBe(200);
      expect(state.current).toBe(100); // 50% of 200
      expect(state.percentage).toBe(50);
    });
  });

  describe('reset', () => {
    it('should fill up on reset', () => {
      const fuel = createFuelSystem({ maxFuel: 100 });
      fuel.consume(10, true, false);

      fuel.reset();
      const state = fuel.getState();

      expect(state.current).toBe(100);
      expect(state.percentage).toBe(100);
    });
  });
});

describe('calculateFuelEfficiency', () => {
  it('should calculate distance per fuel unit', () => {
    const efficiency = calculateFuelEfficiency(100, 10);
    expect(efficiency).toBe(10);
  });

  it('should return 0 for no fuel used', () => {
    const efficiency = calculateFuelEfficiency(100, 0);
    expect(efficiency).toBe(0);
  });
});
