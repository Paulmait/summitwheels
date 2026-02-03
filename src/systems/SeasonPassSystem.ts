/**
 * Season Pass System - Long-term progression and engagement
 *
 * Features:
 * - 50-level season pass with free and premium tracks
 * - XP earned from gameplay activities
 * - Exclusive rewards for premium pass holders
 * - Seasonal themes and limited-time content
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SEASON_PASS_KEY = '@summit_wheels_season_pass';

// Reward types
export type SeasonRewardType =
  | 'coins'
  | 'vehicle_skin'
  | 'boost_pack'
  | 'exclusive_vehicle'
  | 'exclusive_stage'
  | 'profile_badge'
  | 'trail_effect'
  | 'xp_boost';

export type SeasonReward = {
  level: number;
  track: 'free' | 'premium';
  type: SeasonRewardType;
  amount: number;
  itemId?: string;
  name: string;
  description: string;
  icon: string;
};

// XP sources
export type XPSource =
  | 'distance'
  | 'coins_collected'
  | 'tricks'
  | 'daily_challenge'
  | 'achievement'
  | 'daily_login'
  | 'first_win';

export const XP_VALUES: Record<XPSource, number> = {
  distance: 1, // per 100m
  coins_collected: 1, // per 10 coins
  tricks: 5, // per trick
  daily_challenge: 100,
  achievement: 50,
  daily_login: 25,
  first_win: 50, // first run of the day
};

// Season config
export const SEASON_CONFIG = {
  maxLevel: 50,
  xpPerLevel: 100,
  xpScaling: 1.05, // Each level requires 5% more XP
  seasonDurationDays: 60,
};

/**
 * Generate season rewards
 */
function generateSeasonRewards(): SeasonReward[] {
  const rewards: SeasonReward[] = [];

  for (let level = 1; level <= SEASON_CONFIG.maxLevel; level++) {
    // Free track reward
    rewards.push(generateFreeReward(level));

    // Premium track reward (every level)
    rewards.push(generatePremiumReward(level));
  }

  return rewards;
}

function generateFreeReward(level: number): SeasonReward {
  // Free rewards every 5 levels with smaller rewards in between
  const isMilestone = level % 5 === 0;

  if (level === 10) {
    return {
      level,
      track: 'free',
      type: 'coins',
      amount: 1000,
      name: '1000 Coins',
      description: 'A nice coin bonus!',
      icon: 'coins',
    };
  }

  if (level === 25) {
    return {
      level,
      track: 'free',
      type: 'boost_pack',
      amount: 5,
      name: '5x Super Boost',
      description: 'Boost your way to victory!',
      icon: 'boost',
    };
  }

  if (level === 50) {
    return {
      level,
      track: 'free',
      type: 'coins',
      amount: 5000,
      name: '5000 Coins',
      description: 'Season finale reward!',
      icon: 'treasure',
    };
  }

  if (isMilestone) {
    return {
      level,
      track: 'free',
      type: 'coins',
      amount: level * 20,
      name: `${level * 20} Coins`,
      description: 'Milestone reward',
      icon: 'coin',
    };
  }

  return {
    level,
    track: 'free',
    type: 'coins',
    amount: 50 + level * 5,
    name: `${50 + level * 5} Coins`,
    description: 'Level up reward',
    icon: 'coin',
  };
}

function generatePremiumReward(level: number): SeasonReward {
  // Premium rewards are always better
  if (level === 1) {
    return {
      level,
      track: 'premium',
      type: 'profile_badge',
      amount: 1,
      itemId: 'badge_season_1',
      name: 'Season Pass Badge',
      description: 'Show your dedication!',
      icon: 'badge',
    };
  }

  if (level === 10) {
    return {
      level,
      track: 'premium',
      type: 'vehicle_skin',
      amount: 1,
      itemId: 'skin_jeep_gold',
      name: 'Golden Jeep Skin',
      description: 'Exclusive gold finish',
      icon: 'skin',
    };
  }

  if (level === 25) {
    return {
      level,
      track: 'premium',
      type: 'exclusive_vehicle',
      amount: 1,
      itemId: 'rally_car',
      name: 'Rally Car',
      description: 'Exclusive season vehicle!',
      icon: 'vehicle',
    };
  }

  if (level === 40) {
    return {
      level,
      track: 'premium',
      type: 'trail_effect',
      amount: 1,
      itemId: 'trail_fire',
      name: 'Fire Trail',
      description: 'Leave flames in your wake!',
      icon: 'trail',
    };
  }

  if (level === 50) {
    return {
      level,
      track: 'premium',
      type: 'exclusive_stage',
      amount: 1,
      itemId: 'rainbow_road',
      name: 'Rainbow Road',
      description: 'The ultimate stage!',
      icon: 'stage',
    };
  }

  // Regular premium rewards
  if (level % 5 === 0) {
    return {
      level,
      track: 'premium',
      type: 'boost_pack',
      amount: 3,
      name: '3x Super Boost',
      description: 'Premium boost pack',
      icon: 'boost',
    };
  }

  if (level % 3 === 0) {
    return {
      level,
      track: 'premium',
      type: 'xp_boost',
      amount: 2,
      name: '2x XP (1 hour)',
      description: 'Double XP for one hour',
      icon: 'xp',
    };
  }

  return {
    level,
    track: 'premium',
    type: 'coins',
    amount: 100 + level * 10,
    name: `${100 + level * 10} Coins`,
    description: 'Premium coins',
    icon: 'coins',
  };
}

