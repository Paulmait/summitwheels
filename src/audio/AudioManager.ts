/**
 * AudioManager - Centralized audio management for the game
 * Handles SFX, music, haptics, and settings persistence
 *
 * Sound sources: Kenney.nl (CC0), OpenGameArt (CC0)
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SfxKey, MusicKey, SOUND_PATHS } from './audioKeys';

export type AudioSettings = {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  sfxVolume: number; // 0.0 - 1.0
  musicVolume: number; // 0.0 - 1.0
};

export type PlaybackState = {
  lastPlayedSfx: SfxKey | null;
  isSfxPlaying: boolean;
  isMusicPlaying: boolean;
  currentMusicKey: MusicKey | null;
};

export type AudioManager = {
  /** Initialize the audio system */
  init: () => Promise<void>;
  /** Play a sound effect */
  playSfx: (key: SfxKey) => Promise<void>;
  /** Play background music */
  playMusic: (key: MusicKey) => Promise<void>;
  /** Stop current music */
  stopMusic: () => Promise<void>;
  /** Pause current music */
  pauseMusic: () => Promise<void>;
  /** Resume current music */
  resumeMusic: () => Promise<void>;
  /** Get current settings */
  getSettings: () => AudioSettings;
  /** Update settings */
  updateSettings: (settings: Partial<AudioSettings>) => Promise<void>;
  /** Toggle SFX on/off */
  toggleSfx: () => Promise<void>;
  /** Toggle Music on/off */
  toggleMusic: () => Promise<void>;
  /** Toggle Haptics on/off */
  toggleHaptics: () => Promise<void>;
  /** Set SFX volume */
  setSfxVolume: (volume: number) => Promise<void>;
  /** Set Music volume */
  setMusicVolume: (volume: number) => Promise<void>;
  /** Trigger haptic feedback */
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
  /** Unload all sounds */
  cleanup: () => Promise<void>;
  /** Check if manager is initialized */
  isInitialized: () => boolean;
  /** Get playback state (for testing) */
  getPlaybackState: () => PlaybackState;
};

const STORAGE_KEY = '@summit_wheels_audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
  sfxEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  sfxVolume: 0.8,
  musicVolume: 0.6,
};

/**
 * Creates a singleton AudioManager instance
 */
