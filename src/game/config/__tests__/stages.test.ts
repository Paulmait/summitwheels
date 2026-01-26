/**
 * Tests for Stage Configuration
 */

import {
  STAGES,
  StageId,
  getStage,
  getAllStages,
  getStarterStage,
  isStageUnlocked,
  getLockedStages,
} from '../stages';

describe('Stage Configuration', () => {
  describe('STAGES constant', () => {
    it('should have all expected stages', () => {
      const stageIds: StageId[] = [
        'countryside',
        'desert',
        'arctic',
        'moon',
        'volcano',
        'forest',
      ];

      stageIds.forEach((id) => {
        expect(STAGES[id]).toBeDefined();
      });
    });

    it('should have countryside as free starter stage', () => {
      expect(STAGES.countryside.unlockCost).toBe(0);
    });

    it('should have physics modifiers for each stage', () => {
      Object.values(STAGES).forEach((stage) => {
        expect(stage.physics.gravityMultiplier).toBeGreaterThan(0);
        expect(stage.physics.frictionMultiplier).toBeGreaterThan(0);
        expect(stage.physics.airResistanceMultiplier).toBeGreaterThan(0);
      });
    });

    it('should have terrain config for each stage', () => {
      Object.values(STAGES).forEach((stage) => {
        expect(stage.terrain.baseHeight).toBeGreaterThan(0);
        expect(stage.terrain.segmentWidth).toBeGreaterThan(0);
      });
    });

    it('should have visual properties for each stage', () => {
      Object.values(STAGES).forEach((stage) => {
        expect(stage.visual.skyColorTop).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(stage.visual.skyColorBottom).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(stage.visual.groundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(stage.visual.surfaceColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should have pickup modifiers for each stage', () => {
      Object.values(STAGES).forEach((stage) => {
        expect(stage.pickups.coinRateMultiplier).toBeGreaterThan(0);
        expect(stage.pickups.fuelRateMultiplier).toBeGreaterThan(0);
        expect(stage.pickups.fuelValueMultiplier).toBeGreaterThan(0);
      });
    });
  });

  describe('getStage', () => {
    it('should return correct stage by ID', () => {
      const countryside = getStage('countryside');
      expect(countryside.name).toBe('Countryside');

      const moon = getStage('moon');
      expect(moon.name).toBe('Moon');
    });
  });

  describe('getAllStages', () => {
    it('should return all stages sorted by unlock cost', () => {
      const stages = getAllStages();

      expect(stages.length).toBe(6);
      expect(stages[0].id).toBe('countryside'); // Free stage first

      // Verify sorted by unlock cost
      for (let i = 1; i < stages.length; i++) {
        expect(stages[i].unlockCost).toBeGreaterThanOrEqual(
          stages[i - 1].unlockCost
        );
      }
    });
  });

  describe('getStarterStage', () => {
    it('should return countryside as starter stage', () => {
      const starter = getStarterStage();
      expect(starter.id).toBe('countryside');
      expect(starter.unlockCost).toBe(0);
    });
  });

  describe('isStageUnlocked', () => {
    it('should return true for free stages', () => {
      expect(isStageUnlocked('countryside', [])).toBe(true);
    });

    it('should return true for purchased stages', () => {
      expect(isStageUnlocked('moon', ['moon'])).toBe(true);
    });

    it('should return false for locked stages', () => {
      expect(isStageUnlocked('moon', [])).toBe(false);
      expect(isStageUnlocked('desert', ['countryside'])).toBe(false);
    });
  });

  describe('getLockedStages', () => {
    it('should return all non-free stages when none unlocked', () => {
      const locked = getLockedStages([]);

      expect(locked.every((s) => s.unlockCost > 0)).toBe(true);
      expect(locked.length).toBe(5); // All except countryside
    });

    it('should exclude unlocked stages', () => {
      const locked = getLockedStages(['desert', 'moon']);

      expect(locked.find((s) => s.id === 'desert')).toBeUndefined();
      expect(locked.find((s) => s.id === 'moon')).toBeUndefined();
    });
  });

  describe('Stage uniqueness', () => {
    it('should have unique physics for each stage', () => {
      const moon = getStage('moon');
      const arctic = getStage('arctic');
      const volcano = getStage('volcano');

      // Moon should have low gravity
      expect(moon.physics.gravityMultiplier).toBeLessThan(1);

      // Arctic should have low friction
      expect(arctic.physics.frictionMultiplier).toBeLessThan(1);

      // Volcano should have higher gravity
      expect(volcano.physics.gravityMultiplier).toBeGreaterThanOrEqual(1);
    });

    it('should have appropriate pickup modifiers per difficulty', () => {
      const countryside = getStage('countryside');
      const volcano = getStage('volcano');

      // Harder stages should have more coin rewards
      expect(volcano.pickups.coinRateMultiplier).toBeGreaterThan(
        countryside.pickups.coinRateMultiplier
      );
    });

    it('should have recommended vehicles for each stage', () => {
      Object.values(STAGES).forEach((stage) => {
        expect(stage.recommendedVehicles.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Visual consistency', () => {
    it('should have weather defined appropriately', () => {
      const moon = getStage('moon');
      const arctic = getStage('arctic');

      // Moon should not have weather (no atmosphere)
      expect(moon.visual.hasWeather).toBe(false);

      // Arctic should have snow weather
      expect(arctic.visual.hasWeather).toBe(true);
      expect(arctic.visual.weatherType).toBe('snow');
    });
  });
});
