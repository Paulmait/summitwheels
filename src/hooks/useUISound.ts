/**
 * useUISound - Hook for UI sound effects
 *
 * Provides easy access to common UI sounds for menu interactions
 */

import { useCallback } from 'react';
import { getAudioManager } from '../audio/AudioManager';
import { SFX_KEYS } from '../audio/audioKeys';

export type UISoundType = 'click' | 'toggle' | 'confirm' | 'back' | 'error';

/**
 * Hook for playing UI sounds
 */
export function useUISound() {
  const playSound = useCallback((type: UISoundType = 'click') => {
    const audioManager = getAudioManager();

    switch (type) {
      case 'click':
        audioManager.playSfx(SFX_KEYS.UI_CLICK);
        break;
      case 'toggle':
        audioManager.playSfx(SFX_KEYS.BUTTON_TAP);
        break;
      case 'confirm':
        audioManager.playSfx(SFX_KEYS.UPGRADE);
        break;
      case 'back':
        audioManager.playSfx(SFX_KEYS.UI_CLICK);
        break;
      case 'error':
        audioManager.playSfx(SFX_KEYS.BRAKE);
        break;
      default:
        audioManager.playSfx(SFX_KEYS.UI_CLICK);
    }
  }, []);

  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playToggle = useCallback(() => playSound('toggle'), [playSound]);
  const playConfirm = useCallback(() => playSound('confirm'), [playSound]);
  const playBack = useCallback(() => playSound('back'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);

  return {
    playSound,
    playClick,
    playToggle,
    playConfirm,
    playBack,
    playError,
  };
}

/**
 * Wrap a callback with a UI sound
 */
export function withUISound<T extends (...args: unknown[]) => unknown>(
  callback: T,
  soundType: UISoundType = 'click'
): T {
  return ((...args: Parameters<T>) => {
    const audioManager = getAudioManager();

    switch (soundType) {
      case 'click':
        audioManager.playSfx(SFX_KEYS.UI_CLICK);
        break;
      case 'toggle':
        audioManager.playSfx(SFX_KEYS.BUTTON_TAP);
        break;
      case 'confirm':
        audioManager.playSfx(SFX_KEYS.UPGRADE);
        break;
      default:
        audioManager.playSfx(SFX_KEYS.UI_CLICK);
    }

    return callback(...args);
  }) as T;
}
