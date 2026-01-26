/**
 * Daily Challenge System
 *
 * UNIQUE TO SUMMIT WHEELS:
 * Daily rotating challenges with unique modifiers and rewards.
 * Creates variety and reasons to return each day.
 */

export type ChallengeModifier =
  | 'low_gravity'
  | 'high_gravity'
  | 'slippery'
  | 'sticky'
  | 'double_coins'
  | 'half_fuel'
  | 'no_brakes'
  | 'super_boost'
  | 'giant_wheels'
  | 'tiny_vehicle'
  | 'reverse_controls'
  | 'fog';

export type ChallengeGoal =
  | 'distance'
  | 'coins'
  | 'tricks'
  | 'airtime'
  | 'no_crash';

export type DailyChallenge = {
  /** Unique ID based on date */
  id: string;
  /** Challenge name */
  name: string;
  /** Description */
  description: string;
  /** Active modifiers */
  modifiers: ChallengeModifier[];
  /** Goal type */
  goalType: ChallengeGoal;
  /** Target value */
  target: number;
  /** Required stage (null = any) */
  requiredStage: string | null;
  /** Required vehicle (null = any) */
  requiredVehicle: string | null;
  /** Reward coins */
  rewardCoins: number;
  /** Bonus reward (special unlock) */
  bonusReward?: string;
  /** Date string (YYYY-MM-DD) */
  date: string;
};

export type ChallengeProgress = {
  /** Challenge ID */
  challengeId: string;
  /** Current progress value */
  current: number;
  /** Is completed */
  completed: boolean;
  /** Completion timestamp */
  completedAt?: number;
  /** Best attempt */
  bestAttempt: number;
  /** Attempts count */
  attempts: number;
};

/**
 * Modifier effect definitions
 */
export const MODIFIER_EFFECTS: Record<
  ChallengeModifier,
  {
    name: string;
    description: string;
    physics: {
      gravity?: number;
      friction?: number;
      fuelRate?: number;
      boostPower?: number;
      wheelScale?: number;
      vehicleScale?: number;
    };
  }
> = {
  low_gravity: {
    name: 'Moon Mode',
    description: 'Reduced gravity - bounce higher!',
    physics: { gravity: 0.5 },
  },
  high_gravity: {
    name: 'Heavy Day',
    description: 'Increased gravity - stay grounded!',
    physics: { gravity: 1.5 },
  },
  slippery: {
    name: 'Ice Age',
    description: 'Reduced friction - slide around!',
    physics: { friction: 0.4 },
  },
  sticky: {
    name: 'Sticky Tires',
    description: 'Maximum grip - stick to everything!',
    physics: { friction: 1.5 },
  },
  double_coins: {
    name: 'Gold Rush',
    description: 'All coins worth double!',
    physics: {},
  },
  half_fuel: {
    name: 'Fuel Crisis',
    description: 'Start with half fuel!',
    physics: { fuelRate: 2.0 },
  },
  no_brakes: {
    name: 'No Brakes!',
    description: 'Brakes are disabled - good luck!',
    physics: {},
  },
  super_boost: {
    name: 'Nitro Overdrive',
    description: 'Boost is 3x more powerful!',
    physics: { boostPower: 3.0 },
  },
  giant_wheels: {
    name: 'Monster Mode',
    description: 'Wheels are twice as big!',
    physics: { wheelScale: 2.0 },
  },
  tiny_vehicle: {
    name: 'Mini Racer',
    description: 'Your vehicle is tiny!',
    physics: { vehicleScale: 0.5 },
  },
  reverse_controls: {
    name: 'Mirror World',
    description: 'Gas and brake are swapped!',
    physics: {},
  },
  fog: {
    name: 'Foggy Morning',
    description: 'Limited visibility ahead!',
    physics: {},
  },
};

/**
 * Generate daily challenge based on date
 */
