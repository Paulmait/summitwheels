/**
 * Screen Shake System - Visual feedback for impacts
 *
 * Creates temporary camera shake effects for crashes and landings
 */

export interface ShakeState {
  offsetX: number;
  offsetY: number;
  isShaking: boolean;
}

export interface ScreenShakeSystem {
  /**
   * Trigger a screen shake
   * @param intensity - Shake strength (0-1, will be scaled to max offset)
   * @param duration - How long the shake lasts in ms
   */
  shake: (intensity: number, duration: number) => void;

  /**
   * Update the shake state
   * @param deltaTime - Time since last update in ms
   */
  update: (deltaTime: number) => void;

  /**
   * Get current shake offset for camera
   */
  getOffset: () => { x: number; y: number };

  /**
   * Get full state
   */
  getState: () => ShakeState;

  /**
   * Reset the system
   */
  reset: () => void;
}

export interface ScreenShakeOptions {
  maxOffset: number; // Maximum pixel offset
  decay: number; // How quickly shake diminishes (0-1)
}

const DEFAULT_OPTIONS: ScreenShakeOptions = {
  maxOffset: 20,
  decay: 0.9, // Quick decay
};

/**
 * Create a screen shake system
 */
export function createScreenShakeSystem(
  options: Partial<ScreenShakeOptions> = {}
): ScreenShakeSystem {
  const config = { ...DEFAULT_OPTIONS, ...options };

  let intensity = 0;
  let duration = 0;
  let elapsed = 0;
  let offsetX = 0;
  let offsetY = 0;

  const shake = (newIntensity: number, newDuration: number): void => {
    // Take the larger of current and new intensity
    intensity = Math.max(intensity, Math.min(1, newIntensity));
    duration = Math.max(duration - elapsed, newDuration);
    elapsed = 0;
  };

  const update = (deltaTime: number): void => {
    if (intensity <= 0) {
      offsetX = 0;
      offsetY = 0;
      return;
    }

    elapsed += deltaTime;

    // Check if shake is complete
    if (elapsed >= duration) {
      offsetX = 0;
      offsetY = 0;
      intensity = 0;
      return;
    }

    // Calculate remaining shake based on time progress
    const progress = elapsed / duration;
    const currentIntensity = intensity * (1 - progress);

    // Random offset within intensity bounds
    const maxOff = config.maxOffset * currentIntensity;
    offsetX = (Math.random() * 2 - 1) * maxOff;
    offsetY = (Math.random() * 2 - 1) * maxOff;
  };

  const getOffset = (): { x: number; y: number } => {
    return { x: offsetX, y: offsetY };
  };

  const getState = (): ShakeState => {
    return {
      offsetX,
      offsetY,
      isShaking: intensity > 0 && elapsed < duration,
    };
  };

  const reset = (): void => {
    intensity = 0;
    duration = 0;
    elapsed = 0;
    offsetX = 0;
    offsetY = 0;
  };

  return {
    shake,
    update,
    getOffset,
    getState,
    reset,
  };
}
