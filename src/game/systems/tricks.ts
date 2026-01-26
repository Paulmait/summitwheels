/**
 * Trick Detection System - Detect and score mid-air stunts
 *
 * Detects:
 * - Flips (360° rotation)
 * - Air time bonuses
 * - Landing bonuses
 */

export type TrickType =
  | 'flip'
  | 'backflip'
  | 'frontflip'
  | 'doubleFlip'
  | 'airTime'
  | 'perfectLanding';

export type Trick = {
  type: TrickType;
  value: number;
  label: string;
  timestamp: number;
};

export type TrickState = {
  /** Is currently in the air */
  isAirborne: boolean;
  /** Time when became airborne */
  airborneStartTime: number;
  /** Current air time in seconds */
  currentAirTime: number;
  /** Angle when became airborne */
  startAngle: number;
  /** Total rotation since becoming airborne */
  totalRotation: number;
  /** Previous angle for rotation tracking */
  previousAngle: number;
  /** Flips completed this jump */
  flipsCompleted: number;
  /** Pending tricks to be scored on landing */
  pendingTricks: Trick[];
  /** Recent tricks (for display) */
  recentTricks: Trick[];
  /** Total trick points this run */
  totalTrickPoints: number;
};

export type TrickConfig = {
  /** Minimum air time for air time bonus (seconds) */
  minAirTimeForBonus: number;
  /** Points per second of air time */
  airTimePointsPerSecond: number;
  /** Points for single flip */
  flipPoints: number;
  /** Points for double flip */
  doubleFlipPoints: number;
  /** Multiplier for backflip (harder) */
  backflipMultiplier: number;
  /** Points for perfect landing (little bounce) */
  perfectLandingPoints: number;
  /** How long tricks stay in recent list (ms) */
  trickDisplayDuration: number;
};

export const DEFAULT_TRICK_CONFIG: TrickConfig = {
  minAirTimeForBonus: 1.0,
  airTimePointsPerSecond: 50,
  flipPoints: 500,
  doubleFlipPoints: 1500,
  backflipMultiplier: 1.5,
  perfectLandingPoints: 200,
  trickDisplayDuration: 2000,
};

export type TrickSystem = {
  /** Get current state */
  getState: () => TrickState;
  /** Update with car physics state */
  update: (
    isGrounded: boolean,
    carAngle: number,
    carVelocityY: number,
    currentTime: number
  ) => Trick[];
  /** Clear recent tricks older than display duration */
  clearOldTricks: (currentTime: number) => void;
  /** Reset the system */
  reset: () => void;
  /** Get config */
  getConfig: () => TrickConfig;
};

/**
 * Creates a trick detection system
 */