export type SeasonPassState = {
  // Season info
  seasonId: string;
  seasonStartDate: string;
  seasonEndDate: string;

  // Progress
  currentLevel: number;
  currentXP: number;
  totalXPEarned: number;

  // Premium
  hasPremiumPass: boolean;

  // Claimed rewards
  claimedFreeRewards: number[];
  claimedPremiumRewards: number[];

  // XP boosts
  xpBoostEndTime: number;
  xpBoostMultiplier: number;

  // First run today
  hasClaimedFirstRun: boolean;
  lastFirstRunDate: string;
};

/**
 * Calculate XP required for a level
 */
function xpRequiredForLevel(level: number): number {
  return Math.floor(SEASON_CONFIG.xpPerLevel * Math.pow(SEASON_CONFIG.xpScaling, level - 1));
}

/**
 * Get total XP required to reach a level
 */
function totalXPToLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

/**
 * Season Pass System singleton
 */
class SeasonPassSystemClass {
  private _state: SeasonPassState | null = null;
  private _rewards: SeasonReward[] = [];
  private _isLoaded = false;

  constructor() {
    this._rewards = generateSeasonRewards();
  }

  /**
   * Load state from storage
   */
  async load(): Promise<SeasonPassState> {
    try {
      const stored = await AsyncStorage.getItem(SEASON_PASS_KEY);
      if (stored) {
        this._state = JSON.parse(stored);

        // Check if season is still active
        await this._checkSeasonValidity();
      } else {
        this._state = this._createNewSeason();
        await this._save();
      }

      // Check for first run of day
      this._checkFirstRun();

      this._isLoaded = true;
      return this._state!;
    } catch (error) {
      console.error('Failed to load season pass:', error);
      this._state = this._createNewSeason();
      this._isLoaded = true;
      return this._state;
    }
  }

  /**
   * Create a new season
   */
  private _createNewSeason(): SeasonPassState {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + SEASON_CONFIG.seasonDurationDays);

