/**
 * Seeded Random Number Generator
 * Uses mulberry32 algorithm for deterministic random sequences
 */

export type SeededRng = {
  /** Returns a random number between 0 and 1 */
  random: () => number;
  /** Returns a random integer between min (inclusive) and max (exclusive) */
  randomInt: (min: number, max: number) => number;
  /** Returns a random number between min and max */
  randomRange: (min: number, max: number) => number;
  /** Current seed value */
  seed: number;
};

/**
 * Creates a seeded random number generator using mulberry32 algorithm
 * @param seed - The seed value for deterministic randomness
 */
export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0; // Ensure unsigned 32-bit

  const random = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const randomInt = (min: number, max: number): number => {
    return Math.floor(random() * (max - min)) + min;
  };

  const randomRange = (min: number, max: number): number => {
    return random() * (max - min) + min;
  };

  return {
    random,
    randomInt,
    randomRange,
    seed,
  };
}

/**
 * Creates a daily seed based on the current date (UTC)
 * Same seed for everyone on the same day
 */
export function getDailySeed(date: Date = new Date()): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  // Combine into a single number
  return year * 10000 + month * 100 + day;
}

/**
 * Creates a seed from a string (for custom challenge codes)
 */
export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