export function createTrickSystem(
  config: Partial<TrickConfig> = {}
): TrickSystem {
  const cfg: TrickConfig = { ...DEFAULT_TRICK_CONFIG, ...config };

  let state: TrickState = {
    isAirborne: false,
    airborneStartTime: 0,
    currentAirTime: 0,
    startAngle: 0,
    totalRotation: 0,
    previousAngle: 0,
    flipsCompleted: 0,
    pendingTricks: [],
    recentTricks: [],
    totalTrickPoints: 0,
  };

  const getState = (): TrickState => ({ ...state });

  /**
   * Normalize angle to -PI to PI range
   */
  const normalizeAngle = (angle: number): number => {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  };

  /**
   * Calculate angle difference accounting for wrap-around
   */
  const angleDiff = (newAngle: number, oldAngle: number): number => {
    let diff = newAngle - oldAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  };

  const update = (
    isGrounded: boolean,
    carAngle: number,
    carVelocityY: number,
    currentTime: number
  ): Trick[] => {
    const newTricks: Trick[] = [];

    // Transition from grounded to airborne
    if (!state.isAirborne && !isGrounded) {
      state.isAirborne = true;
      state.airborneStartTime = currentTime;
      state.startAngle = carAngle;
      state.previousAngle = carAngle;
      state.totalRotation = 0;
      state.flipsCompleted = 0;
      state.pendingTricks = [];
    }

    // While airborne
    if (state.isAirborne && !isGrounded) {
      state.currentAirTime = (currentTime - state.airborneStartTime) / 1000;

      // Track rotation using raw angle difference (not normalized)
      // This allows tracking multiple full rotations
      const rotationDelta = carAngle - state.previousAngle;

      // Handle angle wrap-around for small deltas
      let adjustedDelta = rotationDelta;
      if (adjustedDelta > Math.PI) adjustedDelta -= Math.PI * 2;
      if (adjustedDelta < -Math.PI) adjustedDelta += Math.PI * 2;

      state.totalRotation += adjustedDelta;
      state.previousAngle = carAngle;

      // Check for completed flips (360° rotation)
      const absRotation = Math.abs(state.totalRotation);
      const newFlips = Math.floor(absRotation / (Math.PI * 2));

      if (newFlips > state.flipsCompleted) {
        const flipsJustCompleted = newFlips - state.flipsCompleted;
        state.flipsCompleted = newFlips;

        // Determine flip direction
        const isBackflip = state.totalRotation < 0;

        for (let i = 0; i < flipsJustCompleted; i++) {
          if (state.flipsCompleted >= 2) {
            // Double flip bonus
            const trick: Trick = {
              type: 'doubleFlip',
              value: cfg.doubleFlipPoints,
              label: 'DOUBLE FLIP!',
              timestamp: currentTime,
            };
            state.pendingTricks.push(trick);
          } else if (isBackflip) {
            const trick: Trick = {
              type: 'backflip',
              value: Math.round(cfg.flipPoints * cfg.backflipMultiplier),
              label: 'BACKFLIP!',
              timestamp: currentTime,
            };
            state.pendingTricks.push(trick);
          } else {
            const trick: Trick = {
              type: 'frontflip',
              value: cfg.flipPoints,
              label: 'FRONTFLIP!',
              timestamp: currentTime,
            };
            state.pendingTricks.push(trick);
          }
        }
      }
    }

    // Transition from airborne to grounded (landing)
    if (state.isAirborne && isGrounded) {
      // Score air time bonus
      if (state.currentAirTime >= cfg.minAirTimeForBonus) {
        const airTimePoints = Math.round(
          state.currentAirTime * cfg.airTimePointsPerSecond
        );
        const trick: Trick = {
          type: 'airTime',
          value: airTimePoints,
          label: `${state.currentAirTime.toFixed(1)}s AIR TIME!`,
          timestamp: currentTime,
        };
        state.pendingTricks.push(trick);
      }

      // Check for perfect landing (low vertical velocity)
      if (Math.abs(carVelocityY) < 3 && state.flipsCompleted > 0) {
        const trick: Trick = {
          type: 'perfectLanding',
          value: cfg.perfectLandingPoints,
          label: 'PERFECT LANDING!',
          timestamp: currentTime,
        };
        state.pendingTricks.push(trick);
      }

      // Score all pending tricks
      for (const trick of state.pendingTricks) {
        state.totalTrickPoints += trick.value;
        state.recentTricks.push(trick);
        newTricks.push(trick);
      }

      // Reset airborne state
      state.isAirborne = false;
      state.currentAirTime = 0;
      state.totalRotation = 0;
      state.flipsCompleted = 0;
      state.pendingTricks = [];
    }

    return newTricks;
  };

  const clearOldTricks = (currentTime: number): void => {
    state.recentTricks = state.recentTricks.filter(
      (trick) => currentTime - trick.timestamp < cfg.trickDisplayDuration
    );
  };

  const reset = (): void => {
    state = {
      isAirborne: false,
      airborneStartTime: 0,
      currentAirTime: 0,
      startAngle: 0,
      totalRotation: 0,
      previousAngle: 0,
      flipsCompleted: 0,
      pendingTricks: [],
      recentTricks: [],
      totalTrickPoints: 0,
    };
  };

  return {
    getState,
    update,
    clearOldTricks,
    reset,
    getConfig: () => ({ ...cfg }),
  };
}

/**
 * Get trick label color based on value
 */
export function getTrickColor(trick: Trick): string {
  if (trick.value >= 1000) return '#FFD700'; // Gold
  if (trick.value >= 500) return '#FF6B35'; // Orange
  if (trick.value >= 200) return '#4CAF50'; // Green
  return '#FFFFFF'; // White
}

/**
 * Format trick for display
 */
export function formatTrickDisplay(trick: Trick): string {
  return `+${trick.value} ${trick.label}`;
}
