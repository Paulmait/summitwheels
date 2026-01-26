/**
 * Achievement System
 *
 * UNIQUE TO SUMMIT WHEELS:
 * Comprehensive achievement system with unlockable rewards.
 * Progress tracking, secret achievements, and milestone bonuses.
 */

export type AchievementCategory =
  | 'distance'
  | 'tricks'
  | 'collection'
  | 'mastery'
  | 'secret';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type Achievement = {
  /** Unique ID */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Category */
  category: AchievementCategory;
  /** Achievement tier */
  tier: AchievementTier;
  /** Target value */
  target: number;
  /** Reward coins */
  rewardCoins: number;
  /** Reward unlock (vehicle/stage ID) */
  rewardUnlock?: string;
  /** Is secret achievement */
  isSecret: boolean;
  /** Icon emoji */
  icon: string;
};

export type AchievementProgress = {
  /** Achievement ID */
  achievementId: string;
  /** Current progress */
  current: number;
  /** Is unlocked */
  unlocked: boolean;
  /** Unlock timestamp */
  unlockedAt?: number;
  /** Reward claimed */
  rewardClaimed: boolean;
};

/**
 * All achievements
 */
export const ACHIEVEMENTS: Achievement[] = [
  // DISTANCE - Bronze
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Travel 100 meters in a single run',
    category: 'distance',
    tier: 'bronze',
    target: 100,
    rewardCoins: 100,
    isSecret: false,
    icon: '🚶',
  },
  {
    id: 'getting_there',
    name: 'Getting There',
    description: 'Travel 500 meters in a single run',
    category: 'distance',
    tier: 'bronze',
    target: 500,
    rewardCoins: 250,
    isSecret: false,
    icon: '🏃',
  },
  // DISTANCE - Silver
  {
    id: 'road_warrior',
    name: 'Road Warrior',
    description: 'Travel 1,000 meters in a single run',
    category: 'distance',
    tier: 'silver',
    target: 1000,
    rewardCoins: 500,
    isSecret: false,
    icon: '🛣️',
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Travel 2,500 meters in a single run',
    category: 'distance',
    tier: 'silver',
    target: 2500,
    rewardCoins: 1000,
    isSecret: false,
    icon: '🏅',
  },
  // DISTANCE - Gold
  {
    id: 'summit_seeker',
    name: 'Summit Seeker',
    description: 'Travel 5,000 meters in a single run',
    category: 'distance',
    tier: 'gold',
    target: 5000,
    rewardCoins: 2500,
    isSecret: false,
    icon: '⛰️',
  },
  // DISTANCE - Platinum
  {
    id: 'legend',
    name: 'Legend',
    description: 'Travel 10,000 meters in a single run',
    category: 'distance',
    tier: 'platinum',
    target: 10000,
    rewardCoins: 10000,
    rewardUnlock: 'moon_rover',
    isSecret: false,
    icon: '🏆',
  },

  // TRICKS - Bronze
  {
    id: 'first_flip',
    name: 'First Flip',
    description: 'Land your first flip',
    category: 'tricks',
    tier: 'bronze',
    target: 1,
    rewardCoins: 100,
    isSecret: false,
    icon: '🔄',
  },
  {
    id: 'stunt_driver',
    name: 'Stunt Driver',
    description: 'Land 10 flips total',
    category: 'tricks',
    tier: 'bronze',
    target: 10,
    rewardCoins: 250,
    isSecret: false,
    icon: '🎪',
  },
  // TRICKS - Silver
  {
    id: 'acrobat',
    name: 'Acrobat',
    description: 'Land 50 flips total',
    category: 'tricks',
    tier: 'silver',
    target: 50,
    rewardCoins: 750,
    isSecret: false,
    icon: '🤸',
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Achieve a 10x combo',
    category: 'tricks',
    tier: 'silver',
    target: 10,
    rewardCoins: 1000,
    isSecret: false,
    icon: '🔥',
  },
  // TRICKS - Gold
  {
    id: 'air_time_king',
    name: 'Air Time King',
    description: 'Accumulate 60 seconds of air time',
    category: 'tricks',
    tier: 'gold',
    target: 60,
    rewardCoins: 2000,
    isSecret: false,
    icon: '✈️',
  },
  {
    id: 'legendary_combo',
    name: 'Legendary Combo',
    description: 'Achieve a 20x combo',
    category: 'tricks',
    tier: 'gold',
    target: 20,
    rewardCoins: 5000,
    isSecret: false,
    icon: '💥',
  },

  // COLLECTION - Bronze
  {
    id: 'coin_collector',
    name: 'Coin Collector',
    description: 'Collect 1,000 coins total',
    category: 'collection',
    tier: 'bronze',
    target: 1000,
    rewardCoins: 200,
    isSecret: false,
    icon: '🪙',
  },
  // COLLECTION - Silver
  {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Collect 10,000 coins total',
    category: 'collection',
    tier: 'silver',
    target: 10000,
    rewardCoins: 1000,
    isSecret: false,
    icon: '💰',
  },
  // COLLECTION - Gold
  {
    id: 'millionaire',
    name: 'Millionaire',
    description: 'Collect 100,000 coins total',
    category: 'collection',
    tier: 'gold',
    target: 100000,
    rewardCoins: 5000,
    rewardUnlock: 'super_car',
    isSecret: false,
    icon: '💎',
  },

  // MASTERY - Bronze
  {
    id: 'first_run',
    name: 'First Run',
    description: 'Complete your first run',
    category: 'mastery',
    tier: 'bronze',
    target: 1,
    rewardCoins: 50,
    isSecret: false,
    icon: '🎮',
  },
  // MASTERY - Silver
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Complete 50 runs',
    category: 'mastery',
    tier: 'silver',
    target: 50,
    rewardCoins: 500,
    isSecret: false,
    icon: '📈',
  },
  {
    id: 'vehicle_collector',
    name: 'Vehicle Collector',
    description: 'Unlock 3 vehicles',
    category: 'mastery',
    tier: 'silver',
    target: 3,
    rewardCoins: 1000,
    isSecret: false,
    icon: '🚗',
  },
  // MASTERY - Gold
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Complete 200 runs',
    category: 'mastery',
    tier: 'gold',
    target: 200,
    rewardCoins: 2000,
    isSecret: false,
    icon: '⭐',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Play on all 6 stages',
    category: 'mastery',
    tier: 'gold',
    target: 6,
    rewardCoins: 3000,
    isSecret: false,
    icon: '🗺️',
  },

  // SECRET
  {
    id: 'perfect_run',
    name: '???',
    description: 'Travel 1000m without touching the brake',
    category: 'secret',
    tier: 'gold',
    target: 1000,
    rewardCoins: 5000,
    isSecret: true,
    icon: '🤫',
  },
  {
    id: 'moonwalk',
    name: '???',
    description: 'Do a backflip on the Moon stage',
    category: 'secret',
    tier: 'silver',
    target: 1,
    rewardCoins: 2000,
    isSecret: true,
    icon: '🌙',
  },
  {
    id: 'speed_demon',
    name: '???',
    description: 'Reach maximum boost speed for 10 seconds',
    category: 'secret',
    tier: 'gold',
    target: 10,
    rewardCoins: 3000,
    isSecret: true,
    icon: '👹',
  },
];

