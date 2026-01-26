/**
 * Floating Text System - Shows "+1" style feedback
 *
 * Creates temporary floating text that rises and fades
 */

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  startY: number;
  color: string;
  fontSize: number;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  velocityY: number;
}

export interface FloatingTextState {
  texts: FloatingText[];
}

export interface FloatingTextSystem {
  /**
   * Add floating text at a position
   */
  add: (text: string, x: number, y: number, options?: Partial<FloatingTextOptions>) => void;

  /**
   * Add coin pickup text (+1, +5, etc)
   */
  addCoinPickup: (amount: number, x: number, y: number) => void;

  /**
   * Add combo text
   */
  addCombo: (combo: number, x: number, y: number) => void;

  /**
   * Add trick text
   */
  addTrick: (name: string, points: number, x: number, y: number) => void;

  /**
   * Update all floating texts
   */
  update: (deltaTime: number) => void;

  /**
   * Get current texts for rendering
   */
  getTexts: () => FloatingText[];

  /**
   * Clear all texts
   */
  clear: () => void;
}

export interface FloatingTextOptions {
  color: string;
  fontSize: number;
  lifetime: number;
  velocityY: number;
}

const DEFAULT_OPTIONS: FloatingTextOptions = {
  color: '#FFD700',
  fontSize: 24,
  lifetime: 1000,
  velocityY: -50, // Pixels per second (negative = up)
};

let nextId = 0;

/**
 * Create a floating text system
 */
export function createFloatingTextSystem(): FloatingTextSystem {
  const texts: FloatingText[] = [];

  const add = (
    text: string,
    x: number,
    y: number,
    options: Partial<FloatingTextOptions> = {}
  ): void => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    texts.push({
      id: nextId++,
      text,
      x,
      y,
      startY: y,
      color: opts.color,
      fontSize: opts.fontSize,
      alpha: 1,
      lifetime: 0,
      maxLifetime: opts.lifetime,
      velocityY: opts.velocityY,
    });
  };

  const addCoinPickup = (amount: number, x: number, y: number): void => {
    add(`+${amount}`, x, y, {
      color: '#FFD700', // Gold
      fontSize: 28,
      lifetime: 800,
      velocityY: -80,
    });
  };

  const addCombo = (combo: number, x: number, y: number): void => {
    add(`${combo}x COMBO!`, x, y, {
      color: '#FF6B6B', // Red-orange
      fontSize: 32,
      lifetime: 1200,
      velocityY: -60,
    });
  };

  const addTrick = (name: string, points: number, x: number, y: number): void => {
    add(`${name} +${points}`, x, y, {
      color: '#4ECDC4', // Teal
      fontSize: 26,
      lifetime: 1000,
      velocityY: -70,
    });
  };

  const update = (deltaTime: number): void => {
    const deltaSeconds = deltaTime / 1000;

    // Update each text
    for (let i = texts.length - 1; i >= 0; i--) {
      const text = texts[i];

      // Update lifetime
      text.lifetime += deltaTime;

      // Update position (move up)
      text.y += text.velocityY * deltaSeconds;

      // Update alpha (fade out in last 30% of lifetime)
      const fadeStart = text.maxLifetime * 0.7;
      if (text.lifetime > fadeStart) {
        const fadeProgress = (text.lifetime - fadeStart) / (text.maxLifetime - fadeStart);
        text.alpha = 1 - fadeProgress;
      }

      // Remove expired texts
      if (text.lifetime >= text.maxLifetime) {
        texts.splice(i, 1);
      }
    }
  };

  const getTexts = (): FloatingText[] => {
    return [...texts];
  };

  const clear = (): void => {
    texts.length = 0;
  };

  return {
    add,
    addCoinPickup,
    addCombo,
    addTrick,
    update,
    getTexts,
    clear,
  };
}
