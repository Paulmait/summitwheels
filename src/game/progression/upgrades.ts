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
import { VehicleId, VEHICLES, getVehicle } from '../config/vehicles';
import { StageId, STAGES, getStage } from '../config/stages';

export type UpgradeLevels = Record<UpgradeType, number>;

export type PlayerProgress = {
  coins: number;
  upgrades: UpgradeLevels;
  bestDistance: number;
  totalRuns: number;
  totalCoins: number;
  /** Unlocked vehicle IDs (jeep is always unlocked) */
  unlockedVehicles: VehicleId[];
  /** Currently selected vehicle */
  selectedVehicle: VehicleId;
  /** Per-vehicle upgrade levels */
  vehicleUpgrades: Record<VehicleId, UpgradeLevels>;
  /** Unlocked stage IDs (countryside is always unlocked) */
  unlockedStages: StageId[];
  /** Currently selected stage */
  selectedStage: StageId;
  /** Total air time accumulated (seconds) */
  totalAirTime: number;
  /** Total tricks landed */
  totalTricks: number;
  /** Highest combo achieved */
  highestCombo: number;
  /** Stages played (for achievements) */
  stagesPlayed: StageId[];
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

const DEFAULT_UPGRADES: UpgradeLevels = {
  engine: 0,
  tires: 0,
  suspension: 0,
  fuelTank: 0,
};

const DEFAULT_PROGRESS: PlayerProgress = {
  coins: 0,
  upgrades: { ...DEFAULT_UPGRADES },
  bestDistance: 0,
  totalRuns: 0,
  totalCoins: 0,
  // Vehicle tracking
  unlockedVehicles: ['jeep'], // Jeep is free starter
  selectedVehicle: 'jeep',
  vehicleUpgrades: {
    jeep: { ...DEFAULT_UPGRADES },
    monster_truck: { ...DEFAULT_UPGRADES },
    dune_buggy: { ...DEFAULT_UPGRADES },
    tank: { ...DEFAULT_UPGRADES },
    super_car: { ...DEFAULT_UPGRADES },
    moon_rover: { ...DEFAULT_UPGRADES },
  },
  // Stage tracking
  unlockedStages: ['countryside'], // Countryside is free starter
  selectedStage: 'countryside',
  // Stats tracking
  totalAirTime: 0,
  totalTricks: 0,
  highestCombo: 0,
  stagesPlayed: [],
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

export type VehiclePurchaseInfo = {
  vehicleId: VehicleId;
  name: string;
  cost: number;
  isUnlocked: boolean;
  isSelected: boolean;
  canAfford: boolean;
};

export type StagePurchaseInfo = {
  stageId: StageId;
  name: string;
  cost: number;
  isUnlocked: boolean;
  isSelected: boolean;
  canAfford: boolean;
};

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
  // === VEHICLE METHODS ===
  /** Purchase a vehicle (returns success) */
  purchaseVehicle: (vehicleId: VehicleId) => Promise<boolean>;
  /** Select a vehicle */
  selectVehicle: (vehicleId: VehicleId) => Promise<boolean>;
  /** Get vehicle purchase info */
  getVehicleInfo: (vehicleId: VehicleId) => VehiclePurchaseInfo;
  /** Get all vehicle infos */
  getAllVehicleInfos: () => VehiclePurchaseInfo[];
  /** Check if vehicle is unlocked */
  isVehicleUnlocked: (vehicleId: VehicleId) => boolean;
  /** Get selected vehicle ID */
  getSelectedVehicle: () => VehicleId;
  // === STAGE METHODS ===
  /** Purchase a stage (returns success) */
  purchaseStage: (stageId: StageId) => Promise<boolean>;
  /** Select a stage */
  selectStage: (stageId: StageId) => Promise<boolean>;
  /** Get stage purchase info */
  getStageInfo: (stageId: StageId) => StagePurchaseInfo;
  /** Get all stage infos */
  getAllStageInfos: () => StagePurchaseInfo[];
  /** Check if stage is unlocked */
  isStageUnlocked: (stageId: StageId) => boolean;
  /** Get selected stage ID */
  getSelectedStage: () => StageId;
  // === STATS METHODS ===
  /** Update stats after a run */
  updateRunStats: (stats: {
    airTime: number;
    tricks: number;
    combo: number;
    stageId: StageId;
  }) => Promise<void>;
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

  // === VEHICLE METHODS ===

  const purchaseVehicle = async (vehicleId: VehicleId): Promise<boolean> => {
    // Check if already unlocked
    if (progress.unlockedVehicles.includes(vehicleId)) {
      return false;
    }

    const vehicle = getVehicle(vehicleId);
    if (!vehicle || progress.coins < vehicle.unlockCost) {
      return false;
    }

    const success = await spendCoins(vehicle.unlockCost);
    if (success) {
      progress.unlockedVehicles.push(vehicleId);
      await save(progress);
    }

    return success;
  };

  const selectVehicle = async (vehicleId: VehicleId): Promise<boolean> => {
    if (!progress.unlockedVehicles.includes(vehicleId)) {
      return false;
    }

    progress.selectedVehicle = vehicleId;
    // Also update upgrades to use this vehicle's upgrades
    progress.upgrades = progress.vehicleUpgrades[vehicleId] || { ...DEFAULT_UPGRADES };
    await save(progress);
    return true;
  };

  const getVehicleInfo = (vehicleId: VehicleId): VehiclePurchaseInfo => {
    const vehicle = getVehicle(vehicleId);
    const isUnlocked = progress.unlockedVehicles.includes(vehicleId);
    const isSelected = progress.selectedVehicle === vehicleId;
    const canAfford = progress.coins >= vehicle.unlockCost;

    return {
      vehicleId,
      name: vehicle.name,
      cost: vehicle.unlockCost,
      isUnlocked,
      isSelected,
      canAfford,
    };
  };

  const getAllVehicleInfos = (): VehiclePurchaseInfo[] => {
    const vehicleIds: VehicleId[] = [
      'jeep',
      'monster_truck',
      'dune_buggy',
      'tank',
      'super_car',
      'moon_rover',
    ];
    return vehicleIds.map(getVehicleInfo);
  };

  const isVehicleUnlocked = (vehicleId: VehicleId): boolean => {
    return progress.unlockedVehicles.includes(vehicleId);
  };

  const getSelectedVehicle = (): VehicleId => {
    return progress.selectedVehicle;
  };

  // === STAGE METHODS ===

  const purchaseStage = async (stageId: StageId): Promise<boolean> => {
    // Check if already unlocked
    if (progress.unlockedStages.includes(stageId)) {
      return false;
    }

    const stage = getStage(stageId);
    if (!stage || progress.coins < stage.unlockCost) {
      return false;
    }

    const success = await spendCoins(stage.unlockCost);
    if (success) {
      progress.unlockedStages.push(stageId);
      await save(progress);
    }

    return success;
  };

  const selectStage = async (stageId: StageId): Promise<boolean> => {
    if (!progress.unlockedStages.includes(stageId)) {
      return false;
    }

    progress.selectedStage = stageId;
    await save(progress);
    return true;
  };

  const getStageInfo = (stageId: StageId): StagePurchaseInfo => {
    const stage = getStage(stageId);
    const isUnlocked = progress.unlockedStages.includes(stageId);
    const isSelected = progress.selectedStage === stageId;
    const canAfford = progress.coins >= stage.unlockCost;

    return {
      stageId,
      name: stage.name,
      cost: stage.unlockCost,
      isUnlocked,
      isSelected,
      canAfford,
    };
  };

  const getAllStageInfos = (): StagePurchaseInfo[] => {
    const stageIds: StageId[] = [
      'countryside',
      'desert',
      'arctic',
      'moon',
      'volcano',
      'forest',
    ];
    return stageIds.map(getStageInfo);
  };

  const isStageUnlocked = (stageId: StageId): boolean => {
    return progress.unlockedStages.includes(stageId);
  };

  const getSelectedStage = (): StageId => {
    return progress.selectedStage;
  };

  // === STATS METHODS ===

  const updateRunStats = async (stats: {
    airTime: number;
    tricks: number;
    combo: number;
    stageId: StageId;
  }): Promise<void> => {
    progress.totalAirTime += stats.airTime;
    progress.totalTricks += stats.tricks;
    progress.highestCombo = Math.max(progress.highestCombo, stats.combo);

    // Track stages played
    if (!progress.stagesPlayed.includes(stats.stageId)) {
      progress.stagesPlayed.push(stats.stageId);
    }

    await save(progress);
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
    // Vehicle methods
    purchaseVehicle,
    selectVehicle,
    getVehicleInfo,
    getAllVehicleInfos,
    isVehicleUnlocked,
    getSelectedVehicle,
    // Stage methods
    purchaseStage,
    selectStage,
    getStageInfo,
    getAllStageInfos,
    isStageUnlocked,
    getSelectedStage,
    // Stats methods
    updateRunStats,
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
