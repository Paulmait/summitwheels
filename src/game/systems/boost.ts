/**
 * Boost/Nitro System - Earned through tricks
 *
 * UNIQUE TO SUMMIT WHEELS:
 * Unlike purchased boosts, this rewards skillful play.
 * Land tricks to fill your boost meter, then use strategically.
 */

export type BoostState = {
  /** Current boost amount (0-100) */
  amount: number;
  /** Max boost capacity */
  maxAmount: number;
  /** Is currently boosting */
  isBoosting: boolean;
  /** Boost power multiplier */
  powerMultiplier: number;
  /** Time boosting (for effects) */
  boostTime: number;
  /** Cooldown remaining (can't boost again immediately) */
  cooldown: number;
};

export type BoostConfig = {
  /** Max boost capacity */
  maxAmount: number;
  /** Boost gained per trick point */
  gainPerPoint: number;
  /** Boost consumed per second while active */
  consumeRate: number;
  /** Speed/power multiplier when boosting */
  powerMultiplier: number;
  /** Minimum boost required to activate */
  minActivationAmount: number;
  /** Cooldown after boost ends (ms) */
  cooldownDuration: number;
  /** Passive boost regeneration per second */
  passiveRegen: number;
};

export const DEFAULT_BOOST_CONFIG: BoostConfig = {
  maxAmount: 100,
  gainPerPoint: 0.05, // 500 points = 25 boost
  consumeRate: 25, // 4 seconds of full boost
  powerMultiplier: 1.8, // 80% more power
  minActivationAmount: 20, // Need at least 20% to activate
  cooldownDuration: 1000, // 1 second cooldown
  passiveRegen: 2, // 2% per second passive regen
};

export type BoostSystem = {
  /** Get current state */
  getState: () => BoostState;
  /** Add boost from tricks */
  addBoost: (trickPoints: number) => number;
  /** Start boosting (returns success) */
  startBoost: () => boolean;
  /** Stop boosting */
  stopBoost: () => void;
  /** Update system (call each frame) */
  update: (deltaMs: number) => void;
  /** Reset system */
  reset: () => void;
  /** Get boost percentage (0-1) */
  getPercentage: () => number;
  /** Check if can activate boost */
  canBoost: () => boolean;
};

/**
 * Creates a boost system
 */
export function createBoostSystem(
  config: Partial<BoostConfig> = {}
): BoostSystem {
  const cfg: BoostConfig = { ...DEFAULT_BOOST_CONFIG, ...config };

  let state: BoostState = {
    amount: 0,
    maxAmount: cfg.maxAmount,
    isBoosting: false,
    powerMultiplier: 1.0,
    boostTime: 0,
    cooldown: 0,
  };

  const getState = (): BoostState => ({ ...state });

  const addBoost = (trickPoints: number): number => {
    const gain = trickPoints * cfg.gainPerPoint;
    const previousAmount = state.amount;
    state.amount = Math.min(cfg.maxAmount, state.amount + gain);
    return state.amount - previousAmount;
  };

  const canBoost = (): boolean => {
    return (
      state.amount >= cfg.minActivationAmount &&
      state.cooldown <= 0 &&
      !state.isBoosting
    );
  };

  const startBoost = (): boolean => {
    if (!canBoost()) return false;

    state.isBoosting = true;
    state.powerMultiplier = cfg.powerMultiplier;
    state.boostTime = 0;
    return true;
  };

  const stopBoost = (): void => {
    if (!state.isBoosting) return;

    state.isBoosting = false;
    state.powerMultiplier = 1.0;
    state.cooldown = cfg.cooldownDuration;
  };

  const update = (deltaMs: number): void => {
    const deltaSeconds = deltaMs / 1000;

    // Update cooldown
    if (state.cooldown > 0) {
      state.cooldown = Math.max(0, state.cooldown - deltaMs);
    }

    // Consume boost while boosting
    if (state.isBoosting) {
      state.boostTime += deltaMs;
      state.amount -= cfg.consumeRate * deltaSeconds;

      if (state.amount <= 0) {
        state.amount = 0;
        stopBoost();
      }
    } else {
      // Passive regeneration when not boosting
      state.amount = Math.min(
        cfg.maxAmount,
        state.amount + cfg.passiveRegen * deltaSeconds
      );
    }
  };

  const reset = (): void => {
    state = {
      amount: 0,
      maxAmount: cfg.maxAmount,
      isBoosting: false,
      powerMultiplier: 1.0,
      boostTime: 0,
      cooldown: 0,
    };
  };

  const getPercentage = (): number => state.amount / cfg.maxAmount;

  return {
    getState,
    addBoost,
    startBoost,
    stopBoost,
    update,
    reset,
    getPercentage,
    canBoost,
  };
}

/**
 * Get boost bar color based on state
 */
export function getBoostBarColor(state: BoostState): string {
  if (state.isBoosting) {
    // Pulsing orange when active
    return '#FF6B35';
  }
  if (state.cooldown > 0) {
    // Gray during cooldown
    return '#666666';
  }
  if (state.amount >= DEFAULT_BOOST_CONFIG.minActivationAmount) {
    // Cyan when ready
    return '#00BCD4';
  }
  // Blue when charging
  return '#2196F3';
}

/**
 * Get boost visual effects intensity
 */
export function getBoostEffectIntensity(state: BoostState): number {
  if (!state.isBoosting) return 0;

  // Pulsing effect based on time
  const pulse = Math.sin(state.boostTime / 100) * 0.2 + 0.8;
  return pulse;
}
