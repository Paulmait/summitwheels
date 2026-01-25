/**
 * useAudio - React hook for audio management
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getAudioManager,
  AudioSettings,
  AudioManager,
} from './AudioManager';
import { SfxKey, MusicKey, SFX_KEYS } from './audioKeys';

export type UseAudioReturn = {
  /** Current audio settings */
  settings: AudioSettings;
  /** Whether audio system is initialized */
  isReady: boolean;
  /** Play a sound effect */
  playSfx: (key: SfxKey) => void;
  /** Play background music */
  playMusic: (key: MusicKey) => void;
  /** Stop current music */
  stopMusic: () => void;
  /** Toggle SFX on/off */
  toggleSfx: () => void;
  /** Toggle Music on/off */
  toggleMusic: () => void;
  /** Set SFX volume (0-1) */
  setSfxVolume: (volume: number) => void;
  /** Set Music volume (0-1) */
  setMusicVolume: (volume: number) => void;
};

/**
 * React hook for accessing audio functionality
 */
export function useAudio(): UseAudioReturn {
  const [settings, setSettings] = useState<AudioSettings>({
    sfxEnabled: true,
    musicEnabled: true,
    sfxVolume: 0.8,
    musicVolume: 0.6,
  });
  const [isReady, setIsReady] = useState(false);
  const [manager, setManager] = useState<AudioManager | null>(null);

  // Initialize audio manager
  useEffect(() => {
    const audioManager = getAudioManager();
    setManager(audioManager);

    audioManager.init().then(() => {
      setSettings(audioManager.getSettings());
      setIsReady(true);
    });

    return () => {
      // Don't cleanup on unmount - let singleton persist
    };
  }, []);

  const playSfx = useCallback(
    (key: SfxKey) => {
      manager?.playSfx(key);
    },
    [manager]
  );

  const playMusic = useCallback(
    (key: MusicKey) => {
      manager?.playMusic(key);
    },
    [manager]
  );

  const stopMusic = useCallback(() => {
    manager?.stopMusic();
  }, [manager]);

  const toggleSfx = useCallback(async () => {
    if (manager) {
      await manager.toggleSfx();
      setSettings(manager.getSettings());
    }
  }, [manager]);

  const toggleMusic = useCallback(async () => {
    if (manager) {
      await manager.toggleMusic();
      setSettings(manager.getSettings());
    }
  }, [manager]);

  const setSfxVolume = useCallback(
    async (volume: number) => {
      if (manager) {
        await manager.setSfxVolume(volume);
        setSettings(manager.getSettings());
      }
    },
    [manager]
  );

  const setMusicVolume = useCallback(
    async (volume: number) => {
      if (manager) {
        await manager.setMusicVolume(volume);
        setSettings(manager.getSettings());
      }
    },
    [manager]
  );

  return {
    settings,
    isReady,
    playSfx,
    playMusic,
    stopMusic,
    toggleSfx,
    toggleMusic,
    setSfxVolume,
    setMusicVolume,
  };
}

/**
 * Shortcut hooks for common audio actions
 */
export function useCoinSound() {
  const { playSfx } = useAudio();
  return useCallback(() => playSfx(SFX_KEYS.COIN_PICKUP), [playSfx]);
}

export function useFuelSound() {
  const { playSfx } = useAudio();
  return useCallback(() => playSfx(SFX_KEYS.FUEL_PICKUP), [playSfx]);
}

export function useCrashSound() {
  const { playSfx } = useAudio();
  return useCallback(() => playSfx(SFX_KEYS.CRASH), [playSfx]);
}

export function useClickSound() {
  const { playSfx } = useAudio();
  return useCallback(() => playSfx(SFX_KEYS.UI_CLICK), [playSfx]);
}

export default useAudio;
