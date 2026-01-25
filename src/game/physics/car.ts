/**
 * Car Physics - Vehicle with body, wheels, and suspension
 */

import Matter from 'matter-js';
import { CollisionCategories, PhysicsWorld } from './world';

export type CarConfig = {
  /** Starting X position */
  x: number;
  /** Starting Y position */
  y: number;
  /** Car body width */
  bodyWidth: number;
  /** Car body height */
  bodyHeight: number;
  /** Wheel radius */
  wheelRadius: number;
  /** Wheel friction (0-1) */
  wheelFriction: number;
  /** Suspension stiffness (0-1) */
  suspensionStiffness: number;
  /** Suspension damping (0-1) */
  suspensionDamping: number;
  /** Engine torque multiplier */
  enginePower: number;
  /** Max angular velocity for wheels */
  maxWheelSpeed: number;
  /** Brake force multiplier */
  brakePower: number;
};

export type Car = {
  body: Matter.Body;
  frontWheel: Matter.Body;
  rearWheel: Matter.Body;
  frontSuspension: Matter.Constraint;
  rearSuspension: Matter.Constraint;
  frontAxle: Matter.Constraint;
  rearAxle: Matter.Constraint;
  config: CarConfig;
  /** Apply gas (0-1) */
  applyGas: (amount: number) => void;
  /** Apply brake (0-1) */
  applyBrake: (amount: number) => void;
  /** Get current position */
  getPosition: () => { x: number; y: number };
  /** Get current rotation */
  getRotation: () => number;
  /** Get current velocity */
  getVelocity: () => { x: number; y: number };
  /** Check if car is flipped (upside down) */
  isFlipped: () => boolean;
  /** Get all bodies for this car */
  getAllBodies: () => Matter.Body[];
  /** Get all constraints for this car */
  getAllConstraints: () => Matter.Constraint[];
};

export const DEFAULT_CAR_CONFIG: CarConfig = {
  x: 100,
  y: 300,
  bodyWidth: 80,
  bodyHeight: 30,
  wheelRadius: 20,
  wheelFriction: 0.9,
  suspensionStiffness: 0.4,
  suspensionDamping: 0.3,
  enginePower: 0.05,
  maxWheelSpeed: 0.3,
  brakePower: 0.02,
};

/**
 * Creates a car with physics bodies and constraints
 */
