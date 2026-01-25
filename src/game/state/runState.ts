/**
 * Run State - Manages game run lifecycle
 */

export type RunStatus = 'idle' | 'running' | 'crashed' | 'completed';

export type RunStats = {
  /** Distance traveled in meters */
  distance: number;
  /** Coins collected */
  coins: number;
  /** Time elapsed in seconds */
  timeElapsed: number;
  /** Max distance achieved */
  maxDistance: number;
  /** Reason for run end */
  endReason?: 'crash' | 'outOfFuel' | 'manual';
};

export type RunState = {
  /** Current run status */
  status: RunStatus;
  /** Current run statistics */
  stats: RunStats;
  /** Start position X */
  startX: number;
  /** Current position X */
  currentX: number;
  /** Fuel remaining (0-100) */
  fuel: number;
  /** Max fuel capacity */
  maxFuel: number;
  /** Is gas pedal pressed */
  isGasPressed: boolean;
  /** Is brake pedal pressed */
  isBrakePressed: boolean;
};

export type RunStateManager = {
  /** Get current state */
  getState: () => RunState;
  /** Start a new run */
  startRun: () => void;
  /** Update position (called each frame) */
  updatePosition: (x: number) => void;
  /** Update time (called each frame with delta in ms) */
  updateTime: (deltaMs: number) => void;
  /** Add coins */
  addCoins: (amount: number) => void;
  /** Set gas state */
  setGas: (pressed: boolean) => void;
  /** Set brake state */
  setBrake: (pressed: boolean) => void;
  /** End run due to crash */
  crash: () => void;
  /** End run due to out of fuel */
  outOfFuel: () => void;
  /** Consume fuel (returns remaining) */
  consumeFuel: (amount: number) => number;
  /** Add fuel */
  addFuel: (amount: number) => void;
  /** Reset to idle */
  reset: () => void;
  /** Check if can accelerate (has fuel) */
  canAccelerate: () => boolean;
};

const DEFAULT_MAX_FUEL = 100;

/**
 * Creates a run state manager
 */
export function createRunStateManager(
  initialMaxFuel: number = DEFAULT_MAX_FUEL
): RunStateManager {
  let state: RunState = {
    status: 'idle',
    stats: {
      distance: 0,
      coins: 0,
      timeElapsed: 0,
      maxDistance: 0,
    },
    startX: 0,
    currentX: 0,
    fuel: initialMaxFuel,
    maxFuel: initialMaxFuel,
    isGasPressed: false,
    isBrakePressed: false,
  };

  const getState = (): RunState => ({ ...state });

  const startRun = (): void => {
    state = {
      status: 'running',
      stats: {
        distance: 0,
        coins: 0,
        timeElapsed: 0,
        maxDistance: 0,
      },
      startX: state.currentX,
      currentX: state.currentX,
      fuel: state.maxFuel,
      maxFuel: state.maxFuel,
      isGasPressed: false,
      isBrakePressed: false,
    };
  };

  const updatePosition = (x: number): void => {
    if (state.status !== 'running') return;

    state.currentX = x;
    // Convert pixels to meters (1 meter = 50 pixels)
    const distance = Math.max(0, (x - state.startX) / 50);
    state.stats.distance = distance;
    state.stats.maxDistance = Math.max(state.stats.maxDistance, distance);
  };

  const updateTime = (deltaMs: number): void => {
    if (state.status !== 'running') return;
    state.stats.timeElapsed += deltaMs / 1000;
  };

  const addCoins = (amount: number): void => {
    state.stats.coins += amount;
  };

  const setGas = (pressed: boolean): void => {
    state.isGasPressed = pressed;
  };

  const setBrake = (pressed: boolean): void => {
    state.isBrakePressed = pressed;
  };

  const crash = (): void => {
    if (state.status !== 'running') return;
    state.status = 'crashed';
    state.stats.endReason = 'crash';
    state.isGasPressed = false;
    state.isBrakePressed = false;
  };

  const outOfFuel = (): void => {
    if (state.status !== 'running') return;
    // Don't end run, just can't accelerate anymore
    state.stats.endReason = 'outOfFuel';
  };

  const consumeFuel = (amount: number): number => {
    if (state.status !== 'running') return state.fuel;

    state.fuel = Math.max(0, state.fuel - amount);

    if (state.fuel <= 0) {
      outOfFuel();
    }

    return state.fuel;
  };

  const addFuel = (amount: number): void => {
    state.fuel = Math.min(state.maxFuel, state.fuel + amount);
  };

  const reset = (): void => {
    state = {
      status: 'idle',
      stats: {
        distance: 0,
        coins: 0,
        timeElapsed: 0,
        maxDistance: 0,
      },
      startX: 0,
      currentX: 0,
      fuel: state.maxFuel,
      maxFuel: state.maxFuel,
      isGasPressed: false,
      isBrakePressed: false,
    };
  };

  const canAccelerate = (): boolean => {
    return state.status === 'running' && state.fuel > 0;
  };

  return {
    getState,
    startRun,
    updatePosition,
    updateTime,
    addCoins,
    setGas,
    setBrake,
    crash,
    outOfFuel,
    consumeFuel,
    addFuel,
    reset,
    canAccelerate,
  };
}

/**
 * Pixels per meter conversion
 */
export const PIXELS_PER_METER = 50;

/**
 * Convert pixels to meters
 */
export function pixelsToMeters(pixels: number): number {
  return pixels / PIXELS_PER_METER;
}

/**
 * Convert meters to pixels
 */
export function metersToPixels(meters: number): number {
  return meters * PIXELS_PER_METER;
}
