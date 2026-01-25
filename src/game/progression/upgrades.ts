/**
 * Upgrades System - Manage vehicle upgrades and progression
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UpgradeType,
  UPGRADE_MODIFIERS,
  calculateVehicleStats,
  VehicleStats,
} from '../config/vehicleConfig';

export type UpgradeLevels = Record<UpgradeType, number>;

export type PlayerProgress = {
  coins: number;
  upgrades: UpgradeLevels;
  bestDistance: number;
  totalRuns: number;
  totalCoins: number;
};

export type UpgradeInfo = {
  type: UpgradeType;
  currentLevel: number;
  maxLevel: number;
  cost: number;
  canAfford: boolean;
  isMaxed: boolean;
};

const STORAGE_KEY = '@summit_wheels_progress';

const DEFAULT_PROGRESS: PlayerProgress = {
  coins: 0,
  upgrades: {
    engine: 0,
    tires: 0,
    suspension: 0,
    fuelTank: 0,
  },
  bestDistance: 0,
  totalRuns: 0,
  totalCoins: 0,
};

/**
 * Calculate upgrade cost based on level
 * Uses exponential curve for progression feel
 */
export function calculateUpgradeCost(
  upgradeType: UpgradeType,
  currentLevel: number
): number {
  const baseCosts: Record<UpgradeType, number> = {
    engine: 50,
    tires: 40,
    suspension: 45,
    fuelTank: 35,
  };

  const base = baseCosts[upgradeType];
  // Exponential growth: base * 1.5^level
  return Math.floor(base * Math.pow(1.5, currentLevel));
}

/**
 * Verify cost curve increases monotonically
 */
export function verifyCostCurveMonotonic(upgradeType: UpgradeType): boolean {
  let prevCost = 0;
  const maxLevel = UPGRADE_MODIFIERS[upgradeType].maxLevel;

  for (let level = 0; level < maxLevel; level++) {
    const cost = calculateUpgradeCost(upgradeType, level);
    if (cost <= prevCost) {
      return false;
    }
    prevCost = cost;
  }

  return true;
}

export type ProgressionManager = {
  /** Load progress from storage */
  load: () => Promise<PlayerProgress>;
  /** Save progress to storage */
  save: (progress: PlayerProgress) => Promise<void>;
  /** Get current progress */
  getProgress: () => PlayerProgress;
  /** Add coins from a run */
  addCoins: (amount: number) => Promise<void>;
  /** Spend coins (returns false if not enough) */
  spendCoins: (amount: number) => Promise<boolean>;
  /** Purchase an upgrade (returns success) */
  purchaseUpgrade: (type: UpgradeType) => Promise<boolean>;
  /** Get upgrade info for display */
  getUpgradeInfo: (type: UpgradeType) => UpgradeInfo;
  /** Get all upgrade infos */
  getAllUpgradeInfos: () => UpgradeInfo[];
  /** Get calculated vehicle stats */
  getVehicleStats: () => VehicleStats;
  /** Update best distance if new record */
  updateBestDistance: (distance: number) => Promise<boolean>;
  /** Increment run count */
  incrementRuns: () => Promise<void>;
  /** Reset progress (for testing) */
  reset: () => Promise<void>;
};

/**
 * Create a progression manager instance
 */
export function createProgressionManager(): ProgressionManager {
  let progress: PlayerProgress = { ...DEFAULT_PROGRESS };

  const load = async (): Promise<PlayerProgress> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        progress = { ...DEFAULT_PROGRESS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load progress:', error);
    }
    return progress;
  };

  const save = async (newProgress: PlayerProgress): Promise<void> => {
    try {
      progress = newProgress;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  };

  const getProgress = (): PlayerProgress => ({ ...progress });

  const addCoins = async (amount: number): Promise<void> => {
    progress.coins += amount;
    progress.totalCoins += amount;
    await save(progress);
  };

  const spendCoins = async (amount: number): Promise<boolean> => {
    if (progress.coins < amount) {
      return false;
    }
    progress.coins -= amount;
    await save(progress);
    return true;
  };

  const purchaseUpgrade = async (type: UpgradeType): Promise<boolean> => {
    const info = getUpgradeInfo(type);

    if (info.isMaxed || !info.canAfford) {
      return false;
    }

    const success = await spendCoins(info.cost);
    if (success) {
      progress.upgrades[type]++;
      await save(progress);
    }

    return success;
  };

  const getUpgradeInfo = (type: UpgradeType): UpgradeInfo => {
    const currentLevel = progress.upgrades[type];
    const maxLevel = UPGRADE_MODIFIERS[type].maxLevel;
    const isMaxed = currentLevel >= maxLevel;
    const cost = isMaxed ? 0 : calculateUpgradeCost(type, currentLevel);
    const canAfford = progress.coins >= cost;

    return {
      type,
      currentLevel,
      maxLevel,
      cost,
      canAfford,
      isMaxed,
    };
  };

  const getAllUpgradeInfos = (): UpgradeInfo[] => {
    const types: UpgradeType[] = ['engine', 'tires', 'suspension', 'fuelTank'];
    return types.map(getUpgradeInfo);
  };

  const getVehicleStats = (): VehicleStats => {
    return calculateVehicleStats(progress.upgrades);
  };

  const updateBestDistance = async (distance: number): Promise<boolean> => {
    if (distance > progress.bestDistance) {
      progress.bestDistance = distance;
      await save(progress);
      return true;
    }
    return false;
  };

  const incrementRuns = async (): Promise<void> => {
    progress.totalRuns++;
    await save(progress);
  };

  const reset = async (): Promise<void> => {
    progress = { ...DEFAULT_PROGRESS };
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return {
    load,
    save,
    getProgress,
    addCoins,
    spendCoins,
    purchaseUpgrade,
    getUpgradeInfo,
    getAllUpgradeInfos,
    getVehicleStats,
    updateBestDistance,
    incrementRuns,
    reset,
  };
}

// Singleton instance
let progressionManagerInstance: ProgressionManager | null = null;

/**
 * Get the singleton ProgressionManager instance
 */
export function getProgressionManager(): ProgressionManager {
  if (!progressionManagerInstance) {
    progressionManagerInstance = createProgressionManager();
  }
  return progressionManagerInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetProgressionManagerSingleton(): void {
  progressionManagerInstance = null;
}
