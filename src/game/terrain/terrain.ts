/**
 * Terrain Generator - Procedural hill generation
 */

import Matter from 'matter-js';
import decomp from 'poly-decomp';
import { CollisionCategories } from '../physics/world';
import { createSeededRng, SeededRng } from './seededRng';

// Set up poly-decomp for Matter.js concave vertex decomposition
Matter.Common.setDecomp(decomp);

export type TerrainSegment = {
  body: Matter.Body;
  vertices: { x: number; y: number }[];
  startX: number;
  endX: number;
};

export type TerrainConfig = {
  /** Width of each segment */
  segmentWidth: number;
  /** Base ground height (from bottom of screen) */
  baseHeight: number;
  /** Minimum hill height variation */
  minHeightVariation: number;
  /** Maximum hill height variation */
  maxHeightVariation: number;
  /** Number of points per segment for smoothness */
  pointsPerSegment: number;
  /** Ground thickness */
  groundThickness: number;
  /** Screen height for positioning */
  screenHeight: number;
  /** Difficulty ramp factor (increases with distance) */
  difficultyRamp: number;
};

export type TerrainGenerator = {
  /** Generate terrain segments from startX to endX */
  generateSegments: (startX: number, endX: number) => TerrainSegment[];
  /** Get the ground Y position at a given X */
  getGroundY: (x: number) => number;
  /** Reset the generator */
  reset: () => void;
  /** Get current seed */
  getSeed: () => number;
  /** Generated height map for quick lookups */
  heightMap: Map<number, number>;
};

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  segmentWidth: 200,
  baseHeight: 200,
  minHeightVariation: -30,
  maxHeightVariation: 50,
  pointsPerSegment: 5,
  groundThickness: 100,
  screenHeight: 800,
  difficultyRamp: 0.0001,
};

/**
 * Creates a terrain generator with a given seed
 */
export function createTerrainGenerator(
  seed: number,
  config: Partial<TerrainConfig> = {}
): TerrainGenerator {
  const cfg: TerrainConfig = { ...DEFAULT_TERRAIN_CONFIG, ...config };
  let rng: SeededRng = createSeededRng(seed);
  const heightMap = new Map<number, number>();

  // Keep track of last generated height for continuity
  let lastHeight = cfg.baseHeight;
  let lastGeneratedX = 0;

  /**
   * Calculate height at a given x position
   */
  const calculateHeightAt = (x: number): number => {
    // Check cache first
    const cached = heightMap.get(Math.floor(x / 10) * 10);
    if (cached !== undefined) {
      return cached;
    }

    // Generate based on position
    const segmentIndex = Math.floor(x / cfg.segmentWidth);
    const localRng = createSeededRng(seed + segmentIndex);

    // Calculate difficulty based on distance
    const difficulty = Math.min(1, x * cfg.difficultyRamp);

    // Generate base height with some variation
    const variation =
      localRng.randomRange(
        cfg.minHeightVariation * (1 + difficulty),
        cfg.maxHeightVariation * (1 + difficulty)
      );

    return cfg.baseHeight + variation;
  };

  /**
   * Generate vertices for a terrain segment
   */
  const generateSegmentVertices = (
    startX: number,
    endX: number,
    prevHeight: number
  ): { x: number; y: number }[] => {
    const vertices: { x: number; y: number }[] = [];
    const width = endX - startX;
    const step = width / cfg.pointsPerSegment;

    // Calculate difficulty based on distance
    const difficulty = Math.min(2, startX * cfg.difficultyRamp);

    // Start from previous height for continuity
    let currentHeight = prevHeight;

    // Top surface points (left to right)
    for (let i = 0; i <= cfg.pointsPerSegment; i++) {
      const x = startX + i * step;
      const heightVariation = rng.randomRange(
        cfg.minHeightVariation * (1 + difficulty * 0.5),
        cfg.maxHeightVariation * (1 + difficulty)
      );

      // Smooth transition
      const targetHeight = cfg.baseHeight + heightVariation;
      currentHeight = currentHeight + (targetHeight - currentHeight) * 0.3;

      // Store in height map for lookups
      heightMap.set(Math.floor(x / 10) * 10, currentHeight);

      vertices.push({
        x: x - startX - width / 2,
        y: cfg.screenHeight - currentHeight - cfg.groundThickness / 2,
      });
    }

    // Bottom points (right to left, deep underground)
    for (let i = cfg.pointsPerSegment; i >= 0; i--) {
      const x = startX + i * step;
      vertices.push({
        x: x - startX - width / 2,
        y: cfg.screenHeight + cfg.groundThickness / 2,
      });
    }

    lastHeight = currentHeight;
    lastGeneratedX = endX;

    return vertices;
  };

  /**
   * Create a terrain body from vertices
   */
  const createTerrainBody = (
    vertices: { x: number; y: number }[],
    centerX: number
  ): Matter.Body => {
    // Use fromVertices for custom shapes
    const body = Matter.Bodies.fromVertices(
      centerX,
      cfg.screenHeight - cfg.groundThickness / 2,
      [vertices],
      {
        isStatic: true,
        label: 'ground',
        friction: 0.8,
        restitution: 0.1,
        collisionFilter: {
          category: CollisionCategories.GROUND,
          mask:
            CollisionCategories.CAR_BODY |
            CollisionCategories.CAR_WHEEL |
            CollisionCategories.PICKUP,
        },
      }
    );

    return body;
  };

  const generateSegments = (
    startX: number,
    endX: number
  ): TerrainSegment[] => {
    const segments: TerrainSegment[] = [];

    // Align to segment boundaries
    const alignedStart =
      Math.floor(startX / cfg.segmentWidth) * cfg.segmentWidth;
    const alignedEnd =
      Math.ceil(endX / cfg.segmentWidth) * cfg.segmentWidth;

    let prevHeight = lastHeight;

    for (let x = alignedStart; x < alignedEnd; x += cfg.segmentWidth) {
      const segmentEnd = x + cfg.segmentWidth;
      const centerX = x + cfg.segmentWidth / 2;

      const vertices = generateSegmentVertices(x, segmentEnd, prevHeight);
      const body = createTerrainBody(vertices, centerX);

      // Update prevHeight for next segment
      const lastTopVertex = vertices[cfg.pointsPerSegment];
      prevHeight =
        cfg.screenHeight -
        lastTopVertex.y -
        cfg.groundThickness / 2;

      segments.push({
        body,
        vertices,
        startX: x,
        endX: segmentEnd,
      });
    }

    return segments;
  };

  const getGroundY = (x: number): number => {
    return calculateHeightAt(x);
  };

  const reset = (): void => {
    rng = createSeededRng(seed);
    heightMap.clear();
    lastHeight = cfg.baseHeight;
    lastGeneratedX = 0;
  };

  return {
    generateSegments,
    getGroundY,
    reset,
    getSeed: () => seed,
    heightMap,
  };
}

/**
 * Creates a simple flat ground segment (for starting area)
 */
export function createFlatGround(
  x: number,
  width: number,
  height: number,
  screenHeight: number
): Matter.Body {
  return Matter.Bodies.rectangle(
    x + width / 2,
    screenHeight - height / 2,
    width,
    height,
    {
      isStatic: true,
      label: 'flatGround',
      friction: 0.8,
      restitution: 0.1,
      collisionFilter: {
        category: CollisionCategories.GROUND,
        mask:
          CollisionCategories.CAR_BODY |
          CollisionCategories.CAR_WHEEL |
          CollisionCategories.PICKUP,
      },
    }
  );
}