export type AchievementSystem = {
  /** Get all achievements */
  getAllAchievements: () => Achievement[];
  /** Get achievement by ID */
  getAchievement: (id: string) => Achievement | undefined;
  /** Get progress for achievement */
  getProgress: (id: string) => AchievementProgress;
  /** Update progress */
  updateProgress: (id: string, value: number) => AchievementProgress | null;
  /** Increment progress */
  incrementProgress: (id: string, amount?: number) => AchievementProgress | null;
  /** Check if unlocked */
  isUnlocked: (id: string) => boolean;
  /** Claim reward */
  claimReward: (id: string) => { coins: number; unlock?: string } | null;
  /** Get unlocked achievements */
  getUnlocked: () => Achievement[];
  /** Get achievements by category */
  getByCategory: (category: AchievementCategory) => Achievement[];
  /** Load progress from storage */
  loadProgress: (data: Record<string, AchievementProgress>) => void;
  /** Export progress for storage */
  exportProgress: () => Record<string, AchievementProgress>;
  /** Get total coins from unclaimed rewards */
  getUnclaimedCoins: () => number;
};

/**
 * Create achievement system
 */
export function createAchievementSystem(): AchievementSystem {
  const progress: Map<string, AchievementProgress> = new Map();

  // Initialize all progress
  ACHIEVEMENTS.forEach((achievement) => {
    progress.set(achievement.id, {
      achievementId: achievement.id,
      current: 0,
      unlocked: false,
      rewardClaimed: false,
    });
  });

  const getProgress = (id: string): AchievementProgress => {
    return (
      progress.get(id) ?? {
        achievementId: id,
        current: 0,
        unlocked: false,
        rewardClaimed: false,
      }
    );
  };

  const updateProgress = (
    id: string,
    value: number
  ): AchievementProgress | null => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement) return null;

    const current = getProgress(id);
    const newProgress: AchievementProgress = {
      ...current,
      current: value,
    };

    // Check for unlock
    if (!current.unlocked && value >= achievement.target) {
      newProgress.unlocked = true;
      newProgress.unlockedAt = Date.now();
    }

    progress.set(id, newProgress);
    return newProgress;
  };

  const incrementProgress = (
    id: string,
    amount: number = 1
  ): AchievementProgress | null => {
    const current = getProgress(id);
    return updateProgress(id, current.current + amount);
  };

  const isUnlocked = (id: string): boolean => {
    return getProgress(id).unlocked;
  };

  const claimReward = (
    id: string
  ): { coins: number; unlock?: string } | null => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    const current = getProgress(id);

    if (!achievement || !current.unlocked || current.rewardClaimed) {
      return null;
    }

    progress.set(id, { ...current, rewardClaimed: true });

    return {
      coins: achievement.rewardCoins,
      unlock: achievement.rewardUnlock,
    };
  };

  const getUnlocked = (): Achievement[] => {
    return ACHIEVEMENTS.filter((a) => isUnlocked(a.id));
  };

  const getByCategory = (category: AchievementCategory): Achievement[] => {
    return ACHIEVEMENTS.filter((a) => a.category === category);
  };

  const loadProgress = (data: Record<string, AchievementProgress>): void => {
    Object.entries(data).forEach(([id, p]) => {
      progress.set(id, p);
    });
  };

  const exportProgress = (): Record<string, AchievementProgress> => {
    const result: Record<string, AchievementProgress> = {};
    progress.forEach((p, id) => {
      result[id] = p;
    });
    return result;
  };

  const getUnclaimedCoins = (): number => {
    return ACHIEVEMENTS.filter((a) => {
      const p = getProgress(a.id);
      return p.unlocked && !p.rewardClaimed;
    }).reduce((sum, a) => sum + a.rewardCoins, 0);
  };

  return {
    getAllAchievements: () => [...ACHIEVEMENTS],
    getAchievement: (id) => ACHIEVEMENTS.find((a) => a.id === id),
    getProgress,
    updateProgress,
    incrementProgress,
    isUnlocked,
    claimReward,
    getUnlocked,
    getByCategory,
    loadProgress,
    exportProgress,
    getUnclaimedCoins,
  };
}

/**
 * Get tier color
 */
export function getAchievementTierColor(tier: AchievementTier): string {
  switch (tier) {
    case 'bronze':
      return '#CD7F32';
    case 'silver':
      return '#C0C0C0';
    case 'gold':
      return '#FFD700';
    case 'platinum':
      return '#E5E4E2';
    default:
      return '#FFFFFF';
  }
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: AchievementCategory): string {
  switch (category) {
    case 'distance':
      return '🛣️';
    case 'tricks':
      return '🤸';
    case 'collection':
      return '💰';
    case 'mastery':
      return '⭐';
    case 'secret':
      return '🔒';
    default:
      return '🏆';
  }
}
