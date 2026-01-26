/**
 * Tests for Upgrades System
 */

import {
  calculateUpgradeCost,
  verifyCostCurveMonotonic,
  createProgressionManager,
  ProgressionManager,
} from '../upgrades';
import { UpgradeType, UPGRADE_MODIFIERS, calculateVehicleStats, BASE_VEHICLE_STATS } from '../../config/vehicleConfig';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
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

describe('ProgressionManager - Vehicle Purchases', () => {
  let manager: ProgressionManager;

  beforeEach(async () => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    manager = createProgressionManager();
    await manager.load();
  });

  describe('initial state', () => {
    it('should have jeep unlocked by default', () => {
      expect(manager.isVehicleUnlocked('jeep')).toBe(true);
    });

    it('should have jeep selected by default', () => {
      expect(manager.getSelectedVehicle()).toBe('jeep');
    });

    it('should have other vehicles locked', () => {
      expect(manager.isVehicleUnlocked('monster_truck')).toBe(false);
      expect(manager.isVehicleUnlocked('tank')).toBe(false);
    });
  });

  describe('getVehicleInfo', () => {
    it('should return correct info for unlocked vehicle', () => {
      const info = manager.getVehicleInfo('jeep');

      expect(info.name).toBe('Jeep');
      expect(info.isUnlocked).toBe(true);
      expect(info.cost).toBe(0); // Free starter
    });

    it('should return correct info for locked vehicle', () => {
      const info = manager.getVehicleInfo('monster_truck');

      expect(info.name).toBe('Monster Truck');
      expect(info.isUnlocked).toBe(false);
      expect(info.cost).toBe(5000);
    });
  });

  describe('purchaseVehicle', () => {
    it('should fail without enough coins', async () => {
      const result = await manager.purchaseVehicle('monster_truck');

      expect(result).toBe(false);
      expect(manager.isVehicleUnlocked('monster_truck')).toBe(false);
    });

    it('should succeed with enough coins', async () => {
      await manager.addCoins(10000);
      const result = await manager.purchaseVehicle('monster_truck');

      expect(result).toBe(true);
      expect(manager.isVehicleUnlocked('monster_truck')).toBe(true);
      expect(manager.getProgress().coins).toBe(5000); // 10000 - 5000
    });

    it('should fail if already unlocked', async () => {
      await manager.addCoins(10000);
      await manager.purchaseVehicle('monster_truck');

      const result = await manager.purchaseVehicle('monster_truck');
      expect(result).toBe(false);
    });
  });

  describe('selectVehicle', () => {
    it('should fail for locked vehicle', async () => {
      const result = await manager.selectVehicle('tank');

      expect(result).toBe(false);
      expect(manager.getSelectedVehicle()).toBe('jeep');
    });

    it('should succeed for unlocked vehicle', async () => {
      await manager.addCoins(10000);
      await manager.purchaseVehicle('monster_truck');

      const result = await manager.selectVehicle('monster_truck');

      expect(result).toBe(true);
      expect(manager.getSelectedVehicle()).toBe('monster_truck');
    });
  });

  describe('getAllVehicleInfos', () => {
    it('should return info for all vehicles', () => {
      const infos = manager.getAllVehicleInfos();

      expect(infos.length).toBe(6);
      expect(infos.map((i) => i.vehicleId)).toContain('jeep');
      expect(infos.map((i) => i.vehicleId)).toContain('moon_rover');
    });
  });
});

describe('ProgressionManager - Stage Purchases', () => {
  let manager: ProgressionManager;

  beforeEach(async () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    manager = createProgressionManager();
    await manager.load();
  });

  describe('initial state', () => {
    it('should have countryside unlocked by default', () => {
      expect(manager.isStageUnlocked('countryside')).toBe(true);
    });

    it('should have countryside selected by default', () => {
      expect(manager.getSelectedStage()).toBe('countryside');
    });

    it('should have other stages locked', () => {
      expect(manager.isStageUnlocked('desert')).toBe(false);
      expect(manager.isStageUnlocked('moon')).toBe(false);
    });
  });

  describe('purchaseStage', () => {
    it('should fail without enough coins', async () => {
      const result = await manager.purchaseStage('desert');

      expect(result).toBe(false);
      expect(manager.isStageUnlocked('desert')).toBe(false);
    });

    it('should succeed with enough coins', async () => {
      await manager.addCoins(5000);
      const result = await manager.purchaseStage('desert');

      expect(result).toBe(true);
      expect(manager.isStageUnlocked('desert')).toBe(true);
      expect(manager.getProgress().coins).toBe(2500); // 5000 - 2500
    });
  });

  describe('selectStage', () => {
    it('should fail for locked stage', async () => {
      const result = await manager.selectStage('moon');

      expect(result).toBe(false);
    });

    it('should succeed for unlocked stage', async () => {
      await manager.addCoins(5000);
      await manager.purchaseStage('desert');

      const result = await manager.selectStage('desert');

      expect(result).toBe(true);
      expect(manager.getSelectedStage()).toBe('desert');
    });
  });
});

describe('ProgressionManager - Stats Tracking', () => {
  let manager: ProgressionManager;

  beforeEach(async () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    manager = createProgressionManager();
    await manager.load();
  });

  describe('updateRunStats', () => {
    it('should accumulate air time', async () => {
      await manager.updateRunStats({
        airTime: 5,
        tricks: 3,
        combo: 5,
        stageId: 'countryside',
      });

      expect(manager.getProgress().totalAirTime).toBe(5);

      await manager.updateRunStats({
        airTime: 3,
        tricks: 2,
        combo: 3,
        stageId: 'countryside',
      });

      expect(manager.getProgress().totalAirTime).toBe(8);
    });

    it('should track highest combo', async () => {
      await manager.updateRunStats({
        airTime: 0,
        tricks: 0,
        combo: 10,
        stageId: 'countryside',
      });

      expect(manager.getProgress().highestCombo).toBe(10);

      await manager.updateRunStats({
        airTime: 0,
        tricks: 0,
        combo: 5, // Lower than previous
        stageId: 'countryside',
      });

      expect(manager.getProgress().highestCombo).toBe(10); // Still 10
    });

    it('should track stages played', async () => {
      await manager.updateRunStats({
        airTime: 0,
        tricks: 0,
        combo: 0,
        stageId: 'countryside',
      });

      expect(manager.getProgress().stagesPlayed).toContain('countryside');
      expect(manager.getProgress().stagesPlayed.length).toBe(1);

      // Playing same stage again shouldn't duplicate
      await manager.updateRunStats({
        airTime: 0,
        tricks: 0,
        combo: 0,
        stageId: 'countryside',
      });

      expect(manager.getProgress().stagesPlayed.length).toBe(1);
    });
  });
});
