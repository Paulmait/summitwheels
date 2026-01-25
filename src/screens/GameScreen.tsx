/**
 * GameScreen - Main game screen with physics simulation
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
  createFlatGround,
  createTerrainGenerator,
  TerrainGenerator,
  TerrainSegment,
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
  Pickup,
  checkPickupCollisions,
} from '../game/pickups/spawn';
import { createFuelSystem, FuelSystem } from '../game/systems/fuel';
import { Hud } from '../components/Hud';
import { RunEndModal } from '../components/RunEndModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type GameScreenProps = {
  seed?: number;
  onRunEnd?: (stats: RunState['stats']) => void;
  bestDistance?: number;
};

export default function GameScreen({
  seed = Date.now(),
  onRunEnd,
  bestDistance = 0,
}: GameScreenProps) {
  const [renderState, setRenderState] = useState<{
    bodies: RenderableBody[];
    cameraX: number;
    cameraY: number;
  }>({ bodies: [], cameraX: 0, cameraY: 0 });

  const [runState, setRunState] = useState<RunState | null>(null);
  const [fuelPercentage, setFuelPercentage] = useState(100);
  const [isFuelLow, setIsFuelLow] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [localBestDistance, setLocalBestDistance] = useState(bestDistance);

  // Refs for game state (not React state to avoid re-renders)
  const worldRef = useRef<PhysicsWorld | null>(null);
  const carRef = useRef<Car | null>(null);
  const terrainRef = useRef<TerrainGenerator | null>(null);
  const segmentsRef = useRef<TerrainSegment[]>([]);
  const runStateRef = useRef<RunStateManager | null>(null);
  const pickupSpawnerRef = useRef<PickupSpawner | null>(null);
  const fuelSystemRef = useRef<FuelSystem | null>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

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

    setRunState(runManager.getState());
    setFuelPercentage(100);
    setIsFuelLow(false);
  }, [seed]);

  /**
   * Start the game loop
   */
  const startGame = useCallback(() => {
    if (!runStateRef.current || !fuelSystemRef.current) return;

    runStateRef.current.startRun();
    fuelSystemRef.current.reset();
    setIsRunning(true);
    setShowEndScreen(false);
    setRunState(runStateRef.current.getState());
    lastTimeRef.current = performance.now();
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

    if (!world || !car || !terrain || !runManager || !pickupSpawner || !fuelSystem) return;

    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - lastTimeRef.current, 32);
    lastTimeRef.current = currentTime;
    const deltaSeconds = deltaTime / 1000;

    const state = runManager.getState();
    const fuelState = fuelSystem.getState();

    // Apply controls
    const isThrottling = state.isGasPressed && !fuelState.isEmpty;
    const isBraking = state.isBrakePressed;

    if (isThrottling) {
      car.applyGas(1.0);
    }
    if (isBraking) {
      car.applyBrake(1.0);
    }

    // Consume fuel
    fuelSystem.consume(deltaSeconds, isThrottling, isBraking);
    const newFuelState = fuelSystem.getState();
    setFuelPercentage(newFuelState.percentage);
    setIsFuelLow(newFuelState.isLow);

    // Sync fuel with run state
    runManager.consumeFuel(0); // Just to update state
    if (newFuelState.isEmpty && state.status === 'running') {
      runManager.outOfFuel();
    }

    // Step physics
    world.step(16.67);

    // Update position
    const carPos = car.getPosition();
    runManager.updatePosition(carPos.x);
    runManager.updateTime(deltaTime);

    // Check for crash (car flipped)
    if (car.isFlipped()) {
      runManager.crash();
      setIsRunning(false);
      setShowEndScreen(true);
      const finalState = runManager.getState();
      setRunState(finalState);
      if (finalState.stats.distance > localBestDistance) {
        setLocalBestDistance(finalState.stats.distance);
      }
      onRunEnd?.(finalState.stats);
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
        } else if (collected.type === 'fuel') {
          fuelSystem.refill(collected.value);
        }
        // Remove from world
        world.remove(collected.body);
      }
    });

    // Clean up collected pickups
    pickupSpawner.cleanupCollected();

    // Generate more terrain ahead
    const lookAhead = carPos.x + SCREEN_WIDTH * 2;
    const lastSegment = segmentsRef.current[segmentsRef.current.length - 1];
    if (lastSegment && lastSegment.endX < lookAhead) {
      const newSegments = terrain.generateSegments(
        lastSegment.endX,
        lookAhead + 500
      );
      newSegments.forEach((seg) => world.add(seg.body));
      segmentsRef.current = [...segmentsRef.current, ...newSegments];

      // Spawn more pickups
      const newPickups = pickupSpawner.spawnInRange(
        lastSegment.endX,
        lookAhead + 500
      );
      newPickups.forEach((p) => world.add(p.body));
    }

    // Remove terrain far behind
    const removeThreshold = carPos.x - SCREEN_WIDTH;
    const toRemove = segmentsRef.current.filter(
      (seg) => seg.endX < removeThreshold
    );
    toRemove.forEach((seg) => world.remove(seg.body));
    segmentsRef.current = segmentsRef.current.filter(
      (seg) => seg.endX >= removeThreshold
    );

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
  }, [isRunning, onRunEnd, localBestDistance]);

  /**
   * Handle gas button
   */
  const handleGasDown = useCallback(() => {
    runStateRef.current?.setGas(true);
  }, []);

  const handleGasUp = useCallback(() => {
    runStateRef.current?.setGas(false);
  }, []);

  /**
   * Handle brake button
   */
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

  const currentDistance = runState?.stats.distance ?? 0;
  const isNewBest = currentDistance > localBestDistance;

  return (
    <View style={styles.container}>
      {/* Sky background */}
      <View style={styles.sky} />

      {/* Game world */}
      <View style={styles.gameWorld}>
        {renderState.bodies.map(renderBody)}
      </View>

      {/* HUD */}
      {isRunning && (
        <Hud
          distance={runState?.stats.distance ?? 0}
          fuelPercentage={fuelPercentage}
          isFuelLow={isFuelLow}
          coins={runState?.stats.coins ?? 0}
          bestDistance={localBestDistance}
          timeElapsed={runState?.stats.timeElapsed}
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
    paddingHorizontal: 30,
  },
  controlButton: {
    width: 120,
    height: 80,
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
    fontSize: 20,
    fontWeight: 'bold',
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
