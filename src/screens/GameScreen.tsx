/**
 * GameScreen - Main game screen with all integrated systems
 *
 * Integrates:
 * - Physics (Matter.js)
 * - Tricks detection
 * - Combo system
 * - Boost system
 * - Particle effects
 * - Achievement tracking
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createPhysicsWorld, PhysicsWorld } from '../game/physics/world';
import { addCarToWorld, Car, createCar } from '../game/physics/car';
import {
  createTerrainGenerator,
  TerrainGenerator,
  TerrainSegment,
  createFlatGround,
} from '../game/terrain/terrain';
import {
  createRunStateManager,
  RunState,
  RunStateManager,
} from '../game/state/runState';
import {
  calculateCamera,
  createRenderState,
  isBodyVisible,
  RenderableBody,
  worldToScreen,
} from '../game/renderer/GameRenderer';
import {
  createPickupSpawner,
  PickupSpawner,
  checkPickupCollisions,
} from '../game/pickups/spawn';
import { createFuelSystem, FuelSystem } from '../game/systems/fuel';
import { createTrickSystem, TrickSystem, Trick } from '../game/systems/tricks';
import { createComboSystem, ComboSystem, ComboState } from '../game/systems/combo';
import { createBoostSystem, BoostSystem, BoostState } from '../game/systems/boost';
import { createParticleSystem, ParticleSystem, Particle } from '../game/systems/particles';
import { GameHud } from '../components/GameHud';
import { TrickPopup } from '../components/TrickPopup';
import { RunEndModal } from '../components/RunEndModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type GameScreenProps = {
  seed?: number;
  onRunEnd?: (stats: RunState['stats'] & { trickPoints: number; maxCombo: number }) => void;
  bestDistance?: number;
};

export default function GameScreen({
  seed = Date.now(),
  onRunEnd,
  bestDistance = 0,
}: GameScreenProps) {
  // Render state
  const [renderState, setRenderState] = useState<{
    bodies: RenderableBody[];
    cameraX: number;
    cameraY: number;
  }>({ bodies: [], cameraX: 0, cameraY: 0 });

  // Game state
  const [runState, setRunState] = useState<RunState | null>(null);
  const [fuelPercentage, setFuelPercentage] = useState(100);
  const [isFuelLow, setIsFuelLow] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [localBestDistance, setLocalBestDistance] = useState(bestDistance);

  // System states for HUD
  const [comboState, setComboState] = useState<ComboState | null>(null);
  const [boostState, setBoostState] = useState<BoostState | null>(null);
  const [trickPoints, setTrickPoints] = useState(0);
  const [recentTricks, setRecentTricks] = useState<Trick[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Core refs
  const worldRef = useRef<PhysicsWorld | null>(null);
  const carRef = useRef<Car | null>(null);
  const terrainRef = useRef<TerrainGenerator | null>(null);
  const segmentsRef = useRef<TerrainSegment[]>([]);
  const runStateRef = useRef<RunStateManager | null>(null);
  const pickupSpawnerRef = useRef<PickupSpawner | null>(null);
  const fuelSystemRef = useRef<FuelSystem | null>(null);

  // Game system refs
  const trickSystemRef = useRef<TrickSystem | null>(null);
  const comboSystemRef = useRef<ComboSystem | null>(null);
  const boostSystemRef = useRef<BoostSystem | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  // Animation refs
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Grounded detection ref
  const wasGroundedRef = useRef<boolean>(true);

  /**
   * Check if car is grounded (any wheel touching ground)
   */
  const isCarGrounded = useCallback((): boolean => {
    const car = carRef.current;
    const world = worldRef.current;
    if (!car || !world) return true;

    // Check if wheels have low vertical velocity and are near ground level
    const frontWheelY = car.frontWheel.position.y;
    const rearWheelY = car.rearWheel.position.y;
    const frontWheelVelY = car.frontWheel.velocity.y;
    const rearWheelVelY = car.rearWheel.velocity.y;

    // Consider grounded if vertical velocity is low and wheels are below body
    const bodyY = car.body.position.y;
    const isWheelBelowBody = frontWheelY > bodyY || rearWheelY > bodyY;
    const hasLowVerticalVelocity = Math.abs(frontWheelVelY) < 2 && Math.abs(rearWheelVelY) < 2;

    return isWheelBelowBody && hasLowVerticalVelocity;
  }, []);

  /**
   * Initialize game
   */
  const initGame = useCallback(() => {
    // Create physics world
    const world = createPhysicsWorld({ gravity: { x: 0, y: 0.8 } });
    worldRef.current = world;

    // Create car
    const car = createCar({
      x: 150,
      y: SCREEN_HEIGHT - 200,
      enginePower: 0.06,
      maxWheelSpeed: 0.4,
    });
    carRef.current = car;
    addCarToWorld(world, car);

    // Create terrain generator
    const terrain = createTerrainGenerator(seed, {
      screenHeight: SCREEN_HEIGHT,
      baseHeight: 150,
      segmentWidth: 250,
    });
    terrainRef.current = terrain;

    // Add flat starting ground
    const startGround = createFlatGround(0, 400, 100, SCREEN_HEIGHT);
    world.add(startGround);

    // Generate initial terrain
    const initialSegments = terrain.generateSegments(400, 2000);
    initialSegments.forEach((seg) => world.add(seg.body));
    segmentsRef.current = initialSegments;

    // Create pickup spawner
    const pickupSpawner = createPickupSpawner(seed, {
      screenHeight: SCREEN_HEIGHT,
      baseGroundHeight: 150,
    });
    pickupSpawnerRef.current = pickupSpawner;

    // Spawn initial pickups
    const initialPickups = pickupSpawner.spawnInRange(300, 2000);
    initialPickups.forEach((p) => world.add(p.body));

    // Create fuel system
    const fuelSystem = createFuelSystem({ maxFuel: 100 });
    fuelSystemRef.current = fuelSystem;

    // Create run state manager
    const runManager = createRunStateManager(100);
    runStateRef.current = runManager;

    // Create game systems
    trickSystemRef.current = createTrickSystem();
    comboSystemRef.current = createComboSystem();
    boostSystemRef.current = createBoostSystem();
    particleSystemRef.current = createParticleSystem();

    // Initialize state
    setRunState(runManager.getState());
    setFuelPercentage(100);
    setIsFuelLow(false);
    setComboState(comboSystemRef.current.getState());
    setBoostState(boostSystemRef.current.getState());
    setTrickPoints(0);
    setRecentTricks([]);
    setParticles([]);
    wasGroundedRef.current = true;
  }, [seed]);

  /**
   * Start the game loop
   */
  const startGame = useCallback(() => {
    if (!runStateRef.current || !fuelSystemRef.current) return;

    runStateRef.current.startRun();
    fuelSystemRef.current.reset();
    trickSystemRef.current?.reset();
    comboSystemRef.current?.reset();
    boostSystemRef.current?.reset();
    particleSystemRef.current?.clear();

    setIsRunning(true);
    setShowEndScreen(false);
    setRunState(runStateRef.current.getState());
    setTrickPoints(0);
    setRecentTricks([]);
    lastTimeRef.current = performance.now();
  }, []);

  /**
   * Handle boost button press
   */
  const handleBoostPress = useCallback(() => {
    const boostSystem = boostSystemRef.current;
    if (boostSystem && boostSystem.canBoost()) {
      boostSystem.startBoost();
      setBoostState(boostSystem.getState());
    }
  }, []);

  /**
   * Game loop
   */
  const gameLoop = useCallback(() => {
    if (!isRunning) return;

    const world = worldRef.current;
    const car = carRef.current;
    const terrain = terrainRef.current;
    const runManager = runStateRef.current;
    const pickupSpawner = pickupSpawnerRef.current;
    const fuelSystem = fuelSystemRef.current;
    const trickSystem = trickSystemRef.current;
    const comboSystem = comboSystemRef.current;
    const boostSystem = boostSystemRef.current;
    const particleSystem = particleSystemRef.current;

    if (!world || !car || !terrain || !runManager || !pickupSpawner || !fuelSystem) return;
    if (!trickSystem || !comboSystem || !boostSystem || !particleSystem) return;

    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - lastTimeRef.current, 32);
    lastTimeRef.current = currentTime;
    const deltaSeconds = deltaTime / 1000;

    const state = runManager.getState();
    const fuelState = fuelSystem.getState();

    // Get boost power multiplier
    const boostMultiplier = boostSystem.getState().powerMultiplier;

    // Apply controls with boost
    const isThrottling = state.isGasPressed && !fuelState.isEmpty;
    const isBraking = state.isBrakePressed;

    if (isThrottling) {
      car.applyGas(1.0 * boostMultiplier);
    }
    if (isBraking) {
      car.applyBrake(1.0);
    }

    // Consume fuel (more when boosting)
    const fuelMultiplier = boostSystem.getState().isBoosting ? 1.5 : 1.0;
    fuelSystem.consume(deltaSeconds * fuelMultiplier, isThrottling, isBraking);
    const newFuelState = fuelSystem.getState();
    setFuelPercentage(newFuelState.percentage);
    setIsFuelLow(newFuelState.isLow);

    // Check fuel empty
    if (newFuelState.isEmpty && state.status === 'running') {
      runManager.outOfFuel();
    }

    // Step physics
    world.step(16.67);

    // Update position
    const carPos = car.getPosition();
    const carAngle = car.getRotation();
    const carVelocity = car.getVelocity();
    runManager.updatePosition(carPos.x);
    runManager.updateTime(deltaTime);

    // Grounded detection for tricks
    const isGrounded = isCarGrounded();
    const wasGrounded = wasGroundedRef.current;

    // Update trick system
    const newTricks = trickSystem.update(
      isGrounded,
      carAngle,
      carVelocity.y,
      currentTime
    );
    trickSystem.clearOldTricks(currentTime);

    // Process new tricks
    if (newTricks.length > 0) {
      let totalTrickPoints = 0;

      for (const trick of newTricks) {
        // Add to combo system
        const comboResult = comboSystem.addTrick(trick.value);
        totalTrickPoints += comboResult.points;

        // Add boost from tricks
        boostSystem.addBoost(trick.value);
      }

      setTrickPoints((prev) => prev + totalTrickPoints);
      setRecentTricks(trickSystem.getState().recentTricks);
    }

    // Landing particles
    if (isGrounded && !wasGrounded) {
      particleSystem.emitLandingDust(carPos.x, carPos.y + 20, carVelocity.y);
    }

    // Wheel dust while driving
    if (isGrounded && isThrottling && Math.abs(carVelocity.x) > 1) {
      const intensity = Math.min(Math.abs(carVelocity.x) / 10, 2);
      particleSystem.emitDust(
        car.rearWheel.position.x,
        car.rearWheel.position.y + 15,
        intensity
      );
    }

    // Update combo timer
    const comboResult = comboSystem.update(deltaTime);
    if (comboResult.comboEnded && comboResult.finalPoints > 0) {
      // Combo ended, could trigger visual feedback
    }

    // Update boost system
    boostSystem.update(deltaTime);

    // Stop boost if player releases gas
    if (boostSystem.getState().isBoosting && !isThrottling) {
      boostSystem.stopBoost();
    }

    // Update particles
    particleSystem.update(deltaTime);

    // Update state refs
    wasGroundedRef.current = isGrounded;
    setComboState(comboSystem.getState());
    setBoostState(boostSystem.getState());
    setParticles(particleSystem.getParticles());

    // Check for crash (car flipped)
    if (car.isFlipped()) {
      // Emit crash explosion
      particleSystem.emitExplosion(carPos.x, carPos.y);

      runManager.crash();
      setIsRunning(false);
      setShowEndScreen(true);

      const finalState = runManager.getState();
      setRunState(finalState);

      if (finalState.stats.distance > localBestDistance) {
        setLocalBestDistance(finalState.stats.distance);
      }

      onRunEnd?.({
        ...finalState.stats,
        trickPoints: trickSystem.getState().totalTrickPoints,
        maxCombo: comboSystem.getState().maxCombo,
      });
      return;
    }

    // Check pickup collisions
    const pickups = pickupSpawner.getPickups();
    const collided = checkPickupCollisions(car.body, pickups);
    collided.forEach((pickup) => {
      const collected = pickupSpawner.collectPickup(pickup.body.id);
      if (collected) {
        if (collected.type === 'coin') {
          runManager.addCoins(collected.value);
          // Coin sparkle effect
          particleSystem.emitSparkle(pickup.body.position.x, pickup.body.position.y);
        } else if (collected.type === 'fuel') {
          fuelSystem.refill(collected.value);
        }
        world.remove(collected.body);
      }
    });

    pickupSpawner.cleanupCollected();

    // Generate more terrain ahead
    const lookAhead = carPos.x + SCREEN_WIDTH * 2;
    const lastSegment = segmentsRef.current[segmentsRef.current.length - 1];
    if (lastSegment && lastSegment.endX < lookAhead) {
      const newSegments = terrain.generateSegments(lastSegment.endX, lookAhead + 500);
      newSegments.forEach((seg) => world.add(seg.body));
      segmentsRef.current = [...segmentsRef.current, ...newSegments];

      const newPickups = pickupSpawner.spawnInRange(lastSegment.endX, lookAhead + 500);
      newPickups.forEach((p) => world.add(p.body));
    }

    // Remove terrain far behind
    const removeThreshold = carPos.x - SCREEN_WIDTH;
    const toRemove = segmentsRef.current.filter((seg) => seg.endX < removeThreshold);
    toRemove.forEach((seg) => world.remove(seg.body));
    segmentsRef.current = segmentsRef.current.filter((seg) => seg.endX >= removeThreshold);

    // Remove pickups far behind
    const removedPickups = pickupSpawner.removeBefore(removeThreshold);
    removedPickups.forEach((p) => world.remove(p.body));

    // Calculate camera
    const camera = calculateCamera(car, {
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      followOffsetX: SCREEN_WIDTH * 0.25,
    });

    // Update render state
    const bodies = world.getBodies();
    const newRenderState = createRenderState(bodies, camera.x, camera.y);
    setRenderState(newRenderState);
    setRunState(runManager.getState());

    // Continue loop
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, onRunEnd, localBestDistance, isCarGrounded]);

  // Input handlers
  const handleGasDown = useCallback(() => {
    runStateRef.current?.setGas(true);
  }, []);

  const handleGasUp = useCallback(() => {
    runStateRef.current?.setGas(false);
  }, []);

  const handleBrakeDown = useCallback(() => {
    runStateRef.current?.setBrake(true);
  }, []);

  const handleBrakeUp = useCallback(() => {
    runStateRef.current?.setBrake(false);
  }, []);

  /**
   * Restart game
   */
  const restartGame = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    worldRef.current?.clear();
    pickupSpawnerRef.current?.reset();
    fuelSystemRef.current?.reset();
    trickSystemRef.current?.reset();
    comboSystemRef.current?.reset();
    boostSystemRef.current?.reset();
    particleSystemRef.current?.clear();

    initGame();
    startGame();
  }, [initGame, startGame]);

  // Initialize on mount
  useEffect(() => {
    initGame();
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [initGame]);

  // Start game loop when running
  useEffect(() => {
    if (isRunning) {
      frameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isRunning, gameLoop]);

  /**
   * Render a single body
   */
  const renderBody = (body: RenderableBody) => {
    const screenPos = worldToScreen(
      body.x,
      body.y,
      renderState.cameraX,
      renderState.cameraY
    );

    if (
      !isBodyVisible(
        body,
        renderState.cameraX,
        renderState.cameraY,
        SCREEN_WIDTH,
        SCREEN_HEIGHT
      )
    ) {
      return null;
    }

    if (body.type === 'circle') {
      return (
        <View
          key={body.id}
          style={[
            styles.body,
            {
              position: 'absolute',
              left: screenPos.x - (body.radius ?? 0),
              top: screenPos.y - (body.radius ?? 0),
              width: (body.radius ?? 0) * 2,
              height: (body.radius ?? 0) * 2,
              borderRadius: body.radius ?? 0,
              backgroundColor: body.color,
              transform: [{ rotate: `${body.angle}rad` }],
            },
          ]}
        />
      );
    }

    if (body.type === 'rectangle') {
      return (
        <View
          key={body.id}
          style={[
            styles.body,
            {
              position: 'absolute',
              left: screenPos.x - (body.width ?? 0) / 2,
              top: screenPos.y - (body.height ?? 0) / 2,
              width: body.width ?? 0,
              height: body.height ?? 0,
              backgroundColor: body.color,
              transform: [{ rotate: `${body.angle}rad` }],
            },
          ]}
        />
      );
    }

    if (body.type === 'polygon' && body.vertices) {
      const minX = Math.min(...body.vertices.map((v) => v.x));
      const maxX = Math.max(...body.vertices.map((v) => v.x));
      const minY = Math.min(...body.vertices.map((v) => v.y));
      const maxY = Math.max(...body.vertices.map((v) => v.y));
      const width = maxX - minX;
      const height = maxY - minY;

      return (
        <View
          key={body.id}
          style={[
            styles.body,
            {
              position: 'absolute',
              left: screenPos.x - width / 2,
              top: screenPos.y - height / 2,
              width,
              height,
              backgroundColor: body.color,
            },
          ]}
        />
      );
    }

    return null;
  };

  /**
   * Render particles
   */
  const renderParticles = () => {
    return particles.map((particle) => {
      const screenPos = worldToScreen(
        particle.x,
        particle.y,
        renderState.cameraX,
        renderState.cameraY
      );

      if (
        screenPos.x < -50 ||
        screenPos.x > SCREEN_WIDTH + 50 ||
        screenPos.y < -50 ||
        screenPos.y > SCREEN_HEIGHT + 50
      ) {
        return null;
      }

      return (
        <View
          key={particle.id}
          style={{
            position: 'absolute',
            left: screenPos.x - particle.size / 2,
            top: screenPos.y - particle.size / 2,
            width: particle.size,
            height: particle.size,
            borderRadius: particle.size / 2,
            backgroundColor: particle.color,
            opacity: particle.alpha,
            transform: [{ rotate: `${particle.rotation}rad` }],
          }}
        />
      );
    });
  };

  const currentDistance = runState?.stats.distance ?? 0;
  const isNewBest = currentDistance > localBestDistance;
  const canBoost = boostState?.amount && boostState.amount >= 20 && !boostState.isBoosting && boostState.cooldown <= 0;

  return (
    <View style={styles.container}>
      {/* Sky background */}
      <View style={styles.sky} />

      {/* Game world */}
      <View style={styles.gameWorld}>
        {renderState.bodies.map(renderBody)}
        {renderParticles()}
      </View>

      {/* Trick Popup */}
      {isRunning && <TrickPopup tricks={recentTricks} />}

      {/* HUD */}
      {isRunning && (
        <GameHud
          distance={runState?.stats.distance ?? 0}
          fuelPercentage={fuelPercentage}
          isFuelLow={isFuelLow}
          coins={runState?.stats.coins ?? 0}
          bestDistance={localBestDistance}
          timeElapsed={runState?.stats.timeElapsed}
          comboState={comboState ?? undefined}
          boostState={boostState ?? undefined}
          trickPoints={trickPoints}
        />
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.brakeButton]}
          onPressIn={handleBrakeDown}
          onPressOut={handleBrakeUp}
          activeOpacity={0.7}
        >
          <Text style={styles.controlText}>BRAKE</Text>
        </TouchableOpacity>

        {/* Boost button (center) */}
        {isRunning && (
          <TouchableOpacity
            style={[
              styles.boostButton,
              canBoost ? styles.boostButtonReady : styles.boostButtonDisabled,
            ]}
            onPress={handleBoostPress}
            activeOpacity={0.7}
            disabled={!canBoost}
          >
            <Text style={styles.boostText}>BOOST</Text>
            {boostState && (
              <Text style={styles.boostPercentage}>
                {Math.floor((boostState.amount / boostState.maxAmount) * 100)}%
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, styles.gasButton]}
          onPressIn={handleGasDown}
          onPressOut={handleGasUp}
          activeOpacity={0.7}
        >
          <Text style={styles.controlText}>GAS</Text>
        </TouchableOpacity>
      </View>

      {/* Start overlay */}
      {!isRunning && !showEndScreen && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Summit Wheels</Text>
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startText}>TAP TO START</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* End screen */}
      {showEndScreen && (
        <RunEndModal
          distance={runState?.stats.distance ?? 0}
          coins={runState?.stats.coins ?? 0}
          bestDistance={localBestDistance}
          isNewBest={isNewBest}
          timeElapsed={runState?.stats.timeElapsed ?? 0}
          endReason={runState?.stats.endReason}
          onRestart={restartGame}
          trickPoints={trickPoints}
          maxCombo={comboState?.maxCombo ?? 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#87CEEB',
  },
  gameWorld: {
    flex: 1,
    overflow: 'hidden',
  },
  body: {
    position: 'absolute',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  controlButton: {
    width: 100,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brakeButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
  },
  gasButton: {
    backgroundColor: 'rgba(0, 200, 0, 0.7)',
  },
  controlText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  boostButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  boostButtonReady: {
    backgroundColor: 'rgba(0, 188, 212, 0.8)',
  },
  boostButtonDisabled: {
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
  },
  boostText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  boostPercentage: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 40,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 30,
  },
  startText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
