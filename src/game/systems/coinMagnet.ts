/**
 * Coin Magnet System - Attracts coins toward the player
 *
 * Pulls coins within a radius toward the player car
 */

import Matter from 'matter-js';
import { Pickup } from '../pickups/spawn';

export interface CoinMagnetConfig {
  /** Magnet attraction radius in pixels */
  radius: number;
  /** Attraction strength (pixels per second) */
  strength: number;
  /** Only attract coins (not fuel) */
  coinsOnly: boolean;
}

export interface CoinMagnetSystem {
  /**
   * Update coin positions, pulling them toward target
   * @param pickups - All active pickups
   * @param targetX - Target X position (player)
   * @param targetY - Target Y position (player)
   * @param deltaTime - Time since last update in ms
   */
  update: (
    pickups: Pickup[],
    targetX: number,
    targetY: number,
    deltaTime: number
  ) => void;

  /**
   * Set magnet radius
   */
  setRadius: (radius: number) => void;

  /**
   * Set magnet strength
   */
  setStrength: (strength: number) => void;

  /**
   * Get current config
   */
  getConfig: () => CoinMagnetConfig;
}

const DEFAULT_CONFIG: CoinMagnetConfig = {
  radius: 150, // Pixels
  strength: 400, // Pixels per second
  coinsOnly: true,
};

/**
 * Create a coin magnet system
 */
export function createCoinMagnetSystem(
  config: Partial<CoinMagnetConfig> = {}
): CoinMagnetSystem {
  const cfg: CoinMagnetConfig = { ...DEFAULT_CONFIG, ...config };

  const update = (
    pickups: Pickup[],
    targetX: number,
    targetY: number,
    deltaTime: number
  ): void => {
    const deltaSeconds = deltaTime / 1000;

    for (const pickup of pickups) {
      // Skip collected pickups
      if (pickup.collected) continue;

      // Skip non-coins if coinsOnly is true
      if (cfg.coinsOnly && pickup.type !== 'coin') continue;

      const pickupX = pickup.body.position.x;
      const pickupY = pickup.body.position.y;

      // Calculate distance to target
      const dx = targetX - pickupX;
      const dy = targetY - pickupY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Skip if outside magnet radius
      if (distance > cfg.radius || distance === 0) continue;

      // Calculate attraction strength (stronger when closer)
      const normalizedDistance = distance / cfg.radius;
      const attractionMultiplier = 1 - normalizedDistance * 0.5; // Stronger when closer
      const moveDistance = cfg.strength * deltaSeconds * attractionMultiplier;

      // Calculate movement vector
      const moveX = (dx / distance) * Math.min(moveDistance, distance);
      const moveY = (dy / distance) * Math.min(moveDistance, distance);

      // Update pickup position (Matter.js static body position update)
      Matter.Body.setPosition(pickup.body, {
        x: pickupX + moveX,
        y: pickupY + moveY,
      });
    }
  };

  const setRadius = (radius: number): void => {
    cfg.radius = Math.max(0, radius);
  };

  const setStrength = (strength: number): void => {
    cfg.strength = Math.max(0, strength);
  };

  const getConfig = (): CoinMagnetConfig => {
    return { ...cfg };
  };

  return {
    update,
    setRadius,
    setStrength,
    getConfig,
  };
}
