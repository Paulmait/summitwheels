/**
 * Weather System - Stage-specific atmospheric effects
 *
 * Implements:
 * - Snow particles (Arctic)
 * - Sandstorm particles (Desert)
 * - Rain particles (Forest)
 * - Ash particles (Volcano)
 * - Fog overlay (configurable)
 */

export type WeatherType = 'snow' | 'sandstorm' | 'rain' | 'ash' | 'none';

export type WeatherParticle = {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
};

export type WeatherConfig = {
  type: WeatherType;
  particleCount: number;
  windStrength: number;
  particleSpeed: number;
  particleSize: { min: number; max: number };
  particleColor: string;
  fogOpacity: number;
  fogColor: string;
};

const WEATHER_CONFIGS: Record<WeatherType, Omit<WeatherConfig, 'type'>> = {
  snow: {
    particleCount: 100,
    windStrength: 0.5,
    particleSpeed: 2,
    particleSize: { min: 2, max: 6 },
    particleColor: '#FFFFFF',
    fogOpacity: 0.1,
    fogColor: '#E0E0E0',
  },
  sandstorm: {
    particleCount: 150,
    windStrength: 3,
    particleSpeed: 8,
    particleSize: { min: 1, max: 4 },
    particleColor: '#D2B48C',
    fogOpacity: 0.3,
    fogColor: '#C4A35A',
  },
  rain: {
    particleCount: 200,
    windStrength: 1,
    particleSpeed: 15,
    particleSize: { min: 1, max: 3 },
    particleColor: '#ADD8E6',
    fogOpacity: 0.15,
    fogColor: '#708090',
  },
  ash: {
    particleCount: 80,
    windStrength: 0.8,
    particleSpeed: 1.5,
    particleSize: { min: 2, max: 5 },
    particleColor: '#4A4A4A',
    fogOpacity: 0.25,
    fogColor: '#2C2C2C',
  },
  none: {
    particleCount: 0,
    windStrength: 0,
    particleSpeed: 0,
    particleSize: { min: 0, max: 0 },
    particleColor: '#FFFFFF',
    fogOpacity: 0,
    fogColor: '#FFFFFF',
  },
};

export type WeatherSystem = {
  /** Get current particles */
  getParticles: () => WeatherParticle[];
  /** Update weather system */
  update: (deltaTime: number, cameraX: number, screenWidth: number, screenHeight: number) => void;
  /** Set weather type */
  setWeather: (type: WeatherType) => void;
  /** Get current config */
  getConfig: () => WeatherConfig;
  /** Get fog overlay style */
  getFogStyle: () => { opacity: number; color: string };
  /** Clear all particles */
  clear: () => void;
  /** Set intensity (0-1) */
  setIntensity: (intensity: number) => void;
};

let particleIdCounter = 0;

/**
 * Create weather system
 */
export function createWeatherSystem(initialType: WeatherType = 'none'): WeatherSystem {
  let particles: WeatherParticle[] = [];
  let currentType: WeatherType = initialType;
  let config: WeatherConfig = { type: initialType, ...WEATHER_CONFIGS[initialType] };
  let intensity: number = 1.0;
  let lastCameraX: number = 0;

  /**
   * Create a new particle
   */
  const createParticle = (
    screenWidth: number,
    screenHeight: number,
    atEdge: boolean = false
  ): WeatherParticle => {
    const sizeRange = config.particleSize.max - config.particleSize.min;
    const size = config.particleSize.min + Math.random() * sizeRange;

    // Spawn position
    let x: number;
    let y: number;

    if (currentType === 'rain' || currentType === 'snow' || currentType === 'ash') {
      // Spawn from top
      x = Math.random() * screenWidth * 1.5 - screenWidth * 0.25;
      y = atEdge ? -size : Math.random() * screenHeight;
    } else {
      // Sandstorm - spawn from right edge
      x = atEdge ? screenWidth + size : Math.random() * screenWidth;
      y = Math.random() * screenHeight;
    }

    // Base velocity
    let velocityX = config.windStrength * (0.5 + Math.random() * 0.5);
    let velocityY = config.particleSpeed * (0.8 + Math.random() * 0.4);

    // Adjust for weather type
    if (currentType === 'sandstorm') {
      velocityX = -config.windStrength * (0.8 + Math.random() * 0.4);
      velocityY = (Math.random() - 0.5) * 2;
    }

    return {
      id: particleIdCounter++,
      x,
      y,
      velocityX,
      velocityY,
      size,
      alpha: 0.3 + Math.random() * 0.5,
      color: config.particleColor,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    };
  };

  /**
   * Initialize particles
   */
  const initializeParticles = (screenWidth: number, screenHeight: number): void => {
    particles = [];
    const count = Math.floor(config.particleCount * intensity);

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(screenWidth, screenHeight, false));
    }
  };

  return {
    getParticles(): WeatherParticle[] {
      return particles;
    },

    update(deltaTime: number, cameraX: number, screenWidth: number, screenHeight: number): void {
      if (currentType === 'none' || config.particleCount === 0) {
        particles = [];
        return;
      }

      const deltaSeconds = deltaTime / 1000;
      const cameraDelta = cameraX - lastCameraX;
      lastCameraX = cameraX;

      // Update existing particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // Apply velocity
        particle.x += particle.velocityX * deltaSeconds * 60;
        particle.y += particle.velocityY * deltaSeconds * 60;

        // Compensate for camera movement
        particle.x -= cameraDelta * 0.5;

        // Update rotation
        particle.rotation += particle.rotationSpeed;

        // Add some wave motion for snow/ash
        if (currentType === 'snow' || currentType === 'ash') {
          particle.x += Math.sin(particle.y * 0.02 + particle.id * 0.5) * 0.5;
        }

        // Check bounds and recycle
        const isOutOfBounds =
          (currentType === 'sandstorm' && particle.x < -50) ||
          (currentType !== 'sandstorm' && particle.y > screenHeight + 50) ||
          particle.x < -100 ||
          particle.x > screenWidth + 100;

        if (isOutOfBounds) {
          particles.splice(i, 1);
        }
      }

      // Spawn new particles to maintain count
      const targetCount = Math.floor(config.particleCount * intensity);
      while (particles.length < targetCount) {
        particles.push(createParticle(screenWidth, screenHeight, true));
      }
    },

    setWeather(type: WeatherType): void {
      if (type === currentType) return;

      currentType = type;
      config = { type, ...WEATHER_CONFIGS[type] };
      particles = [];
    },

    getConfig(): WeatherConfig {
      return { ...config };
    },

    getFogStyle(): { opacity: number; color: string } {
      return {
        opacity: config.fogOpacity * intensity,
        color: config.fogColor,
      };
    },

    clear(): void {
      particles = [];
    },

    setIntensity(newIntensity: number): void {
      intensity = Math.max(0, Math.min(1, newIntensity));
    },
  };
}

/**
 * Get weather particle render data
 * Returns data optimized for rendering
 */
export function getWeatherRenderData(particles: WeatherParticle[]): {
  positions: { x: number; y: number; size: number; alpha: number; color: string; rotation: number }[];
} {
  return {
    positions: particles.map((p) => ({
      x: p.x,
      y: p.y,
      size: p.size,
      alpha: p.alpha,
      color: p.color,
      rotation: p.rotation,
    })),
  };
}
