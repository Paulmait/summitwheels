/**
 * Stage/Environment Configuration
 *
 * Different terrains with unique:
 * - Visual themes
 * - Physics modifiers (gravity, friction)
 * - Terrain generation parameters
 * - Pickup spawn rates
 */

export type StageId =
  | 'countryside'
  | 'desert'
  | 'arctic'
  | 'moon'
  | 'volcano'
  | 'forest';

export type StageDefinition = {
  id: StageId;
  name: string;
  description: string;
  /** Unlock cost in coins (0 = starter stage) */
  unlockCost: number;
  /** Physics modifiers */
  physics: {
    /** Gravity multiplier (1.0 = normal) */
    gravityMultiplier: number;
    /** Ground friction multiplier */
    frictionMultiplier: number;
    /** Air resistance multiplier */
    airResistanceMultiplier: number;
  };
  /** Terrain generation */
  terrain: {
    /** Base ground height */
    baseHeight: number;
    /** Minimum height variation */
    minHeightVariation: number;
    /** Maximum height variation */
    maxHeightVariation: number;
    /** Difficulty ramp factor */
    difficultyRamp: number;
    /** Segment width */
    segmentWidth: number;
  };
  /** Visual theme */
  visual: {
    /** Sky color (gradient top) */
    skyColorTop: string;
    /** Sky color (gradient bottom) */
    skyColorBottom: string;
    /** Ground color */
    groundColor: string;
    /** Ground surface color (grass/sand/snow) */
    surfaceColor: string;
    /** Background elements color */
    backgroundColor: string;
    /** Has weather effects */
    hasWeather: boolean;
    /** Weather type if applicable */
    weatherType?: 'snow' | 'sandstorm' | 'rain' | 'ash';
  };
  /** Pickup modifiers */
  pickups: {
    /** Coin spawn rate multiplier */
    coinRateMultiplier: number;
    /** Fuel can spawn rate multiplier */
    fuelRateMultiplier: number;
    /** Fuel refill amount multiplier */
    fuelValueMultiplier: number;
  };
  /** Recommended vehicles */
  recommendedVehicles: string[];
};

/**
 * All available stages
 */
