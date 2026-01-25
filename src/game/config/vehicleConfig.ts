/**
 * Vehicle Configuration - Base stats and upgrade modifiers
 */

export type VehicleStats = {
  /** Engine torque multiplier */
  enginePower: number;
  /** Max wheel angular velocity */
  maxWheelSpeed: number;
  /** Wheel friction (grip) */
  wheelFriction: number;
  /** Suspension stiffness */
  suspensionStiffness: number;
  /** Suspension damping */
  suspensionDamping: number;
  /** Max fuel capacity */
  fuelCapacity: number;
};

export const BASE_VEHICLE_STATS: VehicleStats = {
  enginePower: 0.05,
  maxWheelSpeed: 0.3,
  wheelFriction: 0.8,
  suspensionStiffness: 0.4,
  suspensionDamping: 0.3,
  fuelCapacity: 100,
};

export type UpgradeType = 'engine' | 'tires' | 'suspension' | 'fuelTank';

export type UpgradeModifiers = {
  [key in UpgradeType]: {
    stat: keyof VehicleStats;
    perLevel: number;
    maxLevel: number;
  };
};

export const UPGRADE_MODIFIERS: UpgradeModifiers = {
  engine: {
    stat: 'enginePower',
    perLevel: 0.008, // +0.008 per level
    maxLevel: 10,
  },
  tires: {
    stat: 'wheelFriction',
    perLevel: 0.02, // +0.02 friction per level
    maxLevel: 10,
  },
  suspension: {
    stat: 'suspensionStiffness',
    perLevel: 0.03, // +0.03 per level
    maxLevel: 10,
  },
  fuelTank: {
    stat: 'fuelCapacity',
    perLevel: 15, // +15 fuel capacity per level
    maxLevel: 10,
  },
};

/**
 * Calculate vehicle stats with upgrades applied
 */
export function calculateVehicleStats(
  upgradeLevels: Record<UpgradeType, number>
): VehicleStats {
  const stats = { ...BASE_VEHICLE_STATS };

  for (const [upgradeType, level] of Object.entries(upgradeLevels)) {
    const modifier = UPGRADE_MODIFIERS[upgradeType as UpgradeType];
    if (modifier) {
      const bonus = modifier.perLevel * level;
      stats[modifier.stat] = (stats[modifier.stat] as number) + bonus;
    }
  }

  return stats;
}

/**
 * Get stat description for display
 */
export function getStatDisplayName(stat: keyof VehicleStats): string {
  const names: Record<keyof VehicleStats, string> = {
    enginePower: 'Power',
    maxWheelSpeed: 'Speed',
    wheelFriction: 'Grip',
    suspensionStiffness: 'Stability',
    suspensionDamping: 'Comfort',
    fuelCapacity: 'Fuel Tank',
  };
  return names[stat];
}

/**
 * Get upgrade display name
 */
export function getUpgradeDisplayName(upgrade: UpgradeType): string {
  const names: Record<UpgradeType, string> = {
    engine: 'Engine',
    tires: 'Tires',
    suspension: 'Suspension',
    fuelTank: 'Fuel Tank',
  };
  return names[upgrade];
}
