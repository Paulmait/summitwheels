/**
 * Daily Reward System - Drives daily active user engagement
 *
 * Features:
 * - 7-day reward cycle with escalating rewards
 * - Streak bonuses for consecutive days
 * - Comeback rewards for returning players
 * - Lucky Spin wheel
 * - Free daily gift chest
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_REWARD_KEY = '@summit_wheels_daily_rewards';

// Reward types
export type RewardType = 'coins' | 'vehicle_unlock' | 'boost' | 'fuel_bonus' | 'mystery_box';

export type DailyReward = {
  day: number;
  type: RewardType;
  amount: number;
  description: string;
  icon: string;
  isPremium: boolean;
};

// 7-day reward cycle
export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, type: 'coins', amount: 100, description: '100 Coins', icon: 'coin', isPremium: false },
  { day: 2, type: 'coins', amount: 200, description: '200 Coins', icon: 'coin', isPremium: false },
  { day: 3, type: 'fuel_bonus', amount: 3, description: '3 Fuel Canisters', icon: 'fuel', isPremium: false },
  { day: 4, type: 'coins', amount: 500, description: '500 Coins', icon: 'coins', isPremium: false },
  { day: 5, type: 'boost', amount: 3, description: '3 Super Boosts', icon: 'boost', isPremium: false },
  { day: 6, type: 'coins', amount: 1000, description: '1000 Coins', icon: 'treasure', isPremium: false },
  { day: 7, type: 'mystery_box', amount: 1, description: 'Mystery Box!', icon: 'gift', isPremium: true },
];

// Lucky Spin wheel prizes
export type SpinPrize = {
  id: string;
  type: RewardType;
  amount: number;
  label: string;
  probability: number; // 0-100
  color: string;
};

export const SPIN_PRIZES: SpinPrize[] = [
  { id: 'coins_50', type: 'coins', amount: 50, label: '50', probability: 25, color: '#FFD700' },
  { id: 'coins_100', type: 'coins', amount: 100, label: '100', probability: 20, color: '#FFA500' },
  { id: 'coins_250', type: 'coins', amount: 250, label: '250', probability: 15, color: '#FF6B35' },
  { id: 'coins_500', type: 'coins', amount: 500, label: '500', probability: 10, color: '#E53935' },
  { id: 'coins_1000', type: 'coins', amount: 1000, label: '1K', probability: 5, color: '#9C27B0' },
  { id: 'boost_1', type: 'boost', amount: 1, label: 'Boost', probability: 10, color: '#00BCD4' },
  { id: 'fuel_1', type: 'fuel_bonus', amount: 1, label: 'Fuel', probability: 10, color: '#4CAF50' },
  { id: 'jackpot', type: 'coins', amount: 5000, label: '5K!', probability: 2, color: '#FFD700' },
  { id: 'try_again', type: 'coins', amount: 0, label: 'Again', probability: 3, color: '#9E9E9E' },
];

export type DailyRewardState = {
  // Login streak
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string; // YYYY-MM-DD
  nextRewardDay: number; // 1-7

  // Daily gift
  dailyGiftClaimed: boolean;
  lastGiftDate: string;

  // Lucky Spin
  freeSpinsRemaining: number;
  lastFreeSpinDate: string;
  totalSpins: number;

  // Comeback bonus
  daysAway: number;
  comebackBonusClaimed: boolean;
};

export type ClaimResult = {
  success: boolean;
  reward?: DailyReward;
  streakBonus?: number;
  error?: string;
};

/**
 * Get today's date string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate days between two date strings
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Daily Reward System singleton
 */
class DailyRewardSystemClass {
  private _state: DailyRewardState | null = null;
  private _isLoaded = false;

  /**
   * Load state from storage
   */
  async load(): Promise<DailyRewardState> {
    try {
      const stored = await AsyncStorage.getItem(DAILY_REWARD_KEY);
      if (stored) {
        this._state = JSON.parse(stored);
      } else {
        this._state = this._createInitialState();
      }

      // Check for new day and update state
      await this._checkNewDay();

      this._isLoaded = true;
      return this._state!;
    } catch (error) {
      console.error('Failed to load daily rewards:', error);
      this._state = this._createInitialState();
      this._isLoaded = true;
      return this._state;
    }
  }