    return {
      seasonId: `season_${Date.now()}`,
      seasonStartDate: startDate.toISOString(),
      seasonEndDate: endDate.toISOString(),
      currentLevel: 1,
      currentXP: 0,
      totalXPEarned: 0,
      hasPremiumPass: false,
      claimedFreeRewards: [],
      claimedPremiumRewards: [],
      xpBoostEndTime: 0,
      xpBoostMultiplier: 1,
      hasClaimedFirstRun: false,
      lastFirstRunDate: '',
    };
  }

  /**
   * Check season validity
   */
  private async _checkSeasonValidity(): Promise<void> {
    if (!this._state) return;

    const now = new Date();
    const endDate = new Date(this._state.seasonEndDate);

    if (now > endDate) {
      // Season has ended, start new season
      // Note: In production, you'd have proper season transitions
      this._state = this._createNewSeason();
      await this._save();
    }
  }

  /**
   * Check for first run of day
   */
  private _checkFirstRun(): void {
    if (!this._state) return;

    const today = new Date().toISOString().split('T')[0];
    if (this._state.lastFirstRunDate !== today) {
      this._state.hasClaimedFirstRun = false;
    }
  }

  /**
   * Save state
   */
  private async _save(): Promise<void> {
    if (this._state) {
      await AsyncStorage.setItem(SEASON_PASS_KEY, JSON.stringify(this._state));
    }
  }

  /**
   * Get current state
   */
  getState(): SeasonPassState | null {
    return this._state;
  }

  /**
   * Get all rewards
   */
  getRewards(): SeasonReward[] {
    return this._rewards;
  }

  /**
   * Get rewards for a specific level
   */
  getRewardsForLevel(level: number): {
    free: SeasonReward | undefined;
    premium: SeasonReward | undefined;
  } {
    return {
      free: this._rewards.find((r) => r.level === level && r.track === 'free'),
      premium: this._rewards.find((r) => r.level === level && r.track === 'premium'),
    };
  }

  /**
   * Add XP from gameplay
   */
  async addXP(source: XPSource, amount: number = 1): Promise<{
    xpAdded: number;
    leveledUp: boolean;
    newLevel: number;
  }> {
    if (!this._state) {
      return { xpAdded: 0, leveledUp: false, newLevel: 1 };
    }

    const baseXP = XP_VALUES[source] * amount;

    // Apply XP boost if active
    let multiplier = 1;
    if (this._state.xpBoostEndTime > Date.now()) {
      multiplier = this._state.xpBoostMultiplier;
    }

    // Premium pass gives +25% XP
    if (this._state.hasPremiumPass) {
      multiplier *= 1.25;
    }

    const xpAdded = Math.floor(baseXP * multiplier);

    this._state.currentXP += xpAdded;
    this._state.totalXPEarned += xpAdded;

    // Check for level up
    let leveledUp = false;
    const prevLevel = this._state.currentLevel;

    while (
      this._state.currentLevel < SEASON_CONFIG.maxLevel &&
      this._state.currentXP >= xpRequiredForLevel(this._state.currentLevel)
    ) {
      this._state.currentXP -= xpRequiredForLevel(this._state.currentLevel);
      this._state.currentLevel++;
      leveledUp = true;
    }

    // Cap at max level
    if (this._state.currentLevel >= SEASON_CONFIG.maxLevel) {
      this._state.currentLevel = SEASON_CONFIG.maxLevel;
    }

    await this._save();

    return {
      xpAdded,
      leveledUp,
      newLevel: this._state.currentLevel,
    };
  }

  /**
   * Claim first run XP bonus
   */
  async claimFirstRunBonus(): Promise<number> {
    if (!this._state || this._state.hasClaimedFirstRun) {
      return 0;
    }

    const today = new Date().toISOString().split('T')[0];
    this._state.hasClaimedFirstRun = true;
    this._state.lastFirstRunDate = today;

    const result = await this.addXP('first_win');
    return result.xpAdded;
  }

  /**
   * Check if first run bonus is available
   */
  isFirstRunBonusAvailable(): boolean {
    return this._state ? !this._state.hasClaimedFirstRun : false;
  }

  /**
   * Claim reward
   */
  async claimReward(level: number, track: 'free' | 'premium'): Promise<SeasonReward | null> {
    if (!this._state) return null;

    // Check level requirement
    if (this._state.currentLevel < level) {
      return null;
    }

    // Check premium requirement
    if (track === 'premium' && !this._state.hasPremiumPass) {
      return null;
    }

    // Check if already claimed
    const claimedList = track === 'free' ? this._state.claimedFreeRewards : this._state.claimedPremiumRewards;
    if (claimedList.includes(level)) {
      return null;
    }

    // Find reward
    const reward = this._rewards.find((r) => r.level === level && r.track === track);
    if (!reward) return null;

    // Mark as claimed
    claimedList.push(level);
    await this._save();

    return reward;
  }

  /**
   * Get unclaimed rewards
   */
  getUnclaimedRewards(): SeasonReward[] {
    if (!this._state) return [];

    return this._rewards.filter((reward) => {
      if (reward.level > this._state!.currentLevel) return false;

      if (reward.track === 'premium' && !this._state!.hasPremiumPass) return false;

      const claimedList =
        reward.track === 'free' ? this._state!.claimedFreeRewards : this._state!.claimedPremiumRewards;

      return !claimedList.includes(reward.level);
    });
  }

  /**
   * Upgrade to premium pass
   */
  async upgradeToPremium(): Promise<void> {
    if (this._state) {
      this._state.hasPremiumPass = true;
      await this._save();
    }
  }

  /**
   * Activate XP boost
   */
  async activateXPBoost(multiplier: number, durationMs: number): Promise<void> {
    if (this._state) {
      this._state.xpBoostMultiplier = multiplier;
      this._state.xpBoostEndTime = Date.now() + durationMs;
      await this._save();
    }
  }

  /**
   * Get progress info
   */
  getProgressInfo(): {
    level: number;
    currentXP: number;
    xpToNextLevel: number;
    progressPercent: number;
    daysRemaining: number;
  } {
    if (!this._state) {
      return { level: 1, currentXP: 0, xpToNextLevel: 100, progressPercent: 0, daysRemaining: 0 };
    }

    const xpToNextLevel = xpRequiredForLevel(this._state.currentLevel);
    const progressPercent = Math.floor((this._state.currentXP / xpToNextLevel) * 100);

    const now = new Date();
    const endDate = new Date(this._state.seasonEndDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      level: this._state.currentLevel,
      currentXP: this._state.currentXP,
      xpToNextLevel,
      progressPercent,
      daysRemaining,
    };
  }

  /**
   * Reset for GDPR deletion
   */
  async reset(): Promise<void> {
    this._state = this._createNewSeason();
    await AsyncStorage.removeItem(SEASON_PASS_KEY);
  }
}

export const SeasonPassSystem = new SeasonPassSystemClass();
export { SeasonPassSystemClass };
