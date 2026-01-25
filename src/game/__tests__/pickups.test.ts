/**
 * Tests for Pickup System
 */

import {
  createPickupSpawner,
  checkPickupCollisions,
} from '../pickups/spawn';
import { createPhysicsWorld } from '../physics/world';
import { createCar, addCarToWorld } from '../physics/car';
import Matter from 'matter-js';

describe('PickupSpawner', () => {
  describe('createPickupSpawner', () => {
    it('should spawn pickups deterministically with same seed', () => {
      const spawner1 = createPickupSpawner(12345);
      const spawner2 = createPickupSpawner(12345);

      const pickups1 = spawner1.spawnInRange(0, 2000);
      const pickups2 = spawner2.spawnInRange(0, 2000);

      expect(pickups1.length).toBe(pickups2.length);

      // Positions should match
      for (let i = 0; i < pickups1.length; i++) {
        expect(pickups1[i].body.position.x).toBeCloseTo(
          pickups2[i].body.position.x,
          0
        );
        expect(pickups1[i].type).toBe(pickups2[i].type);
      }
    });

    it('should spawn different pickups with different seeds', () => {
      const spawner1 = createPickupSpawner(11111);
      const spawner2 = createPickupSpawner(22222);

      const pickups1 = spawner1.spawnInRange(0, 2000);
      const pickups2 = spawner2.spawnInRange(0, 2000);

      // At least some positions should differ
      const allSamePositions = pickups1.every((p1, i) =>
        pickups2[i] &&
        Math.abs(p1.body.position.x - pickups2[i].body.position.x) < 1
      );

      expect(allSamePositions).toBe(false);
    });

    it('should create sensor bodies', () => {
      const spawner = createPickupSpawner(42);
      const pickups = spawner.spawnInRange(0, 1000);

      if (pickups.length > 0) {
        expect(pickups[0].body.isSensor).toBe(true);
        expect(pickups[0].body.isStatic).toBe(true);
      }
    });
  });

  describe('collectPickup', () => {
    it('should mark pickup as collected', () => {
      const spawner = createPickupSpawner(123);
      const pickups = spawner.spawnInRange(0, 1000);

      if (pickups.length > 0) {
        const pickup = pickups[0];
        const collected = spawner.collectPickup(pickup.body.id);

        expect(collected).not.toBeNull();
        expect(collected?.collected).toBe(true);
      }
    });

    it('should return null for already collected pickup', () => {
      const spawner = createPickupSpawner(123);
      const pickups = spawner.spawnInRange(0, 1000);

      if (pickups.length > 0) {
        const pickup = pickups[0];
        spawner.collectPickup(pickup.body.id); // First collection

        const secondCollect = spawner.collectPickup(pickup.body.id);
        expect(secondCollect).toBeNull();
      }
    });

    it('should return null for invalid id', () => {
      const spawner = createPickupSpawner(123);
      spawner.spawnInRange(0, 1000);

      const result = spawner.collectPickup(999999);
      expect(result).toBeNull();
    });
  });

  describe('getPickups', () => {
    it('should return all active pickups', () => {
      const spawner = createPickupSpawner(42);
      spawner.spawnInRange(0, 500);
      spawner.spawnInRange(500, 1000);

      const allPickups = spawner.getPickups();
      expect(allPickups.length).toBeGreaterThan(0);
    });
  });

  describe('cleanupCollected', () => {
    it('should remove collected pickups', () => {
      const spawner = createPickupSpawner(42);
      const pickups = spawner.spawnInRange(0, 1000);

      if (pickups.length > 0) {
        spawner.collectPickup(pickups[0].body.id);
        const cleaned = spawner.cleanupCollected();

        expect(cleaned.length).toBe(1);
        expect(spawner.getPickups().length).toBe(pickups.length - 1);
      }
    });
  });

  describe('removeBefore', () => {
    it('should remove pickups before X position', () => {
      const spawner = createPickupSpawner(42);
      spawner.spawnInRange(0, 2000);

      const before = spawner.getPickups().length;
      const removed = spawner.removeBefore(1000);
      const after = spawner.getPickups().length;

      expect(removed.length).toBeGreaterThan(0);
      expect(after).toBeLessThan(before);
    });
  });

  describe('reset', () => {
    it('should clear all pickups', () => {
      const spawner = createPickupSpawner(42);
      spawner.spawnInRange(0, 1000);

      expect(spawner.getPickups().length).toBeGreaterThan(0);

      spawner.reset();

      expect(spawner.getPickups().length).toBe(0);
    });
  });

  describe('pickup values', () => {
    it('should have correct values for coins', () => {
      const spawner = createPickupSpawner(42);
      const pickups = spawner.spawnInRange(0, 5000);

      const coin = pickups.find((p) => p.type === 'coin');
      if (coin) {
        expect(coin.value).toBe(1);
      }
    });

    it('should have correct values for fuel', () => {
      const spawner = createPickupSpawner(42);
      const pickups = spawner.spawnInRange(0, 5000);

      const fuel = pickups.find((p) => p.type === 'fuel');
      if (fuel) {
        expect(fuel.value).toBe(25);
      }
    });
  });
});

describe('checkPickupCollisions', () => {
  it('should detect collision with car body', () => {
    const world = createPhysicsWorld();
    const car = createCar({ x: 100, y: 300 });
    addCarToWorld(world, car);

    // Create a pickup at the same position as the car
    const pickupBody = Matter.Bodies.circle(100, 300, 15, {
      isSensor: true,
      isStatic: true,
    });

    const pickups = [
      {
        body: pickupBody,
        type: 'coin' as const,
        value: 1,
        collected: false,
      },
    ];

    const collided = checkPickupCollisions(car.body, pickups);

    expect(collided.length).toBe(1);
    expect(collided[0].type).toBe('coin');
  });

  it('should not detect collision for collected pickups', () => {
    const car = createCar({ x: 100, y: 300 });

    const pickupBody = Matter.Bodies.circle(100, 300, 15, {
      isSensor: true,
      isStatic: true,
    });

    const pickups = [
      {
        body: pickupBody,
        type: 'coin' as const,
        value: 1,
        collected: true, // Already collected
      },
    ];

    const collided = checkPickupCollisions(car.body, pickups);

    expect(collided.length).toBe(0);
  });
});

describe('Integration: Coin Collection', () => {
  it('should increment coin count on pickup collision', () => {
    const world = createPhysicsWorld();
    const car = createCar({ x: 100, y: 400 });
    addCarToWorld(world, car);

    // Simulate coin at car position
    const pickupBody = Matter.Bodies.circle(110, 400, 15, {
      isSensor: true,
      isStatic: true,
    });
    world.add(pickupBody);

    const pickups = [
      {
        body: pickupBody,
        type: 'coin' as const,
        value: 1,
        collected: false,
      },
    ];

    // Simulate game loop
    let coinCount = 0;

    // Step physics
    world.step(16.67);

    // Check collisions
    const collided = checkPickupCollisions(car.body, pickups);
    collided.forEach((pickup) => {
      if (!pickup.collected) {
        coinCount += pickup.value;
        pickup.collected = true;
      }
    });

    expect(coinCount).toBe(1);
    expect(pickups[0].collected).toBe(true);
  });
});
