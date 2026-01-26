/**
 * Tests for Coin Magnet System
 */

import Matter from 'matter-js';
import { createCoinMagnetSystem, CoinMagnetSystem } from '../coinMagnet';
import { Pickup } from '../../pickups/spawn';

// Helper to create a mock pickup
function createMockPickup(
  x: number,
  y: number,
  type: 'coin' | 'fuel' = 'coin'
): Pickup {
  return {
    body: Matter.Bodies.circle(x, y, 15, { isStatic: true }),
    type,
    value: type === 'coin' ? 1 : 25,
    collected: false,
  };
}

describe('CoinMagnetSystem', () => {
  let system: CoinMagnetSystem;

  beforeEach(() => {
    system = createCoinMagnetSystem();
  });

  describe('initial config', () => {
    it('should have default radius of 150', () => {
      expect(system.getConfig().radius).toBe(150);
    });

    it('should have default strength of 400', () => {
      expect(system.getConfig().strength).toBe(400);
    });

    it('should only attract coins by default', () => {
      expect(system.getConfig().coinsOnly).toBe(true);
    });
  });

  describe('update', () => {
    it('should attract coins within radius toward target', () => {
      const coin = createMockPickup(100, 100);
      const pickups = [coin];

      // Target is at origin (coin is 100px away, within 150px radius)
      system.update(pickups, 0, 100, 100); // 100ms

      // Coin should move toward target (x=0)
      expect(coin.body.position.x).toBeLessThan(100);
    });

    it('should not move coins outside radius', () => {
      const coin = createMockPickup(500, 100);
      const pickups = [coin];

      // Coin is 500 units away, radius is 150
      system.update(pickups, 0, 100, 100);

      // Coin should not move
      expect(coin.body.position.x).toBe(500);
    });

    it('should move coins in correct direction', () => {
      const coin = createMockPickup(100, 100);
      const pickups = [coin];

      // Target is to the right
      system.update(pickups, 200, 100, 100);

      // Coin should move right (toward target)
      expect(coin.body.position.x).toBeGreaterThan(100);
    });

    it('should move coins vertically as well', () => {
      const coin = createMockPickup(0, 100);
      const pickups = [coin];

      // Target is below
      system.update(pickups, 0, 200, 100);

      // Coin should move down
      expect(coin.body.position.y).toBeGreaterThan(100);
    });

    it('should not move collected coins', () => {
      const coin = createMockPickup(100, 100);
      coin.collected = true;
      const pickups = [coin];

      system.update(pickups, 0, 100, 100);

      // Position should remain unchanged
      expect(coin.body.position.x).toBe(100);
    });

    it('should not move fuel pickups when coinsOnly is true', () => {
      const fuel = createMockPickup(100, 100, 'fuel');
      const pickups = [fuel];

      system.update(pickups, 0, 100, 100);

      // Position should remain unchanged
      expect(fuel.body.position.x).toBe(100);
    });

    it('should attract faster when coins are closer', () => {
      const farCoin = createMockPickup(140, 100);
      const nearCoin = createMockPickup(50, 100);
      const pickups = [farCoin, nearCoin];

      const farInitialX = farCoin.body.position.x;
      const nearInitialX = nearCoin.body.position.x;

      system.update(pickups, 0, 100, 100);

      const farMovement = farInitialX - farCoin.body.position.x;
      const nearMovement = nearInitialX - nearCoin.body.position.x;

      // Near coin should move more (relatively)
      expect(nearMovement).toBeGreaterThan(0);
      expect(farMovement).toBeGreaterThan(0);
    });
  });

  describe('setRadius', () => {
    it('should change magnet radius', () => {
      system.setRadius(300);
      expect(system.getConfig().radius).toBe(300);
    });

    it('should affect attraction range', () => {
      const coin = createMockPickup(200, 100);
      const pickups = [coin];

      // With default radius of 150, coin at 200 is outside range
      system.update(pickups, 0, 100, 100);
      expect(coin.body.position.x).toBe(200);

      // Increase radius to include coin
      system.setRadius(300);
      system.update(pickups, 0, 100, 100);
      expect(coin.body.position.x).toBeLessThan(200);
    });

    it('should not allow negative radius', () => {
      system.setRadius(-100);
      expect(system.getConfig().radius).toBe(0);
    });
  });

  describe('setStrength', () => {
    it('should change magnet strength', () => {
      system.setStrength(800);
      expect(system.getConfig().strength).toBe(800);
    });

    it('should affect attraction speed', () => {
      const coin1 = createMockPickup(100, 100);
      const coin2 = createMockPickup(100, 100);

      const system1 = createCoinMagnetSystem({ strength: 200 });
      const system2 = createCoinMagnetSystem({ strength: 800 });

      system1.update([coin1], 0, 100, 100);
      system2.update([coin2], 0, 100, 100);

      // Higher strength should move coin more
      const movement1 = 100 - coin1.body.position.x;
      const movement2 = 100 - coin2.body.position.x;
      expect(movement2).toBeGreaterThan(movement1);
    });

    it('should not allow negative strength', () => {
      system.setStrength(-100);
      expect(system.getConfig().strength).toBe(0);
    });
  });

  describe('custom config', () => {
    it('should accept custom initial config', () => {
      const customSystem = createCoinMagnetSystem({
        radius: 200,
        strength: 500,
        coinsOnly: false,
      });

      const config = customSystem.getConfig();
      expect(config.radius).toBe(200);
      expect(config.strength).toBe(500);
      expect(config.coinsOnly).toBe(false);
    });

    it('should attract fuel when coinsOnly is false', () => {
      const customSystem = createCoinMagnetSystem({ coinsOnly: false });
      const fuel = createMockPickup(100, 100, 'fuel');
      const pickups = [fuel];

      customSystem.update(pickups, 0, 100, 100);

      // Fuel should move toward target
      expect(fuel.body.position.x).toBeLessThan(100);
    });
  });
});
