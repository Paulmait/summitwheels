/**
 * Pickup Spawner - Generates coins and fuel canisters
 */

import Matter from 'matter-js';
import { CollisionCategories } from '../physics/world';
import { SeededRng, createSeededRng } from '../terrain/seededRng';

export type PickupType = 'coin' | 'fuel';

export type Pickup = {
  body: Matter.Body;
  type: PickupType;
  value: number;
  collected: boolean;
};

export type SpawnConfig = {
  /** Minimum distance between pickups */
  minSpacing: number;
  /** Maximum distance between pickups */
  maxSpacing: number;
  /** Coin spawn probability (0-1) */
  coinProbability: number;
  /** Fuel spawn probability (0-1) */
  fuelProbability: number;
  /** Minimum height above ground */
  minHeight: number;
  /** Maximum height above ground */
  maxHeight: number;
  /** Pickup radius */
  pickupRadius: number;
  /** Screen height for positioning */
  screenHeight: number;
  /** Base ground height */
  baseGroundHeight: number;
};

export type PickupSpawner = {
  /** Spawn pickups in a range */
  spawnInRange: (startX: number, endX: number) => Pickup[];
  /** Get all active pickups */
  getPickups: () => Pickup[];
  /** Mark a pickup as collected */
  collectPickup: (pickupId: number) => Pickup | null;
  /** Remove collected pickups */
  cleanupCollected: () => Pickup[];
  /** Remove pickups before X position */
  removeBefore: (x: number) => Pickup[];
  /** Reset spawner */
  reset: () => void;
};

export const DEFAULT_SPAWN_CONFIG: SpawnConfig = {
  minSpacing: 150,
  maxSpacing: 400,
  coinProbability: 0.7,
  fuelProbability: 0.3,
  minHeight: 50,
  maxHeight: 150,
  pickupRadius: 15,
  screenHeight: 800,
  baseGroundHeight: 150,
};

/**
 * Creates a pickup spawner with seeded randomness
 */
export function createPickupSpawner(
  seed: number,
  config: Partial<SpawnConfig> = {}
): PickupSpawner {
  const cfg: SpawnConfig = { ...DEFAULT_SPAWN_CONFIG, ...config };
  let rng: SeededRng = createSeededRng(seed + 1000); // Offset seed to differ from terrain
  const pickups: Map<number, Pickup> = new Map();
  let lastSpawnX = 0;

  /**
   * Create a pickup body
   */
  const createPickupBody = (
    x: number,
    y: number,
    type: PickupType
  ): Matter.Body => {
    return Matter.Bodies.circle(x, y, cfg.pickupRadius, {
      isSensor: true, // Sensors detect collision but don't affect physics
      isStatic: true,
      label: type,
      collisionFilter: {
        category: CollisionCategories.PICKUP,
        mask: CollisionCategories.CAR_BODY,
      },
    });
  };

  /**
   * Determine pickup type based on probability
   */
  const getPickupType = (): PickupType | null => {
    const rand = rng.random();

    // First check fuel (less common but important)
    if (rand < cfg.fuelProbability) {
      return 'fuel';
    }

    // Then check coin
    if (rand < cfg.fuelProbability + cfg.coinProbability) {
      return 'coin';
    }

    // No pickup
    return null;
  };

  /**
   * Get value for pickup type
   */
  const getPickupValue = (type: PickupType): number => {
    switch (type) {
      case 'coin':
        return 1;
      case 'fuel':
        return 25; // 25% fuel refill
      default:
        return 0;
    }
  };

  const spawnInRange = (startX: number, endX: number): Pickup[] => {
    const newPickups: Pickup[] = [];

    // Start from last spawn position or startX
    let x = Math.max(lastSpawnX, startX);

    while (x < endX) {
      // Add spacing
      const spacing = rng.randomRange(cfg.minSpacing, cfg.maxSpacing);
      x += spacing;

      if (x >= endX) break;

      // Determine if we spawn and what type
      const type = getPickupType();
      if (!type) continue;

      // Calculate Y position (above ground)
      const heightAboveGround = rng.randomRange(cfg.minHeight, cfg.maxHeight);
      const y =
        cfg.screenHeight - cfg.baseGroundHeight - heightAboveGround;

      // Create pickup
      const body = createPickupBody(x, y, type);
      const pickup: Pickup = {
        body,
        type,
        value: getPickupValue(type),
        collected: false,
      };

      pickups.set(body.id, pickup);
      newPickups.push(pickup);
      lastSpawnX = x;
    }

    return newPickups;
  };

  const getPickups = (): Pickup[] => {
    return Array.from(pickups.values());
  };

  const collectPickup = (pickupId: number): Pickup | null => {
    const pickup = pickups.get(pickupId);
    if (pickup && !pickup.collected) {
      pickup.collected = true;
      return pickup;
    }
    return null;
  };

  const cleanupCollected = (): Pickup[] => {
    const collected: Pickup[] = [];
    pickups.forEach((pickup, id) => {
      if (pickup.collected) {
        collected.push(pickup);
        pickups.delete(id);
      }
    });
    return collected;
  };

  const removeBefore = (x: number): Pickup[] => {
    const removed: Pickup[] = [];
    pickups.forEach((pickup, id) => {
      if (pickup.body.position.x < x) {
        removed.push(pickup);
        pickups.delete(id);
      }
    });
    return removed;
  };

  const reset = (): void => {
    rng = createSeededRng(seed + 1000);
    pickups.clear();
    lastSpawnX = 0;
  };

  return {
    spawnInRange,
    getPickups,
    collectPickup,
    cleanupCollected,
    removeBefore,
    reset,
  };
}

/**
 * Check if car body collides with any pickups
 */
export function checkPickupCollisions(
  carBody: Matter.Body,
  pickups: Pickup[]
): Pickup[] {
  const collided: Pickup[] = [];

  for (const pickup of pickups) {
    if (pickup.collected) continue;

    const collision = Matter.Collision.collides(carBody, pickup.body);
    if (collision) {
      collided.push(pickup);
    }
  }

  return collided;
}