export function createCar(config: Partial<CarConfig> = {}): Car {
  const cfg: CarConfig = { ...DEFAULT_CAR_CONFIG, ...config };

  const wheelBase = cfg.bodyWidth * 0.8;
  const suspensionLength = cfg.bodyHeight * 0.5 + cfg.wheelRadius * 0.5;

  // Car body
  const body = Matter.Bodies.rectangle(
    cfg.x,
    cfg.y,
    cfg.bodyWidth,
    cfg.bodyHeight,
    {
      label: 'carBody',
      collisionFilter: {
        category: CollisionCategories.CAR_BODY,
        mask: CollisionCategories.GROUND | CollisionCategories.PICKUP,
      },
      friction: 0.5,
      frictionAir: 0.02,
      density: 0.002,
    }
  );

  // Front wheel
  const frontWheel = Matter.Bodies.circle(
    cfg.x + wheelBase / 2,
    cfg.y + suspensionLength,
    cfg.wheelRadius,
    {
      label: 'frontWheel',
      collisionFilter: {
        category: CollisionCategories.CAR_WHEEL,
        mask: CollisionCategories.GROUND,
      },
      friction: cfg.wheelFriction,
      frictionAir: 0.01,
      density: 0.001,
      restitution: 0.1,
    }
  );

  // Rear wheel
  const rearWheel = Matter.Bodies.circle(
    cfg.x - wheelBase / 2,
    cfg.y + suspensionLength,
    cfg.wheelRadius,
    {
      label: 'rearWheel',
      collisionFilter: {
        category: CollisionCategories.CAR_WHEEL,
        mask: CollisionCategories.GROUND,
      },
      friction: cfg.wheelFriction,
      frictionAir: 0.01,
      density: 0.001,
      restitution: 0.1,
    }
  );

  // Front suspension constraint
  const frontSuspension = Matter.Constraint.create({
    bodyA: body,
    pointA: { x: wheelBase / 2, y: cfg.bodyHeight / 2 },
    bodyB: frontWheel,
    pointB: { x: 0, y: 0 },
    stiffness: cfg.suspensionStiffness,
    damping: cfg.suspensionDamping,
    length: suspensionLength,
  });

  // Rear suspension constraint
  const rearSuspension = Matter.Constraint.create({
    bodyA: body,
    pointA: { x: -wheelBase / 2, y: cfg.bodyHeight / 2 },
    bodyB: rearWheel,
    pointB: { x: 0, y: 0 },
    stiffness: cfg.suspensionStiffness,
    damping: cfg.suspensionDamping,
    length: suspensionLength,
  });

  // Front axle (limits horizontal movement)
  const frontAxle = Matter.Constraint.create({
    bodyA: body,
    pointA: { x: wheelBase / 2, y: 0 },
    bodyB: frontWheel,
    pointB: { x: 0, y: 0 },
    stiffness: 0.5,
    damping: 0.2,
    length: suspensionLength * 0.8,
  });

  // Rear axle
  const rearAxle = Matter.Constraint.create({
    bodyA: body,
    pointA: { x: -wheelBase / 2, y: 0 },
    bodyB: rearWheel,
    pointB: { x: 0, y: 0 },
    stiffness: 0.5,
    damping: 0.2,
    length: suspensionLength * 0.8,
  });

  const applyGas = (amount: number): void => {
    const clampedAmount = Math.max(0, Math.min(1, amount));
    const torque = cfg.enginePower * clampedAmount;

    // Apply angular velocity to wheels
    const targetAngularVelocity = cfg.maxWheelSpeed * clampedAmount;

    if (rearWheel.angularVelocity < targetAngularVelocity) {
      Matter.Body.setAngularVelocity(
        rearWheel,
        Math.min(
          rearWheel.angularVelocity + torque,
          targetAngularVelocity
        )
      );
    }

    if (frontWheel.angularVelocity < targetAngularVelocity) {
      Matter.Body.setAngularVelocity(
        frontWheel,
        Math.min(
          frontWheel.angularVelocity + torque,
          targetAngularVelocity
        )
      );
    }

    // Also apply a small forward force to the body
    const forwardForce = { x: torque * 5, y: 0 };
    Matter.Body.applyForce(body, body.position, forwardForce);
  };

  const applyBrake = (amount: number): void => {
    const clampedAmount = Math.max(0, Math.min(1, amount));
    const brakeFactor = 1 - cfg.brakePower * clampedAmount;

    // Reduce angular velocity of wheels
    Matter.Body.setAngularVelocity(
      frontWheel,
      frontWheel.angularVelocity * brakeFactor
    );
    Matter.Body.setAngularVelocity(
      rearWheel,
      rearWheel.angularVelocity * brakeFactor
    );

    // Increase friction temporarily (simulate brake pads)
    if (clampedAmount > 0.5) {
      frontWheel.friction = Math.min(1, cfg.wheelFriction + 0.3);
      rearWheel.friction = Math.min(1, cfg.wheelFriction + 0.3);
    } else {
      frontWheel.friction = cfg.wheelFriction;
      rearWheel.friction = cfg.wheelFriction;
    }
  };

  const getPosition = (): { x: number; y: number } => ({
    x: body.position.x,
    y: body.position.y,
  });

  const getRotation = (): number => body.angle;

  const getVelocity = (): { x: number; y: number } => ({
    x: body.velocity.x,
    y: body.velocity.y,
  });

  const isFlipped = (): boolean => {
    // Car is flipped if rotation is more than 120 degrees from upright
    const angle = Math.abs(body.angle % (Math.PI * 2));
    return angle > Math.PI * 0.66 && angle < Math.PI * 1.34;
  };

  const getAllBodies = (): Matter.Body[] => [body, frontWheel, rearWheel];

  const getAllConstraints = (): Matter.Constraint[] => [
    frontSuspension,
    rearSuspension,
    frontAxle,
    rearAxle,
  ];

  return {
    body,
    frontWheel,
    rearWheel,
    frontSuspension,
    rearSuspension,
    frontAxle,
    rearAxle,
    config: cfg,
    applyGas,
    applyBrake,
    getPosition,
    getRotation,
    getVelocity,
    isFlipped,
    getAllBodies,
    getAllConstraints,
  };
}

/**
 * Adds a car to the physics world
 */
export function addCarToWorld(world: PhysicsWorld, car: Car): void {
  world.add(...car.getAllBodies());
  car.getAllConstraints().forEach((c) => world.addConstraint(c));
}
