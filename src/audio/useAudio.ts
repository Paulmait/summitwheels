/**
 * useAudio - React hook for audio management
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getAudioManager,
  AudioSettings,
  AudioManager,
  PlaybackState,
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
  /** Toggle Haptics on/off */
  toggleHaptics: () => void;
  /** Set SFX volume (0-1) */
  setSfxVolume: (volume: number) => void;
  /** Set Music volume (0-1) */
  setMusicVolume: (volume: number) => void;
  /** Trigger haptic feedback */
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
  /** Get current playback state */
  getPlaybackState: () => PlaybackState;
};

/**
 * React hook for accessing audio functionality
 */
export function useAudio(): UseAudioReturn {
  const [settings, setSettings] = useState<AudioSettings>({
    sfxEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
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

  const toggleHaptics = useCallback(async () => {
    if (manager) {
      await manager.toggleHaptics();
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

  const triggerHaptic = useCallback(
    (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
      manager?.triggerHaptic(type);
    },
    [manager]
  );

  const getPlaybackState = useCallback((): PlaybackState => {
    return manager?.getPlaybackState() ?? {
      lastPlayedSfx: null,
      isSfxPlaying: false,
      isMusicPlaying: false,
      currentMusicKey: null,
    };
  }, [manager]);

  return {
    settings,
    isReady,
    playSfx,
    playMusic,
    stopMusic,
    toggleSfx,
    toggleMusic,
    toggleHaptics,
    setSfxVolume,
    setMusicVolume,
    triggerHaptic,
    getPlaybackState,
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

export function useFlipSound() {
  const { playSfx } = useAudio();
  return useCallback(() => playSfx(SFX_KEYS.FLIP), [playSfx]);
}

export function useUpgradeSound() {
  const { playSfx } = useAudio();
  return useCallback(() => playSfx(SFX_KEYS.UPGRADE), [playSfx]);
}

export function useClickSound() {
  const { playSfx } = useAudio();
  return useCallback(() => playSfx(SFX_KEYS.UI_CLICK), [playSfx]);
}

export function useButtonTapSound() {
  const { playSfx } = useAudio();
  return useCallback(() => playSfx(SFX_KEYS.BUTTON_TAP), [playSfx]);
}

export default useAudio;
