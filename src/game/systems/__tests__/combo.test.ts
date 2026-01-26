/**
 * Tests for Combo System
 */

import {
  createComboSystem,
  ComboSystem,
  DEFAULT_COMBO_CONFIG,
  getComboTierColor,
} from '../combo';

describe('ComboSystem', () => {
  let comboSystem: ComboSystem;

  beforeEach(() => {
    comboSystem = createComboSystem();
  });

  describe('initialization', () => {
    it('should start with no active combo', () => {
      const state = comboSystem.getState();

      expect(state.count).toBe(0);
      expect(state.multiplier).toBe(1.0);
      expect(state.tier).toBe('none');
      expect(state.isActive).toBe(false);
    });
  });

  describe('addTrick', () => {
    it('should start a combo on first trick', () => {
      comboSystem.addTrick(100);

      const state = comboSystem.getState();
      expect(state.count).toBe(1);
      expect(state.isActive).toBe(true);
    });

    it('should increase multiplier with each trick', () => {
      comboSystem.addTrick(100);
      const state1 = comboSystem.getState();

      comboSystem.addTrick(100);
      const state2 = comboSystem.getState();

      expect(state2.multiplier).toBeGreaterThan(state1.multiplier);
    });

    it('should apply multiplier to points', () => {
      // First trick - 1x multiplier
      const result1 = comboSystem.addTrick(100);
      expect(result1.points).toBe(100);

      // Second trick - higher multiplier
      const result2 = comboSystem.addTrick(100);
      expect(result2.points).toBeGreaterThan(100);
    });

    it('should cap multiplier at max', () => {
      // Add many tricks to exceed max
      for (let i = 0; i < 50; i++) {
        comboSystem.addTrick(100);
      }

      const state = comboSystem.getState();
      expect(state.multiplier).toBeLessThanOrEqual(DEFAULT_COMBO_CONFIG.maxMultiplier);
    });

    it('should trigger tier up at thresholds', () => {
      // Add tricks to reach "nice" tier
      let tierUp = null;
      for (let i = 0; i < DEFAULT_COMBO_CONFIG.tierThresholds.nice; i++) {
        const result = comboSystem.addTrick(100);
        if (result.tierUp) tierUp = result.tierUp;
      }

      expect(tierUp).toBe('nice');
      expect(comboSystem.getState().tier).toBe('nice');
    });

    it('should track max combo', () => {
      comboSystem.addTrick(100);
      comboSystem.addTrick(100);
      comboSystem.addTrick(100);

      const state = comboSystem.getState();
      expect(state.maxCombo).toBe(3);
    });
  });

  describe('update', () => {
    it('should decrease time remaining', () => {
      comboSystem.addTrick(100);
      const initial = comboSystem.getState().timeRemaining;

      comboSystem.update(500);
      const after = comboSystem.getState().timeRemaining;

      expect(after).toBeLessThan(initial);
    });

    it('should end combo when time runs out', () => {
      comboSystem.addTrick(100);
      comboSystem.addTrick(200);

      const result = comboSystem.update(DEFAULT_COMBO_CONFIG.comboWindow + 100);

      expect(result.comboEnded).toBe(true);
      expect(result.finalPoints).toBeGreaterThan(0);
      expect(comboSystem.getState().isActive).toBe(false);
    });

    it('should not end combo while timer remains', () => {
      comboSystem.addTrick(100);

      const result = comboSystem.update(100);

      expect(result.comboEnded).toBe(false);
      expect(comboSystem.getState().isActive).toBe(true);
    });

    it('should reset timer when new trick is added', () => {
      comboSystem.addTrick(100);
      comboSystem.update(2000); // Almost expired

      comboSystem.addTrick(100); // Refresh timer

      const state = comboSystem.getState();
      expect(state.timeRemaining).toBe(DEFAULT_COMBO_CONFIG.comboWindow);
    });
  });

  describe('tier progression', () => {
    it('should progress through tiers', () => {
      const tiers: string[] = [];

      for (let i = 0; i < 25; i++) {
        const result = comboSystem.addTrick(100);
        if (result.tierUp) tiers.push(result.tierUp);
      }

      expect(tiers).toContain('nice');
      expect(tiers).toContain('great');
      expect(tiers).toContain('awesome');
      expect(tiers).toContain('legendary');
    });

    it('should add tier bonus points', () => {
      // Reach "nice" tier
      for (let i = 0; i < DEFAULT_COMBO_CONFIG.tierThresholds.nice - 1; i++) {
        comboSystem.addTrick(100);
      }

      const pointsBefore = comboSystem.getState().comboPoints;
      comboSystem.addTrick(100); // Triggers "nice" tier
      const pointsAfter = comboSystem.getState().comboPoints;

      // Points should include tier bonus
      const expectedBonus = DEFAULT_COMBO_CONFIG.tierBonuses.nice;
      expect(pointsAfter - pointsBefore).toBeGreaterThan(100 + expectedBonus - 50);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      comboSystem.addTrick(100);
      comboSystem.addTrick(100);

      comboSystem.reset();

      const state = comboSystem.getState();
      expect(state.count).toBe(0);
      expect(state.isActive).toBe(false);
      expect(state.maxCombo).toBe(0);
    });
  });

  describe('getTierLabel', () => {
    it('should return correct labels', () => {
      expect(comboSystem.getTierLabel()).toBe('');

      // Reach nice tier
      for (let i = 0; i < DEFAULT_COMBO_CONFIG.tierThresholds.nice; i++) {
        comboSystem.addTrick(100);
      }
      expect(comboSystem.getTierLabel()).toBe('NICE!');
    });
  });
});

describe('getComboTierColor', () => {
  it('should return correct colors for each tier', () => {
    expect(getComboTierColor('none')).toBe('#FFFFFF');
    expect(getComboTierColor('nice')).toBe('#4CAF50');
    expect(getComboTierColor('great')).toBe('#2196F3');
    expect(getComboTierColor('awesome')).toBe('#9C27B0');
    expect(getComboTierColor('legendary')).toBe('#FFD700');
  });
});
