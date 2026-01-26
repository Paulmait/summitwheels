/**
 * Particle Effects System
 *
 * Handles visual effects:
 * - Dust trails from wheels
 * - Coin collection sparkles
 * - Crash explosion
 * - Landing dust
 */

export type ParticleType = 'dust' | 'sparkle' | 'smoke' | 'explosion' | 'snow';

export type Particle = {
  id: number;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  rotation: number;
  rotationSpeed: number;
};

export type ParticleConfig = {
  /** Max particles in pool */
  maxParticles: number;
  /** Gravity for particles */
  gravity: number;
  /** Air friction */
  friction: number;
};

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  maxParticles: 100,
  gravity: 0.1,
  friction: 0.98,
};

export type ParticleSystem = {
  /** Get all active particles */
  getParticles: () => Particle[];
  /** Update all particles (call each frame) */
  update: (deltaTime: number) => void;
  /** Emit dust particles at position */
  emitDust: (x: number, y: number, intensity: number, color?: string) => void;
  /** Emit sparkle particles (coin collection) */
  emitSparkle: (x: number, y: number) => void;
  /** Emit smoke particles */
  emitSmoke: (x: number, y: number) => void;
  /** Emit explosion particles (crash) */
  emitExplosion: (x: number, y: number) => void;
  /** Emit landing dust */
  emitLandingDust: (x: number, y: number, velocity: number) => void;
  /** Clear all particles */
  clear: () => void;
};

let nextParticleId = 0;

/**
 * Creates a particle system
 */
export function createParticleSystem(
  config: Partial<ParticleConfig> = {}
): ParticleSystem {
  const cfg: ParticleConfig = { ...DEFAULT_PARTICLE_CONFIG, ...config };
  let particles: Particle[] = [];

  const getParticles = (): Particle[] => [...particles];

  const createParticle = (
    type: ParticleType,
    x: number,
    y: number,
    options: Partial<Particle> = {}
  ): Particle => ({
    id: nextParticleId++,
    type,
    x,
    y,
    vx: options.vx ?? 0,
    vy: options.vy ?? 0,
    size: options.size ?? 5,
    color: options.color ?? '#FFFFFF',
    alpha: options.alpha ?? 1,
    lifetime: 0,
    maxLifetime: options.maxLifetime ?? 1000,
    rotation: options.rotation ?? 0,
    rotationSpeed: options.rotationSpeed ?? 0,
  });

  const addParticle = (particle: Particle): void => {
    if (particles.length < cfg.maxParticles) {
      particles.push(particle);
    } else {
      // Replace oldest particle
      const oldest = particles.reduce((min, p) =>
        p.lifetime > min.lifetime ? p : min
      );
      const index = particles.indexOf(oldest);
      if (index !== -1) {
        particles[index] = particle;
      }
    }
  };

  const update = (deltaTime: number): void => {
    particles = particles.filter((p) => {
      // Update lifetime
      p.lifetime += deltaTime;
      if (p.lifetime >= p.maxLifetime) {
        return false;
      }

      // Update position
      p.x += p.vx * (deltaTime / 16.67);
      p.y += p.vy * (deltaTime / 16.67);

      // Apply gravity
      p.vy += cfg.gravity * (deltaTime / 16.67);

      // Apply friction
      p.vx *= cfg.friction;
      p.vy *= cfg.friction;

      // Update rotation
      p.rotation += p.rotationSpeed * (deltaTime / 16.67);

      // Fade out based on lifetime
      const lifeProgress = p.lifetime / p.maxLifetime;
      p.alpha = 1 - lifeProgress;

      // Shrink over time
      if (p.type === 'dust' || p.type === 'smoke') {
        p.size *= 0.99;
      }

      return p.size > 0.5;
    });
  };

  const emitDust = (
    x: number,
    y: number,
    intensity: number,
    color: string = '#8B7355'
  ): void => {
    const count = Math.floor(intensity * 3);
    for (let i = 0; i < count; i++) {
      const particle = createParticle('dust', x, y, {
        vx: (Math.random() - 0.5) * intensity * 2,
        vy: -Math.random() * intensity * 1.5,
        size: 3 + Math.random() * 5,
        color,
        maxLifetime: 400 + Math.random() * 300,
        alpha: 0.6 + Math.random() * 0.4,
      });
      addParticle(particle);
    }
  };

  const emitSparkle = (x: number, y: number): void => {
    const colors = ['#FFD700', '#FFF8DC', '#FFFF00', '#FFA500'];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      const particle = createParticle('sparkle', x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        maxLifetime: 500 + Math.random() * 300,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
      });
      addParticle(particle);
    }
  };

  const emitSmoke = (x: number, y: number): void => {
    for (let i = 0; i < 5; i++) {
      const particle = createParticle('smoke', x, y, {
        vx: (Math.random() - 0.5) * 1,
        vy: -1 - Math.random() * 2,
        size: 8 + Math.random() * 8,
        color: '#555555',
        maxLifetime: 800 + Math.random() * 400,
        alpha: 0.4 + Math.random() * 0.3,
      });
      addParticle(particle);
    }
  };

  const emitExplosion = (x: number, y: number): void => {
    // Fire particles
    const fireColors = ['#FF4500', '#FF6347', '#FF8C00', '#FFD700'];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      const particle = createParticle('explosion', x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 6 + Math.random() * 10,
        color: fireColors[Math.floor(Math.random() * fireColors.length)],
        maxLifetime: 600 + Math.random() * 400,
      });
      addParticle(particle);
    }

    // Smoke particles
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const particle = createParticle('smoke', x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 12 + Math.random() * 15,
        color: '#333333',
        maxLifetime: 1000 + Math.random() * 500,
        alpha: 0.5,
      });
      addParticle(particle);
    }
  };

  const emitLandingDust = (x: number, y: number, velocity: number): void => {
    const intensity = Math.min(Math.abs(velocity) / 5, 3);
    const count = Math.floor(intensity * 4);

    for (let i = 0; i < count; i++) {
      const direction = i < count / 2 ? -1 : 1;
      const particle = createParticle('dust', x, y, {
        vx: direction * (1 + Math.random() * intensity),
        vy: -Math.random() * intensity * 0.5,
        size: 4 + Math.random() * 6,
        color: '#8B7355',
        maxLifetime: 500 + Math.random() * 300,
        alpha: 0.7,
      });
      addParticle(particle);
    }
  };

  const clear = (): void => {
    particles = [];
  };

  return {
    getParticles,
    update,
    emitDust,
    emitSparkle,
    emitSmoke,
    emitExplosion,
    emitLandingDust,
    clear,
  };
}

/**
 * Get particle render style
 */
export function getParticleStyle(particle: Particle): {
  type: 'circle' | 'star' | 'square';
  blur: number;
} {
  switch (particle.type) {
    case 'sparkle':
      return { type: 'star', blur: 0 };
    case 'dust':
    case 'smoke':
      return { type: 'circle', blur: 2 };
    case 'explosion':
      return { type: 'circle', blur: 1 };
    default:
      return { type: 'circle', blur: 0 };
  }
}
