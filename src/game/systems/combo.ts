/**
 * Combo System - Chain tricks for multipliers
 *
 * UNIQUE TO SUMMIT WHEELS:
 * Unlike simple trick scoring, combos reward skilled play
 * with escalating multipliers and special bonuses.
 */

export type ComboTier = 'none' | 'nice' | 'great' | 'awesome' | 'legendary';

export type ComboState = {
  /** Current combo count */
  count: number;
  /** Current multiplier */
  multiplier: number;
  /** Current tier */
  tier: ComboTier;
  /** Time remaining in combo window (ms) */
  timeRemaining: number;
  /** Total points earned from current combo */
  comboPoints: number;
  /** Highest combo achieved this run */
  maxCombo: number;
  /** Is combo active */
  isActive: boolean;
};

export type ComboConfig = {
  /** Time window to chain tricks (ms) */
  comboWindow: number;
  /** Base multiplier */
  baseMultiplier: number;
  /** Multiplier increase per combo */
  multiplierPerCombo: number;
  /** Max multiplier cap */
  maxMultiplier: number;
  /** Combo thresholds for tiers */
  tierThresholds: {
    nice: number;
    great: number;
    awesome: number;
    legendary: number;
  };
  /** Bonus points for reaching tiers */
  tierBonuses: {
    nice: number;
    great: number;
    awesome: number;
    legendary: number;
  };
};

export const DEFAULT_COMBO_CONFIG: ComboConfig = {
  comboWindow: 3000, // 3 seconds to chain
  baseMultiplier: 1.0,
  multiplierPerCombo: 0.25,
  maxMultiplier: 5.0,
  tierThresholds: {
    nice: 2,
    great: 5,
    awesome: 10,
    legendary: 20,
  },
  tierBonuses: {
    nice: 100,
    great: 500,
    awesome: 2000,
    legendary: 10000,
  },
};

export type ComboSystem = {
  /** Get current state */
  getState: () => ComboState;
  /** Add a trick to combo (returns multiplied points) */
  addTrick: (basePoints: number) => { points: number; tierUp: ComboTier | null };
  /** Update timer (call each frame) */
  update: (deltaMs: number) => { comboEnded: boolean; finalPoints: number };
  /** Reset combo */
  reset: () => void;
  /** Get combo tier label */
  getTierLabel: () => string;
};

/**
 * Creates a combo system
 */
export function createComboSystem(
  config: Partial<ComboConfig> = {}
): ComboSystem {
  const cfg: ComboConfig = { ...DEFAULT_COMBO_CONFIG, ...config };

  let state: ComboState = {
    count: 0,
    multiplier: cfg.baseMultiplier,
    tier: 'none',
    timeRemaining: 0,
    comboPoints: 0,
    maxCombo: 0,
    isActive: false,
  };

  const getState = (): ComboState => ({ ...state });

  const calculateTier = (count: number): ComboTier => {
    if (count >= cfg.tierThresholds.legendary) return 'legendary';
    if (count >= cfg.tierThresholds.awesome) return 'awesome';
    if (count >= cfg.tierThresholds.great) return 'great';
    if (count >= cfg.tierThresholds.nice) return 'nice';
    return 'none';
  };

  const addTrick = (
    basePoints: number
  ): { points: number; tierUp: ComboTier | null } => {
    const previousTier = state.tier;

    // Increment combo
    state.count++;
    state.isActive = true;
    state.timeRemaining = cfg.comboWindow;

    // Update multiplier (capped)
    state.multiplier = Math.min(
      cfg.maxMultiplier,
      cfg.baseMultiplier + (state.count - 1) * cfg.multiplierPerCombo
    );

    // Calculate points with multiplier
    const multipliedPoints = Math.round(basePoints * state.multiplier);
    state.comboPoints += multipliedPoints;

    // Update max combo
    state.maxCombo = Math.max(state.maxCombo, state.count);

    // Check for tier up
    const newTier = calculateTier(state.count);
    let tierUp: ComboTier | null = null;

    if (newTier !== previousTier && newTier !== 'none') {
      state.tier = newTier;
      tierUp = newTier;

      // Add tier bonus
      const tierBonus = cfg.tierBonuses[newTier];
      state.comboPoints += tierBonus;
    }

    return { points: multipliedPoints, tierUp };
  };

  const update = (
    deltaMs: number
  ): { comboEnded: boolean; finalPoints: number } => {
    if (!state.isActive) {
      return { comboEnded: false, finalPoints: 0 };
    }

    state.timeRemaining -= deltaMs;

    if (state.timeRemaining <= 0) {
      // Combo ended
      const finalPoints = state.comboPoints;
      const wasActive = state.isActive;

      // Reset state but keep maxCombo
      const maxCombo = state.maxCombo;
      state = {
        count: 0,
        multiplier: cfg.baseMultiplier,
        tier: 'none',
        timeRemaining: 0,
        comboPoints: 0,
        maxCombo,
        isActive: false,
      };

      return { comboEnded: wasActive, finalPoints };
    }

    return { comboEnded: false, finalPoints: 0 };
  };

  const reset = (): void => {
    state = {
      count: 0,
      multiplier: cfg.baseMultiplier,
      tier: 'none',
      timeRemaining: 0,
      comboPoints: 0,
      maxCombo: 0,
      isActive: false,
    };
  };

  const getTierLabel = (): string => {
    switch (state.tier) {
      case 'nice':
        return 'NICE!';
      case 'great':
        return 'GREAT!';
      case 'awesome':
        return 'AWESOME!';
      case 'legendary':
        return 'LEGENDARY!';
      default:
        return '';
    }
  };

  return {
    getState,
    addTrick,
    update,
    reset,
    getTierLabel,
  };
}

/**
 * Get tier color for display
 */
export function getComboTierColor(tier: ComboTier): string {
  switch (tier) {
    case 'nice':
      return '#4CAF50'; // Green
    case 'great':
      return '#2196F3'; // Blue
    case 'awesome':
      return '#9C27B0'; // Purple
    case 'legendary':
      return '#FFD700'; // Gold
    default:
      return '#FFFFFF';
  }
}

/**
 * Get tier glow intensity for visual effects
 */
export function getComboTierGlow(tier: ComboTier): number {
  switch (tier) {
    case 'nice':
      return 0.3;
    case 'great':
      return 0.5;
    case 'awesome':
      return 0.7;
    case 'legendary':
      return 1.0;
    default:
      return 0;
  }
}
