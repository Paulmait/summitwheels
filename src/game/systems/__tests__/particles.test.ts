/**
 * Tests for Particle Effects System
 */

import {
  createParticleSystem,
  ParticleSystem,
  getParticleStyle,
} from '../particles';

describe('ParticleSystem', () => {
  let particleSystem: ParticleSystem;

  beforeEach(() => {
    particleSystem = createParticleSystem();
  });

  describe('initialization', () => {
    it('should start with no particles', () => {
      const particles = particleSystem.getParticles();
      expect(particles).toHaveLength(0);
    });
  });

  describe('emitDust', () => {
    it('should emit dust particles', () => {
      particleSystem.emitDust(100, 200, 2);

      const particles = particleSystem.getParticles();
      expect(particles.length).toBeGreaterThan(0);
      expect(particles.every((p) => p.type === 'dust')).toBe(true);
    });

    it('should emit more particles with higher intensity', () => {
      const lowIntensity = createParticleSystem();
      lowIntensity.emitDust(100, 200, 1);

      const highIntensity = createParticleSystem();
      highIntensity.emitDust(100, 200, 3);

      expect(highIntensity.getParticles().length).toBeGreaterThan(
        lowIntensity.getParticles().length
      );
    });

    it('should accept custom color', () => {
      particleSystem.emitDust(100, 200, 2, '#FF0000');

      const particles = particleSystem.getParticles();
      expect(particles[0].color).toBe('#FF0000');
    });
  });

  describe('emitSparkle', () => {
    it('should emit sparkle particles', () => {
      particleSystem.emitSparkle(100, 200);

      const particles = particleSystem.getParticles();
      expect(particles.length).toBeGreaterThan(0);
      expect(particles.every((p) => p.type === 'sparkle')).toBe(true);
    });

    it('should emit sparkles in multiple directions', () => {
      particleSystem.emitSparkle(100, 200);

      const particles = particleSystem.getParticles();

      // Check that particles have different velocities
      const velocities = particles.map((p) => ({ vx: p.vx, vy: p.vy }));
      const uniqueDirections = new Set(
        velocities.map((v) => Math.atan2(v.vy, v.vx).toFixed(1))
      );

      expect(uniqueDirections.size).toBeGreaterThan(1);
    });
  });

  describe('emitSmoke', () => {
    it('should emit smoke particles', () => {
      particleSystem.emitSmoke(100, 200);

      const particles = particleSystem.getParticles();
      expect(particles.length).toBeGreaterThan(0);
      expect(particles.every((p) => p.type === 'smoke')).toBe(true);
    });

    it('should emit smoke moving upward', () => {
      particleSystem.emitSmoke(100, 200);

      const particles = particleSystem.getParticles();
      expect(particles.every((p) => p.vy < 0)).toBe(true); // Negative Y is up
    });
  });

  describe('emitExplosion', () => {
    it('should emit explosion particles', () => {
      particleSystem.emitExplosion(100, 200);

      const particles = particleSystem.getParticles();
      expect(particles.length).toBeGreaterThan(0);
    });

    it('should emit both fire and smoke particles', () => {
      particleSystem.emitExplosion(100, 200);

      const particles = particleSystem.getParticles();
      const types = new Set(particles.map((p) => p.type));

      expect(types.has('explosion')).toBe(true);
      expect(types.has('smoke')).toBe(true);
    });

    it('should emit many particles', () => {
      particleSystem.emitExplosion(100, 200);

      const particles = particleSystem.getParticles();
      expect(particles.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('emitLandingDust', () => {
    it('should emit landing dust based on velocity', () => {
      particleSystem.emitLandingDust(100, 200, 10);

      const particles = particleSystem.getParticles();
      expect(particles.length).toBeGreaterThan(0);
      expect(particles.every((p) => p.type === 'dust')).toBe(true);
    });

    it('should emit more dust with higher velocity', () => {
      const slowLanding = createParticleSystem();
      slowLanding.emitLandingDust(100, 200, 2);

      const fastLanding = createParticleSystem();
      fastLanding.emitLandingDust(100, 200, 10);

      expect(fastLanding.getParticles().length).toBeGreaterThanOrEqual(
        slowLanding.getParticles().length
      );
    });

    it('should emit dust in both directions', () => {
      particleSystem.emitLandingDust(100, 200, 10);

      const particles = particleSystem.getParticles();
      const hasLeftward = particles.some((p) => p.vx < 0);
      const hasRightward = particles.some((p) => p.vx > 0);

      expect(hasLeftward).toBe(true);
      expect(hasRightward).toBe(true);
    });
  });

  describe('update', () => {
    it('should move particles based on velocity', () => {
      particleSystem.emitDust(100, 200, 2);
      const initialParticles = particleSystem.getParticles();
      const initialX = initialParticles[0].x;

      particleSystem.update(100);
      const updatedParticles = particleSystem.getParticles();

      // Particles should have moved
      expect(updatedParticles[0].x).not.toBe(initialX);
    });

    it('should apply gravity to particles', () => {
      particleSystem.emitSparkle(100, 200);
      const initialVy = particleSystem.getParticles()[0].vy;

      particleSystem.update(100);
      const updatedVy = particleSystem.getParticles()[0].vy;

      // Velocity should increase due to gravity
      expect(updatedVy).toBeGreaterThan(initialVy);
    });

    it('should remove particles after lifetime', () => {
      particleSystem.emitDust(100, 200, 2);
      expect(particleSystem.getParticles().length).toBeGreaterThan(0);

      // Update with long time (particles should expire)
      particleSystem.update(10000);
      particleSystem.update(10000);

      expect(particleSystem.getParticles()).toHaveLength(0);
    });

    it('should fade particles over time', () => {
      particleSystem.emitDust(100, 200, 2);
      const initialAlpha = particleSystem.getParticles()[0].alpha;

      particleSystem.update(200);
      const updatedAlpha = particleSystem.getParticles()[0].alpha;

      expect(updatedAlpha).toBeLessThan(initialAlpha);
    });
  });

  describe('clear', () => {
    it('should remove all particles', () => {
      particleSystem.emitExplosion(100, 200);
      expect(particleSystem.getParticles().length).toBeGreaterThan(0);

      particleSystem.clear();
      expect(particleSystem.getParticles()).toHaveLength(0);
    });
  });

  describe('max particles limit', () => {
    it('should respect max particle limit', () => {
      const limitedSystem = createParticleSystem({ maxParticles: 10 });

      // Emit many explosions
      for (let i = 0; i < 10; i++) {
        limitedSystem.emitExplosion(100, 200);
      }

      const particles = limitedSystem.getParticles();
      expect(particles.length).toBeLessThanOrEqual(10);
    });
  });
});

describe('getParticleStyle', () => {
  it('should return star style for sparkles', () => {
    const sparkle = {
      id: 1,
      type: 'sparkle' as const,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 5,
      color: '#FFF',
      alpha: 1,
      lifetime: 0,
      maxLifetime: 1000,
      rotation: 0,
      rotationSpeed: 0,
    };

    const style = getParticleStyle(sparkle);
    expect(style.type).toBe('star');
  });

  it('should return circle with blur for dust', () => {
    const dust = {
      id: 1,
      type: 'dust' as const,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 5,
      color: '#FFF',
      alpha: 1,
      lifetime: 0,
      maxLifetime: 1000,
      rotation: 0,
      rotationSpeed: 0,
    };

    const style = getParticleStyle(dust);
    expect(style.type).toBe('circle');
    expect(style.blur).toBeGreaterThan(0);
  });
});