  /**
   * Create initial state
   */
  private _createInitialState(): DailyRewardState {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: '',
      nextRewardDay: 1,
      dailyGiftClaimed: false,
      lastGiftDate: '',
      freeSpinsRemaining: 1,
      lastFreeSpinDate: '',
      totalSpins: 0,
      daysAway: 0,
      comebackBonusClaimed: false,
    };
  }

  /**
   * Save state
   */
  private async _save(): Promise<void> {
    if (this._state) {
      await AsyncStorage.setItem(DAILY_REWARD_KEY, JSON.stringify(this._state));
    }
  }

  /**
   * Check for new day and update streaks
   */
  private async _checkNewDay(): Promise<void> {
    if (!this._state) return;

    const today = getTodayString();
    const lastLogin = this._state.lastLoginDate;

    if (!lastLogin) {
      // First login ever
      this._state.currentStreak = 1;
      this._state.lastLoginDate = today;
      this._state.dailyGiftClaimed = false;
      this._state.freeSpinsRemaining = 1;
      await this._save();
      return;
    }

    if (lastLogin === today) {
      // Same day, no changes needed
      return;
    }

    const daysGone = daysBetween(lastLogin, today);

    if (daysGone === 1) {
      // Consecutive day - increase streak
      this._state.currentStreak++;
      if (this._state.currentStreak > this._state.longestStreak) {
        this._state.longestStreak = this._state.currentStreak;
      }
    } else if (daysGone > 1) {
      // Streak broken
      this._state.daysAway = daysGone;
      this._state.comebackBonusClaimed = false;
      this._state.currentStreak = 1; // Reset to 1 for today
      this._state.nextRewardDay = 1; // Reset reward cycle
    }

    // Reset daily items
    this._state.lastLoginDate = today;
    this._state.dailyGiftClaimed = false;
    this._state.freeSpinsRemaining = 1;
    this._state.lastFreeSpinDate = '';

    await this._save();
  }

  /**
   * Get current state
   */
  getState(): DailyRewardState | null {
    return this._state;
  }

  /**
   * Check if daily reward is available
   */
  isDailyRewardAvailable(): boolean {
    if (!this._state) return false;
    return !this._state.dailyGiftClaimed;
  }

  /**
   * Get today's reward
   */
  getTodaysReward(): DailyReward {
    const day = this._state?.nextRewardDay ?? 1;
    return DAILY_REWARDS[day - 1];
  }

  /**
   * Claim daily reward
   */
  async claimDailyReward(): Promise<ClaimResult> {
    if (!this._state) {
      return { success: false, error: 'System not initialized' };
    }

    if (this._state.dailyGiftClaimed) {
      return { success: false, error: 'Already claimed today' };
    }

    const reward = this.getTodaysReward();

    // Calculate streak bonus (10% per day of streak, max 100%)
    const streakMultiplier = Math.min(this._state.currentStreak * 0.1, 1.0);
    const streakBonus = reward.type === 'coins' ? Math.floor(reward.amount * streakMultiplier) : 0;

    // Mark as claimed
    this._state.dailyGiftClaimed = true;
    this._state.lastGiftDate = getTodayString();

    // Advance to next day in cycle
    this._state.nextRewardDay = (this._state.nextRewardDay % 7) + 1;

    await this._save();

    return {
      success: true,
      reward,
      streakBonus,
    };
  }

  /**
   * Check if free spin is available
   */
  isFreeSpinAvailable(): boolean {
    if (!this._state) return false;
    return this._state.freeSpinsRemaining > 0;
  }

  /**
   * Spin the wheel
   */
  async spin(isPaid: boolean = false): Promise<SpinPrize | null> {
    if (!this._state) return null;

    if (!isPaid && this._state.freeSpinsRemaining <= 0) {
      return null;
    }

    // Use free spin
    if (!isPaid) {
      this._state.freeSpinsRemaining--;
      this._state.lastFreeSpinDate = getTodayString();
    }

    this._state.totalSpins++;
    await this._save();

    // Weighted random selection
    const totalWeight = SPIN_PRIZES.reduce((sum, p) => sum + p.probability, 0);
    let random = Math.random() * totalWeight;

    for (const prize of SPIN_PRIZES) {
      random -= prize.probability;
      if (random <= 0) {
        return prize;
      }
    }

    // Fallback
    return SPIN_PRIZES[0];
  }

  /**
   * Get comeback bonus amount
   */
  getComebackBonus(): number {
    if (!this._state || this._state.daysAway <= 1) return 0;

    // 100 coins per day away, max 7 days = 700 coins
    return Math.min(this._state.daysAway, 7) * 100;
  }

  /**
   * Check if comeback bonus is available
   */
  isComebackBonusAvailable(): boolean {
    if (!this._state) return false;
    return this._state.daysAway > 1 && !this._state.comebackBonusClaimed;
  }

  /**
   * Claim comeback bonus
   */
  async claimComebackBonus(): Promise<number> {
    if (!this._state || !this.isComebackBonusAvailable()) return 0;

    const bonus = this.getComebackBonus();
    this._state.comebackBonusClaimed = true;
    this._state.daysAway = 0;

    await this._save();
    return bonus;
  }

  /**
   * Get streak info for display
   */
  getStreakInfo(): {
    current: number;
    longest: number;
    nextMilestone: number;
    bonusPercentage: number;
  } {
    const current = this._state?.currentStreak ?? 0;
    const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
    const nextMilestone = milestones.find(m => m > current) ?? 365;

    return {
      current,
      longest: this._state?.longestStreak ?? 0,
      nextMilestone,
      bonusPercentage: Math.min(current * 10, 100),
    };
  }

  /**
   * Get time until next free spin
   */
  getTimeUntilFreeSpin(): { hours: number; minutes: number } {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();

    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    };
  }

  /**
   * Reset for GDPR deletion
   */
  async reset(): Promise<void> {
    this._state = this._createInitialState();
    await AsyncStorage.removeItem(DAILY_REWARD_KEY);
  }
}

export const DailyRewardSystem = new DailyRewardSystemClass();
export { DailyRewardSystemClass };
