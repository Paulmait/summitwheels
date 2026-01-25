/**
 * Tests for Upgrades System
 */

import {
  calculateUpgradeCost,
  verifyCostCurveMonotonic,
} from '../upgrades';
import { UpgradeType, UPGRADE_MODIFIERS, calculateVehicleStats, BASE_VEHICLE_STATS } from '../../config/vehicleConfig';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('Upgrades System', () => {
  describe('calculateUpgradeCost', () => {
    it('should return positive cost for level 0', () => {
      const types: UpgradeType[] = ['engine', 'tires', 'suspension', 'fuelTank'];

      for (const type of types) {
        const cost = calculateUpgradeCost(type, 0);
        expect(cost).toBeGreaterThan(0);
      }
    });

    it('should increase cost with level', () => {
      const types: UpgradeType[] = ['engine', 'tires', 'suspension', 'fuelTank'];

      for (const type of types) {
        const cost0 = calculateUpgradeCost(type, 0);
        const cost1 = calculateUpgradeCost(type, 1);
        const cost5 = calculateUpgradeCost(type, 5);

        expect(cost1).toBeGreaterThan(cost0);
        expect(cost5).toBeGreaterThan(cost1);
      }
    });
  });

  describe('verifyCostCurveMonotonic', () => {
    it('should verify all upgrade types have monotonic cost curves', () => {
      const types: UpgradeType[] = ['engine', 'tires', 'suspension', 'fuelTank'];

      for (const type of types) {
        expect(verifyCostCurveMonotonic(type)).toBe(true);
      }
    });
  });

  describe('calculateVehicleStats', () => {
    it('should return base stats with no upgrades', () => {
      const upgrades = {
        engine: 0,
        tires: 0,
        suspension: 0,
        fuelTank: 0,
      };

      const stats = calculateVehicleStats(upgrades);

      expect(stats.enginePower).toBe(BASE_VEHICLE_STATS.enginePower);
      expect(stats.fuelCapacity).toBe(BASE_VEHICLE_STATS.fuelCapacity);
      expect(stats.wheelFriction).toBe(BASE_VEHICLE_STATS.wheelFriction);
    });

    it('should return improved stats with upgrades', () => {
      const baseUpgrades = {
        engine: 0,
        tires: 0,
        suspension: 0,
        fuelTank: 0,
      };

      const withUpgrades = {
        engine: 1,
        tires: 1,
        suspension: 1,
        fuelTank: 1,
      };

      const baseStats = calculateVehicleStats(baseUpgrades);
      const upgradedStats = calculateVehicleStats(withUpgrades);

      expect(upgradedStats.enginePower).toBeGreaterThan(baseStats.enginePower);
      expect(upgradedStats.fuelCapacity).toBeGreaterThan(baseStats.fuelCapacity);
      expect(upgradedStats.wheelFriction).toBeGreaterThan(baseStats.wheelFriction);
    });

    it('should apply correct modifiers per level', () => {
      const upgrades = {
        engine: 5,
        tires: 0,
        suspension: 0,
        fuelTank: 3,
      };

      const stats = calculateVehicleStats(upgrades);

      // Engine: base + 5 * perLevel
      const expectedEnginePower =
        BASE_VEHICLE_STATS.enginePower +
        5 * UPGRADE_MODIFIERS.engine.perLevel;
      expect(stats.enginePower).toBeCloseTo(expectedEnginePower);

      // Fuel tank: base + 3 * perLevel
      const expectedFuelCapacity =
        BASE_VEHICLE_STATS.fuelCapacity +
        3 * UPGRADE_MODIFIERS.fuelTank.perLevel;
      expect(stats.fuelCapacity).toBeCloseTo(expectedFuelCapacity);
    });
  });

  describe('upgrade cost formulas', () => {
    it('should have reasonable base costs', () => {
      const types: UpgradeType[] = ['engine', 'tires', 'suspension', 'fuelTank'];

      for (const type of types) {
        const cost = calculateUpgradeCost(type, 0);
        expect(cost).toBeGreaterThan(20);
        expect(cost).toBeLessThan(100);
      }
    });

    it('should have escalating costs for higher levels', () => {
      const engineCost0 = calculateUpgradeCost('engine', 0);
      const engineCost9 = calculateUpgradeCost('engine', 9);

      // Level 9 should cost much more than level 0
      expect(engineCost9).toBeGreaterThan(engineCost0 * 10);
    });
  });
});

describe('Upgrade Modifiers', () => {
  it('should have max level of 10 for all upgrades', () => {
    const types: UpgradeType[] = ['engine', 'tires', 'suspension', 'fuelTank'];

    for (const type of types) {
      expect(UPGRADE_MODIFIERS[type].maxLevel).toBe(10);
    }
  });

  it('should have positive per-level bonus for all upgrades', () => {
    const types: UpgradeType[] = ['engine', 'tires', 'suspension', 'fuelTank'];

    for (const type of types) {
      expect(UPGRADE_MODIFIERS[type].perLevel).toBeGreaterThan(0);
    }
  });
});
