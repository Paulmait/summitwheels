/**
 * Physics World - Matter.js wrapper
 * Manages the physics simulation for the game
 */

import Matter from 'matter-js';

export type PhysicsWorld = {
  engine: Matter.Engine;
  world: Matter.World;
  /** Step the physics simulation by delta time (in ms) */
  step: (delta: number) => void;
  /** Add bodies to the world */
  add: (...bodies: Matter.Body[]) => void;
  /** Remove bodies from the world */
  remove: (...bodies: Matter.Body[]) => void;
  /** Add constraint to the world */
  addConstraint: (constraint: Matter.Constraint) => void;
  /** Clear all bodies from the world */
  clear: () => void;
  /** Get all bodies in the world */
  getBodies: () => Matter.Body[];
};

export type WorldConfig = {
  gravity?: { x: number; y: number };
  /** Time scale for physics (1 = normal, 0.5 = slow-mo) */
  timeScale?: number;
};

const DEFAULT_CONFIG: WorldConfig = {
  gravity: { x: 0, y: 1 },
  timeScale: 1,
};

/**
 * Creates a new physics world
 */
export function createPhysicsWorld(config: WorldConfig = {}): PhysicsWorld {
  const { gravity, timeScale } = { ...DEFAULT_CONFIG, ...config };

  const engine = Matter.Engine.create({
    gravity: gravity,
  });

  engine.timing.timeScale = timeScale ?? 1;

  const world = engine.world;

  const step = (delta: number): void => {
    Matter.Engine.update(engine, delta);
  };

  const add = (...bodies: Matter.Body[]): void => {
    Matter.Composite.add(world, bodies);
  };

  const remove = (...bodies: Matter.Body[]): void => {
    Matter.Composite.remove(world, bodies);
  };

  const addConstraint = (constraint: Matter.Constraint): void => {
    Matter.Composite.add(world, constraint);
  };

  const clear = (): void => {
    Matter.Composite.clear(world, false);
  };

  const getBodies = (): Matter.Body[] => {
    return Matter.Composite.allBodies(world);
  };

  return {
    engine,
    world,
    step,
    add,
    remove,
    addConstraint,
    clear,
    getBodies,
  };
}

/**
 * Check collision between two bodies
 */
export function checkCollision(
  bodyA: Matter.Body,
  bodyB: Matter.Body
): boolean {
  return Matter.Collision.collides(bodyA, bodyB) !== null;
}

/**
 * Body categories for collision filtering
 */
export const CollisionCategories = {
  GROUND: 0x0001,
  CAR_BODY: 0x0002,
  CAR_WHEEL: 0x0004,
  PICKUP: 0x0008,
  SENSOR: 0x0010,
} as const;
