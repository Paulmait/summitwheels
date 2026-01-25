/**
 * Fuel System - Manages vehicle fuel consumption and refills
 */

export type FuelConfig = {
  /** Maximum fuel capacity */
  maxFuel: number;
  /** Base fuel consumption rate (per second when idle) */
  baseConsumptionRate: number;
  /** Additional consumption when throttling (per second) */
  throttleConsumptionRate: number;
  /** Consumption rate while braking (per second) */
  brakeConsumptionRate: number;
  /** Low fuel warning threshold (percentage) */
  lowFuelThreshold: number;
};

export type FuelState = {
  /** Current fuel amount */
  current: number;
  /** Maximum fuel capacity */
  max: number;
  /** Percentage of fuel remaining (0-100) */
  percentage: number;
  /** Is fuel at low warning level */
  isLow: boolean;
  /** Is fuel empty */
  isEmpty: boolean;
};

export type FuelSystem = {
  /** Get current fuel state */
  getState: () => FuelState;
  /** Consume fuel (deltaSeconds is time since last update) */
  consume: (deltaSeconds: number, isThrottling: boolean, isBraking: boolean) => number;
  /** Add fuel (clamps to max) */
  refill: (amount: number) => number;
  /** Set fuel to full */
  fillUp: () => void;
  /** Set fuel to a specific value */
  setFuel: (amount: number) => void;
  /** Reset to initial state */
  reset: () => void;
  /** Get config */
  getConfig: () => FuelConfig;
  /** Update max fuel (for upgrades) */
  setMaxFuel: (newMax: number) => void;
};

export const DEFAULT_FUEL_CONFIG: FuelConfig = {
  maxFuel: 100,
  baseConsumptionRate: 0.5, // 0.5 units per second when idle
  throttleConsumptionRate: 2.0, // 2 units per second when throttling
  brakeConsumptionRate: 0.3, // 0.3 units per second when braking
  lowFuelThreshold: 20, // Warning at 20%
};

/**
 * Creates a fuel system instance
 */
export function createFuelSystem(
  config: Partial<FuelConfig> = {}
): FuelSystem {
  const cfg: FuelConfig = { ...DEFAULT_FUEL_CONFIG, ...config };
  let currentFuel = cfg.maxFuel;
  let maxFuel = cfg.maxFuel;

  const getState = (): FuelState => {
    const percentage = (currentFuel / maxFuel) * 100;
    return {
      current: currentFuel,
      max: maxFuel,
      percentage,
      isLow: percentage <= cfg.lowFuelThreshold,
      isEmpty: currentFuel <= 0,
    };
  };

  const consume = (
    deltaSeconds: number,
    isThrottling: boolean,
    isBraking: boolean
  ): number => {
    if (currentFuel <= 0) {
      currentFuel = 0;
      return 0;
    }

    let rate = cfg.baseConsumptionRate;

    if (isThrottling) {
      rate += cfg.throttleConsumptionRate;
    }

    if (isBraking) {
      rate += cfg.brakeConsumptionRate;
    }

    const consumed = rate * deltaSeconds;
    currentFuel = Math.max(0, currentFuel - consumed);

    return consumed;
  };

  const refill = (amount: number): number => {
    const previousFuel = currentFuel;
    currentFuel = Math.min(maxFuel, currentFuel + amount);
    return currentFuel - previousFuel; // Return actual amount added
  };

  const fillUp = (): void => {
    currentFuel = maxFuel;
  };

  const setFuel = (amount: number): void => {
    currentFuel = Math.max(0, Math.min(maxFuel, amount));
  };

  const reset = (): void => {
    currentFuel = maxFuel;
  };

  const getConfig = (): FuelConfig => ({ ...cfg });

  const setMaxFuel = (newMax: number): void => {
    const ratio = currentFuel / maxFuel;
    maxFuel = newMax;
    currentFuel = maxFuel * ratio; // Maintain same percentage
  };

  return {
    getState,
    consume,
    refill,
    fillUp,
    setFuel,
    reset,
    getConfig,
    setMaxFuel,
  };
}

/**
 * Calculate fuel efficiency rating (for display)
 */
export function calculateFuelEfficiency(
  distanceTraveled: number,
  fuelUsed: number
): number {
  if (fuelUsed <= 0) return 0;
  return distanceTraveled / fuelUsed;
}