export const STAGES: Record<StageId, StageDefinition> = {
  countryside: {
    id: 'countryside',
    name: 'Countryside',
    description: 'Rolling green hills. Perfect for beginners.',
    unlockCost: 0,
    physics: {
      gravityMultiplier: 1.0,
      frictionMultiplier: 1.0,
      airResistanceMultiplier: 1.0,
    },
    terrain: {
      baseHeight: 150,
      minHeightVariation: -30,
      maxHeightVariation: 50,
      difficultyRamp: 0.0001,
      segmentWidth: 250,
    },
    visual: {
      skyColorTop: '#87CEEB',
      skyColorBottom: '#E0F6FF',
      groundColor: '#8B4513',
      surfaceColor: '#4CAF50',
      backgroundColor: '#81C784',
      hasWeather: false,
    },
    pickups: {
      coinRateMultiplier: 1.0,
      fuelRateMultiplier: 1.0,
      fuelValueMultiplier: 1.0,
    },
    recommendedVehicles: ['jeep', 'monster_truck'],
  },

  desert: {
    id: 'desert',
    name: 'Desert',
    description: 'Sandy dunes and scorching heat. Fuel drains faster!',
    unlockCost: 2500,
    physics: {
      gravityMultiplier: 1.0,
      frictionMultiplier: 0.85,
      airResistanceMultiplier: 0.9,
    },
    terrain: {
      baseHeight: 140,
      minHeightVariation: -40,
      maxHeightVariation: 60,
      difficultyRamp: 0.00012,
      segmentWidth: 280,
    },
    visual: {
      skyColorTop: '#FF8C00',
      skyColorBottom: '#FFD700',
      groundColor: '#DEB887',
      surfaceColor: '#F4A460',
      backgroundColor: '#EDC393',
      hasWeather: true,
      weatherType: 'sandstorm',
    },
    pickups: {
      coinRateMultiplier: 1.2,
      fuelRateMultiplier: 0.8,
      fuelValueMultiplier: 0.9,
    },
    recommendedVehicles: ['dune_buggy', 'jeep'],
  },

  arctic: {
    id: 'arctic',
    name: 'Arctic',
    description: 'Icy terrain with low friction. Slide with care!',
    unlockCost: 7500,
    physics: {
      gravityMultiplier: 1.0,
      frictionMultiplier: 0.6,
      airResistanceMultiplier: 1.1,
    },
    terrain: {
      baseHeight: 160,
      minHeightVariation: -35,
      maxHeightVariation: 55,
      difficultyRamp: 0.00015,
      segmentWidth: 230,
    },
    visual: {
      skyColorTop: '#B0E0E6',
      skyColorBottom: '#E0FFFF',
      groundColor: '#708090',
      surfaceColor: '#FFFFFF',
      backgroundColor: '#B0C4DE',
      hasWeather: true,
      weatherType: 'snow',
    },
    pickups: {
      coinRateMultiplier: 1.0,
      fuelRateMultiplier: 1.2,
      fuelValueMultiplier: 1.1,
    },
    recommendedVehicles: ['tank', 'monster_truck'],
  },

  moon: {
    id: 'moon',
    name: 'Moon',
    description: 'Low gravity lunar surface. Bounce to the stars!',
    unlockCost: 20000,
    physics: {
      gravityMultiplier: 0.4,
      frictionMultiplier: 0.7,
      airResistanceMultiplier: 0.1,
    },
    terrain: {
      baseHeight: 130,
      minHeightVariation: -50,
      maxHeightVariation: 70,
      difficultyRamp: 0.00008,
      segmentWidth: 300,
    },
    visual: {
      skyColorTop: '#000000',
      skyColorBottom: '#1a1a2e',
      groundColor: '#4a4a4a',
      surfaceColor: '#9E9E9E',
      backgroundColor: '#2d2d2d',
      hasWeather: false,
    },
    pickups: {
      coinRateMultiplier: 1.5,
      fuelRateMultiplier: 0.6,
      fuelValueMultiplier: 1.5,
    },
    recommendedVehicles: ['moon_rover', 'dune_buggy'],
  },

  volcano: {
    id: 'volcano',
    name: 'Volcano',
    description: 'Treacherous volcanic terrain. High rewards for the brave!',
    unlockCost: 40000,
    physics: {
      gravityMultiplier: 1.1,
      frictionMultiplier: 0.9,
      airResistanceMultiplier: 1.0,
    },
    terrain: {
      baseHeight: 170,
      minHeightVariation: -60,
      maxHeightVariation: 80,
      difficultyRamp: 0.0002,
      segmentWidth: 220,
    },
    visual: {
      skyColorTop: '#4a0000',
      skyColorBottom: '#8B0000',
      groundColor: '#2d2d2d',
      surfaceColor: '#4a4a4a',
      backgroundColor: '#1a1a1a',
      hasWeather: true,
      weatherType: 'ash',
    },
    pickups: {
      coinRateMultiplier: 2.0,
      fuelRateMultiplier: 0.7,
      fuelValueMultiplier: 0.8,
    },
    recommendedVehicles: ['tank', 'super_car'],
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Dense woodland with steep hills. Watch out for logs!',
    unlockCost: 15000,
    physics: {
      gravityMultiplier: 1.0,
      frictionMultiplier: 1.1,
      airResistanceMultiplier: 1.2,
    },
    terrain: {
      baseHeight: 155,
      minHeightVariation: -45,
      maxHeightVariation: 65,
      difficultyRamp: 0.00018,
      segmentWidth: 200,
    },
    visual: {
      skyColorTop: '#228B22',
      skyColorBottom: '#90EE90',
      groundColor: '#3E2723',
      surfaceColor: '#2E7D32',
      backgroundColor: '#1B5E20',
      hasWeather: true,
      weatherType: 'rain',
    },
    pickups: {
      coinRateMultiplier: 1.3,
      fuelRateMultiplier: 1.1,
      fuelValueMultiplier: 1.0,
    },
    recommendedVehicles: ['monster_truck', 'jeep'],
  },
};

/**
 * Get stage by ID
 */
export function getStage(id: StageId): StageDefinition {
  return STAGES[id];
}

/**
 * Get all stages sorted by unlock cost
 */
export function getAllStages(): StageDefinition[] {
  return Object.values(STAGES).sort((a, b) => a.unlockCost - b.unlockCost);
}

/**
 * Get starter stage
 */
export function getStarterStage(): StageDefinition {
  return STAGES.countryside;
}

/**
 * Check if stage is unlocked
 */
export function isStageUnlocked(
  stageId: StageId,
  unlockedStages: StageId[]
): boolean {
  const stage = getStage(stageId);
  return stage.unlockCost === 0 || unlockedStages.includes(stageId);
}

/**
 * Get stages available for purchase
 */
export function getLockedStages(unlockedStages: StageId[]): StageDefinition[] {
  return getAllStages().filter(
    (s) => s.unlockCost > 0 && !unlockedStages.includes(s.id)
  );
}
