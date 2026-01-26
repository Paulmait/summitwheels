/**
 * Vehicle Types - Multiple vehicles with unique stats
 *
 * Each vehicle has different:
 * - Speed/Power
 * - Grip/Traction
 * - Fuel efficiency
 * - Durability/Stability
 */

export type VehicleId =
  | 'jeep'
  | 'monster_truck'
  | 'dune_buggy'
  | 'tank'
  | 'super_car'
  | 'moon_rover';

export type VehicleDefinition = {
  id: VehicleId;
  name: string;
  description: string;
  /** Unlock cost in coins (0 = starter vehicle) */
  unlockCost: number;
  /** Vehicle stats */
  stats: {
    /** Engine power (torque) */
    enginePower: number;
    /** Max wheel speed */
    maxWheelSpeed: number;
    /** Wheel friction (grip) */
    wheelFriction: number;
    /** Suspension stiffness */
    suspensionStiffness: number;
    /** Suspension damping */
    suspensionDamping: number;
    /** Fuel capacity */
    fuelCapacity: number;
    /** Fuel consumption rate (lower = better efficiency) */
    fuelConsumptionRate: number;
    /** Brake power */
    brakePower: number;
  };
  /** Visual properties */
  visual: {
    /** Body width */
    bodyWidth: number;
    /** Body height */
    bodyHeight: number;
    /** Wheel radius */
    wheelRadius: number;
    /** Body color */
    bodyColor: string;
    /** Wheel color */
    wheelColor: string;
    /** Has visible driver */
    hasDriver: boolean;
  };
  /** Star rating for display (1-5) */
  starRating: {
    speed: number;
    grip: number;
    fuel: number;
    stability: number;
  };
};

/**
 * All available vehicles
 */
