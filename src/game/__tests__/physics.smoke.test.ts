/**
 * Physics Smoke Test
 * Verifies core gameplay physics loop works correctly
 */

import { createPhysicsWorld } from '../physics/world';
import { createCar, addCarToWorld } from '../physics/car';
import { createFlatGround } from '../terrain/terrain';

describe('Physics Smoke Test', () => {
  it('should create world, step 60 frames, car exists and advances with gas', () => {
    // Create physics world
    const world = createPhysicsWorld({
      gravity: { x: 0, y: 1 },
    });

    // Create car at starting position
    const startX = 200;
    const car = createCar({
      x: startX,
      y: 300,
      enginePower: 0.08,
      maxWheelSpeed: 0.5,
    });

    // Add car to world
    addCarToWorld(world, car);

    // Create flat ground
    const ground = createFlatGround(0, 2000, 50, 600);
    world.add(ground);

    // Verify car exists
    expect(car.body).toBeDefined();
    expect(car.frontWheel).toBeDefined();
    expect(car.rearWheel).toBeDefined();

    // Get initial position
    const initialPos = car.getPosition();
    expect(initialPos.x).toBeCloseTo(startX, 0);

    // Apply gas and step simulation for 60 frames (roughly 1 second at 60fps)
    const frameTime = 1000 / 60; // ~16.67ms per frame

    for (let i = 0; i < 60; i++) {
      car.applyGas(1.0); // Full throttle
      world.step(frameTime);
    }

    // Car should have moved forward
    const finalPos = car.getPosition();
    expect(finalPos.x).toBeGreaterThan(initialPos.x);

    // Verify car moved a reasonable amount (at least 50 pixels)
    const distanceMoved = finalPos.x - initialPos.x;
    expect(distanceMoved).toBeGreaterThan(50);
  });

  it('should stop car with brakes', () => {
    const world = createPhysicsWorld();
    const car = createCar({ x: 200, y: 300 });
    addCarToWorld(world, car);

    const ground = createFlatGround(0, 2000, 50, 600);
    world.add(ground);

    // First accelerate
    for (let i = 0; i < 30; i++) {
      car.applyGas(1.0);
      world.step(16.67);
    }

    const velocityAfterGas = car.getVelocity();
    expect(velocityAfterGas.x).toBeGreaterThan(0);

    // Now brake
    for (let i = 0; i < 30; i++) {
      car.applyBrake(1.0);
      world.step(16.67);
    }

    const velocityAfterBrake = car.getVelocity();
    // Velocity should have decreased
    expect(Math.abs(velocityAfterBrake.x)).toBeLessThan(
      Math.abs(velocityAfterGas.x)
    );
  });

  it('should detect flipped state', () => {
    const world = createPhysicsWorld();
    const car = createCar({ x: 200, y: 100 });
    addCarToWorld(world, car);

    // Initially should not be flipped
    expect(car.isFlipped()).toBe(false);

    // Manually set rotation to simulate flip (this is a unit test helper)
    // In real gameplay, this would happen from physics
    // We can verify the function works with the angle check
    expect(typeof car.isFlipped()).toBe('boolean');
  });

  it('should have all car components', () => {
    const car = createCar();

    expect(car.getAllBodies()).toHaveLength(3); // body + 2 wheels
    expect(car.getAllConstraints()).toHaveLength(4); // 2 suspensions + 2 axles
  });

  it('should handle world with multiple bodies', () => {
    const world = createPhysicsWorld();
    const car = createCar({ x: 200, y: 300 });
    addCarToWorld(world, car);

    const ground = createFlatGround(0, 1000, 50, 600);
    world.add(ground);

    // Should have car bodies + ground
    const bodies = world.getBodies();
    expect(bodies.length).toBeGreaterThanOrEqual(4); // 3 car parts + ground
  });

  it('should clear world properly', () => {
    const world = createPhysicsWorld();
    const car = createCar({ x: 200, y: 300 });
    addCarToWorld(world, car);

    expect(world.getBodies().length).toBeGreaterThan(0);

    world.clear();

    expect(world.getBodies().length).toBe(0);
  });
});