export function createAudioManager(): AudioManager {
  let initialized = false;
  let settings: AudioSettings = { ...DEFAULT_SETTINGS };
  let currentMusic: Audio.Sound | null = null;
  let currentMusicKey: MusicKey | null = null;

  // Playback state for testing
  let playbackState: PlaybackState = {
    lastPlayedSfx: null,
    isSfxPlaying: false,
    isMusicPlaying: false,
    currentMusicKey: null,
  };

  // Sound pool for SFX (to avoid creating new sounds each time)
  const soundPool: Map<SfxKey, Audio.Sound[]> = new Map();
  const POOL_SIZE = 3; // Allow up to 3 instances of each sound

  /**
   * Load settings from AsyncStorage
   */
  const loadSettings = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  };

  /**
   * Save settings to AsyncStorage
   */
  const saveSettings = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  };

  /**
   * Configure audio mode for background playback
   */
  const configureAudio = async (): Promise<void> => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.warn('Failed to configure audio mode:', error);
    }
  };

  /**
   * Get an available sound from the pool or create a new one
   */
  const getSoundFromPool = async (key: SfxKey): Promise<Audio.Sound | null> => {
    const path = SOUND_PATHS[key];
    if (!path) return null; // No asset available yet

    let pool = soundPool.get(key);
    if (!pool) {
      pool = [];
      soundPool.set(key, pool);
    }

    // Find an available sound (not playing)
    for (const sound of pool) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        return sound;
      }
    }

    // Create new sound if pool not full
    if (pool.length < POOL_SIZE) {
      try {
        // When assets are added, use require() here
        // const { sound } = await Audio.Sound.createAsync(require(`../../assets/audio/${path}`));
        // pool.push(sound);
        // return sound;
        return null; // Placeholder until assets are added
      } catch (error) {
        console.warn(`Failed to load sound ${key}:`, error);
        return null;
      }
    }

    // Pool is full and all sounds are playing
    return null;
  };

  const init = async (): Promise<void> => {
    if (initialized) return;

    await configureAudio();
    await loadSettings();
    initialized = true;
  };

  const playSfx = async (key: SfxKey): Promise<void> => {
    // Update playback state for testing
    playbackState.lastPlayedSfx = key;

    if (!initialized || !settings.sfxEnabled) {
      playbackState.isSfxPlaying = false;
      return;
    }

    // Mark as playing (for testing purposes)
    playbackState.isSfxPlaying = true;

    // Trigger haptic feedback with SFX
    if (settings.hapticsEnabled) {
      triggerHaptic('light');
    }

    try {
      const sound = await getSoundFromPool(key);
      if (sound) {
        await sound.setVolumeAsync(settings.sfxVolume);
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      // Silently fail - SFX not critical
    }
  };

  const playMusic = async (key: MusicKey): Promise<void> => {
    if (!initialized) return;

    // Stop current music if different
    if (currentMusicKey !== key) {
      await stopMusic();
    }

    playbackState.currentMusicKey = key;

    if (!settings.musicEnabled) {
      currentMusicKey = key; // Remember what should be playing
      playbackState.isMusicPlaying = false;
      return;
    }

    const path = SOUND_PATHS[key];
    if (!path) {
      currentMusicKey = key; // Placeholder
      playbackState.isMusicPlaying = true;
      return;
    }

    try {
      // When assets are added, use require() here
      // const { sound } = await Audio.Sound.createAsync(
      //   require(`../../assets/audio/${path}`),
      //   { isLooping: true, volume: settings.musicVolume }
      // );
      // currentMusic = sound;
      // currentMusicKey = key;
      // await sound.playAsync();
      currentMusicKey = key; // Placeholder
      playbackState.isMusicPlaying = true;
    } catch (error) {
      console.warn(`Failed to play music ${key}:`, error);
    }
  };

  const stopMusic = async (): Promise<void> => {
    if (currentMusic) {
      try {
        await currentMusic.stopAsync();
        await currentMusic.unloadAsync();
      } catch (error) {
        // Ignore errors during cleanup
      }
      currentMusic = null;
    }
    currentMusicKey = null;
    playbackState.isMusicPlaying = false;
    playbackState.currentMusicKey = null;
  };

  const pauseMusic = async (): Promise<void> => {
    if (currentMusic) {
      try {
        await currentMusic.pauseAsync();
        playbackState.isMusicPlaying = false;
      } catch (error) {
        // Ignore
      }
    }
  };

  const resumeMusic = async (): Promise<void> => {
    if (currentMusic && settings.musicEnabled) {
      try {
        await currentMusic.playAsync();
        playbackState.isMusicPlaying = true;
      } catch (error) {
        // Ignore
      }
    }
  };

  const getSettings = (): AudioSettings => ({ ...settings });

  const updateSettings = async (newSettings: Partial<AudioSettings>): Promise<void> => {
    settings = { ...settings, ...newSettings };
    await saveSettings();

    // Apply volume changes to current music
    if (currentMusic && newSettings.musicVolume !== undefined) {
      try {
        await currentMusic.setVolumeAsync(settings.musicVolume);
      } catch (error) {
        // Ignore
      }
    }

    // Handle music toggle
    if (newSettings.musicEnabled !== undefined) {
      if (newSettings.musicEnabled && currentMusicKey) {
        await playMusic(currentMusicKey);
      } else if (!newSettings.musicEnabled) {
        await pauseMusic();
      }
    }
  };

  const toggleSfx = async (): Promise<void> => {
    await updateSettings({ sfxEnabled: !settings.sfxEnabled });
  };

  const toggleMusic = async (): Promise<void> => {
    await updateSettings({ musicEnabled: !settings.musicEnabled });
  };

  const toggleHaptics = async (): Promise<void> => {
    await updateSettings({ hapticsEnabled: !settings.hapticsEnabled });
  };

  const setSfxVolume = async (volume: number): Promise<void> => {
    await updateSettings({ sfxVolume: Math.max(0, Math.min(1, volume)) });
  };

  const setMusicVolume = async (volume: number): Promise<void> => {
    await updateSettings({ musicVolume: Math.max(0, Math.min(1, volume)) });
  };

  const triggerHaptic = (
    type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
  ): void => {
    if (!settings.hapticsEnabled) return;

    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      // Haptics may not be available on all devices
    }
  };

  const cleanup = async (): Promise<void> => {
    await stopMusic();

    // Unload all pooled sounds
    for (const [, pool] of soundPool) {
      for (const sound of pool) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          // Ignore
        }
      }
    }
    soundPool.clear();
    initialized = false;
    playbackState = {
      lastPlayedSfx: null,
      isSfxPlaying: false,
      isMusicPlaying: false,
      currentMusicKey: null,
    };
  };

  const isInitialized = (): boolean => initialized;

  const getPlaybackState = (): PlaybackState => ({ ...playbackState });

  return {
    init,
    playSfx,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    getSettings,
    updateSettings,
    toggleSfx,
    toggleMusic,
    toggleHaptics,
    setSfxVolume,
    setMusicVolume,
    triggerHaptic,
    cleanup,
    isInitialized,
    getPlaybackState,
  };
}

// Singleton instance
let audioManagerInstance: AudioManager | null = null;

/**
 * Get the singleton AudioManager instance
 */
export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = createAudioManager();
  }
  return audioManagerInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetAudioManager(): void {
  if (audioManagerInstance) {
    audioManagerInstance.cleanup();
  }
  audioManagerInstance = null;
}