export function generateDailyChallenge(date: Date = new Date()): DailyChallenge {
  const dateStr = date.toISOString().split('T')[0];
  const seed = hashDateString(dateStr);

  // Seeded random number generator
  const rng = createSeededRandom(seed);

  // Pick 1-2 modifiers
  const modifierKeys = Object.keys(MODIFIER_EFFECTS) as ChallengeModifier[];
  const modifierCount = rng() > 0.6 ? 2 : 1;
  const modifiers: ChallengeModifier[] = [];

  for (let i = 0; i < modifierCount; i++) {
    const available = modifierKeys.filter((m) => !modifiers.includes(m));
    const index = Math.floor(rng() * available.length);
    modifiers.push(available[index]);
  }

  // Pick goal type
  const goalTypes: ChallengeGoal[] = [
    'distance',
    'coins',
    'tricks',
    'airtime',
    'no_crash',
  ];
  const goalType = goalTypes[Math.floor(rng() * goalTypes.length)];

  // Set target based on goal type
  const targets: Record<ChallengeGoal, number[]> = {
    distance: [500, 1000, 1500, 2000, 2500],
    coins: [100, 250, 500, 750, 1000],
    tricks: [3, 5, 8, 10, 15],
    airtime: [5, 10, 15, 20, 30],
    no_crash: [300, 500, 750, 1000, 1500], // Distance without crashing
  };
  const targetOptions = targets[goalType];
  const target = targetOptions[Math.floor(rng() * targetOptions.length)];

  // Set reward based on difficulty
  const difficultyIndex = targetOptions.indexOf(target);
  const baseReward = 500;
  const rewardCoins = baseReward + difficultyIndex * 250;

  // Generate name
  const modifierNames = modifiers
    .map((m) => MODIFIER_EFFECTS[m].name)
    .join(' + ');

  const goalNames: Record<ChallengeGoal, string> = {
    distance: `Reach ${target}m`,
    coins: `Collect ${target} coins`,
    tricks: `Land ${target} tricks`,
    airtime: `Get ${target}s of air time`,
    no_crash: `Travel ${target}m without crashing`,
  };

  return {
    id: `daily_${dateStr}`,
    name: modifierNames,
    description: goalNames[goalType],
    modifiers,
    goalType,
    target,
    requiredStage: null,
    requiredVehicle: null,
    rewardCoins,
    date: dateStr,
  };
}

/**
 * Check if challenge is completed
 */
export function checkChallengeCompletion(
  challenge: DailyChallenge,
  runStats: {
    distance: number;
    coins: number;
    tricks: number;
    airTime: number;
    crashed: boolean;
  }
): { completed: boolean; progress: number } {
  switch (challenge.goalType) {
    case 'distance':
      return {
        completed: runStats.distance >= challenge.target,
        progress: runStats.distance,
      };
    case 'coins':
      return {
        completed: runStats.coins >= challenge.target,
        progress: runStats.coins,
      };
    case 'tricks':
      return {
        completed: runStats.tricks >= challenge.target,
        progress: runStats.tricks,
      };
    case 'airtime':
      return {
        completed: runStats.airTime >= challenge.target,
        progress: runStats.airTime,
      };
    case 'no_crash':
      return {
        completed: !runStats.crashed && runStats.distance >= challenge.target,
        progress: runStats.crashed ? 0 : runStats.distance,
      };
    default:
      return { completed: false, progress: 0 };
  }
}

/**
 * Apply modifier effects to game physics
 */
export function applyModifierEffects(
  modifiers: ChallengeModifier[],
  basePhysics: {
    gravity: number;
    friction: number;
    fuelRate: number;
    boostPower: number;
  }
): typeof basePhysics {
  const result = { ...basePhysics };

  for (const modifier of modifiers) {
    const effects = MODIFIER_EFFECTS[modifier].physics;
    if (effects.gravity !== undefined) result.gravity *= effects.gravity;
    if (effects.friction !== undefined) result.friction *= effects.friction;
    if (effects.fuelRate !== undefined) result.fuelRate *= effects.fuelRate;
    if (effects.boostPower !== undefined)
      result.boostPower *= effects.boostPower;
  }

  return result;
}

/**
 * Hash date string to seed
 */
function hashDateString(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Create seeded random function
 */
function createSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Get days until next challenge
 */
export function getTimeUntilNextChallenge(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}