export const VEHICLES: Record<VehicleId, VehicleDefinition> = {
  jeep: {
    id: 'jeep',
    name: 'Jeep',
    description: 'The classic starter vehicle. Balanced and reliable.',
    unlockCost: 0,
    stats: {
      enginePower: 0.05,
      maxWheelSpeed: 0.3,
      wheelFriction: 0.8,
      suspensionStiffness: 0.4,
      suspensionDamping: 0.3,
      fuelCapacity: 100,
      fuelConsumptionRate: 1.0,
      brakePower: 0.02,
    },
    visual: {
      bodyWidth: 80,
      bodyHeight: 30,
      wheelRadius: 20,
      bodyColor: '#E53935',
      wheelColor: '#333333',
      hasDriver: true,
    },
    starRating: {
      speed: 2,
      grip: 3,
      fuel: 3,
      stability: 3,
    },
  },

  monster_truck: {
    id: 'monster_truck',
    name: 'Monster Truck',
    description: 'Big wheels for big hills. Great grip and stability.',
    unlockCost: 5000,
    stats: {
      enginePower: 0.07,
      maxWheelSpeed: 0.25,
      wheelFriction: 0.95,
      suspensionStiffness: 0.5,
      suspensionDamping: 0.4,
      fuelCapacity: 120,
      fuelConsumptionRate: 1.5,
      brakePower: 0.03,
    },
    visual: {
      bodyWidth: 90,
      bodyHeight: 35,
      wheelRadius: 30,
      bodyColor: '#FF6B35',
      wheelColor: '#222222',
      hasDriver: true,
    },
    starRating: {
      speed: 2,
      grip: 5,
      fuel: 2,
      stability: 5,
    },
  },

  dune_buggy: {
    id: 'dune_buggy',
    name: 'Dune Buggy',
    description: 'Lightweight speedster. Fast but less stable.',
    unlockCost: 10000,
    stats: {
      enginePower: 0.08,
      maxWheelSpeed: 0.45,
      wheelFriction: 0.7,
      suspensionStiffness: 0.35,
      suspensionDamping: 0.25,
      fuelCapacity: 80,
      fuelConsumptionRate: 0.8,
      brakePower: 0.025,
    },
    visual: {
      bodyWidth: 70,
      bodyHeight: 25,
      wheelRadius: 18,
      bodyColor: '#00BCD4',
      wheelColor: '#444444',
      hasDriver: true,
    },
    starRating: {
      speed: 5,
      grip: 2,
      fuel: 4,
      stability: 2,
    },
  },

  tank: {
    id: 'tank',
    name: 'Tank',
    description: 'Heavy and slow but nearly impossible to flip.',
    unlockCost: 25000,
    stats: {
      enginePower: 0.06,
      maxWheelSpeed: 0.2,
      wheelFriction: 0.9,
      suspensionStiffness: 0.6,
      suspensionDamping: 0.5,
      fuelCapacity: 150,
      fuelConsumptionRate: 2.0,
      brakePower: 0.04,
    },
    visual: {
      bodyWidth: 100,
      bodyHeight: 40,
      wheelRadius: 22,
      bodyColor: '#4A5568',
      wheelColor: '#2D3748',
      hasDriver: false,
    },
    starRating: {
      speed: 1,
      grip: 4,
      fuel: 1,
      stability: 5,
    },
  },

  super_car: {
    id: 'super_car',
    name: 'Super Car',
    description: 'Blazing fast with low profile. Master level difficulty.',
    unlockCost: 50000,
    stats: {
      enginePower: 0.1,
      maxWheelSpeed: 0.5,
      wheelFriction: 0.85,
      suspensionStiffness: 0.45,
      suspensionDamping: 0.35,
      fuelCapacity: 90,
      fuelConsumptionRate: 1.2,
      brakePower: 0.035,
    },
    visual: {
      bodyWidth: 90,
      bodyHeight: 22,
      wheelRadius: 16,
      bodyColor: '#9C27B0',
      wheelColor: '#333333',
      hasDriver: true,
    },
    starRating: {
      speed: 5,
      grip: 4,
      fuel: 3,
      stability: 2,
    },
  },

  moon_rover: {
    id: 'moon_rover',
    name: 'Moon Rover',
    description: 'Designed for low gravity environments. Bouncy!',
    unlockCost: 75000,
    stats: {
      enginePower: 0.04,
      maxWheelSpeed: 0.35,
      wheelFriction: 0.6,
      suspensionStiffness: 0.3,
      suspensionDamping: 0.2,
      fuelCapacity: 200,
      fuelConsumptionRate: 0.5,
      brakePower: 0.015,
    },
    visual: {
      bodyWidth: 85,
      bodyHeight: 28,
      wheelRadius: 24,
      bodyColor: '#CFD8DC',
      wheelColor: '#90A4AE',
      hasDriver: true,
    },
    starRating: {
      speed: 3,
      grip: 2,
      fuel: 5,
      stability: 3,
    },
  },
};

/**
 * Get vehicle by ID
 */
export function getVehicle(id: VehicleId): VehicleDefinition {
  return VEHICLES[id];
}

/**
 * Get all vehicles sorted by unlock cost
 */
export function getAllVehicles(): VehicleDefinition[] {
  return Object.values(VEHICLES).sort((a, b) => a.unlockCost - b.unlockCost);
}

/**
 * Get starter vehicle
 */
export function getStarterVehicle(): VehicleDefinition {
  return VEHICLES.jeep;
}

/**
 * Check if vehicle is unlocked
 */
export function isVehicleUnlocked(
  vehicleId: VehicleId,
  unlockedVehicles: VehicleId[]
): boolean {
  const vehicle = getVehicle(vehicleId);
  return vehicle.unlockCost === 0 || unlockedVehicles.includes(vehicleId);
}

/**
 * Get vehicles available for purchase
 */
export function getLockedVehicles(
  unlockedVehicles: VehicleId[]
): VehicleDefinition[] {
  return getAllVehicles().filter(
    (v) => v.unlockCost > 0 && !unlockedVehicles.includes(v.id)
  );
}
