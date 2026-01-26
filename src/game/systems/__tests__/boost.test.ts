/**
 * Tests for Boost System
 */

import {
  createBoostSystem,
  BoostSystem,
  DEFAULT_BOOST_CONFIG,
  getBoostBarColor,
} from '../boost';

describe('BoostSystem', () => {
  let boostSystem: BoostSystem;

  beforeEach(() => {
    boostSystem = createBoostSystem();
  });

  describe('initialization', () => {
    it('should start with no boost', () => {
      const state = boostSystem.getState();

      expect(state.amount).toBe(0);
      expect(state.isBoosting).toBe(false);
      expect(state.powerMultiplier).toBe(1.0);
    });

    it('should have correct max amount', () => {
      expect(boostSystem.getState().maxAmount).toBe(DEFAULT_BOOST_CONFIG.maxAmount);
    });
  });

  describe('addBoost', () => {
    it('should add boost from trick points', () => {
      const gained = boostSystem.addBoost(500);

      expect(gained).toBeGreaterThan(0);
      expect(boostSystem.getState().amount).toBeGreaterThan(0);
    });

    it('should cap at max amount', () => {
      boostSystem.addBoost(10000); // Way more than max

      expect(boostSystem.getState().amount).toBe(DEFAULT_BOOST_CONFIG.maxAmount);
    });

    it('should return actual amount gained', () => {
      boostSystem.addBoost(1000);
      const firstAmount = boostSystem.getState().amount;

      const gained = boostSystem.addBoost(10000);

      expect(gained).toBe(DEFAULT_BOOST_CONFIG.maxAmount - firstAmount);
    });
  });

  describe('canBoost', () => {
    it('should return false when boost is too low', () => {
      boostSystem.addBoost(100); // Small amount

      expect(boostSystem.canBoost()).toBe(false);
    });

    it('should return true when boost is sufficient', () => {
      boostSystem.addBoost(2000); // Should be above minimum

      expect(boostSystem.canBoost()).toBe(true);
    });

    it('should return false during cooldown', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();
      boostSystem.stopBoost();

      expect(boostSystem.canBoost()).toBe(false);
    });

    it('should return false while already boosting', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();

      expect(boostSystem.canBoost()).toBe(false);
    });
  });

  describe('startBoost', () => {
    it('should fail if not enough boost', () => {
      const result = boostSystem.startBoost();

      expect(result).toBe(false);
      expect(boostSystem.getState().isBoosting).toBe(false);
    });

    it('should succeed with enough boost', () => {
      boostSystem.addBoost(2000);
      const result = boostSystem.startBoost();

      expect(result).toBe(true);
      expect(boostSystem.getState().isBoosting).toBe(true);
    });

    it('should apply power multiplier', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();

      expect(boostSystem.getState().powerMultiplier).toBe(
        DEFAULT_BOOST_CONFIG.powerMultiplier
      );
    });
  });

  describe('stopBoost', () => {
    it('should stop boosting', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();
      boostSystem.stopBoost();

      expect(boostSystem.getState().isBoosting).toBe(false);
    });

    it('should reset power multiplier', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();
      boostSystem.stopBoost();

      expect(boostSystem.getState().powerMultiplier).toBe(1.0);
    });

    it('should start cooldown', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();
      boostSystem.stopBoost();

      expect(boostSystem.getState().cooldown).toBe(
        DEFAULT_BOOST_CONFIG.cooldownDuration
      );
    });
  });

  describe('update', () => {
    it('should consume boost while active', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();
      const initial = boostSystem.getState().amount;

      boostSystem.update(1000); // 1 second

      expect(boostSystem.getState().amount).toBeLessThan(initial);
    });

    it('should auto-stop when boost depletes', () => {
      boostSystem.addBoost(500); // Minimal boost
      boostSystem.startBoost();

      boostSystem.update(10000); // Consume all

      expect(boostSystem.getState().isBoosting).toBe(false);
      expect(boostSystem.getState().amount).toBe(0);
    });

    it('should decrease cooldown over time', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();
      boostSystem.stopBoost();

      const initialCooldown = boostSystem.getState().cooldown;
      boostSystem.update(500);

      expect(boostSystem.getState().cooldown).toBeLessThan(initialCooldown);
    });

    it('should passively regenerate when not boosting', () => {
      boostSystem.addBoost(100);
      const initial = boostSystem.getState().amount;

      boostSystem.update(1000); // 1 second

      expect(boostSystem.getState().amount).toBeGreaterThan(initial);
    });

    it('should not regenerate while boosting', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();
      const initial = boostSystem.getState().amount;

      boostSystem.update(100); // Small update

      // Should only consume, not regenerate
      expect(boostSystem.getState().amount).toBeLessThan(initial);
    });
  });

  describe('getPercentage', () => {
    it('should return 0 when empty', () => {
      expect(boostSystem.getPercentage()).toBe(0);
    });

    it('should return 1 when full', () => {
      boostSystem.addBoost(10000);

      expect(boostSystem.getPercentage()).toBe(1);
    });

    it('should return correct percentage', () => {
      boostSystem.addBoost(1000); // Should be 50%

      expect(boostSystem.getPercentage()).toBeCloseTo(0.5, 1);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      boostSystem.addBoost(2000);
      boostSystem.startBoost();

      boostSystem.reset();

      const state = boostSystem.getState();
      expect(state.amount).toBe(0);
      expect(state.isBoosting).toBe(false);
      expect(state.cooldown).toBe(0);
    });
  });
});

describe('getBoostBarColor', () => {
  it('should return orange when boosting', () => {
    const state = {
      amount: 50,
      maxAmount: 100,
      isBoosting: true,
      powerMultiplier: 1.8,
      boostTime: 0,
      cooldown: 0,
    };

    expect(getBoostBarColor(state)).toBe('#FF6B35');
  });

  it('should return gray during cooldown', () => {
    const state = {
      amount: 50,
      maxAmount: 100,
      isBoosting: false,
      powerMultiplier: 1.0,
      boostTime: 0,
      cooldown: 500,
    };

    expect(getBoostBarColor(state)).toBe('#666666');
  });

  it('should return cyan when ready', () => {
    const state = {
      amount: 50,
      maxAmount: 100,
      isBoosting: false,
      powerMultiplier: 1.0,
      boostTime: 0,
      cooldown: 0,
    };

    expect(getBoostBarColor(state)).toBe('#00BCD4');
  });
});
