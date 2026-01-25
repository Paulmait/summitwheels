/**
 * AudioManager - Centralized audio management for the game
 * Handles SFX, music, volume controls, and settings persistence
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SfxKey, MusicKey, SOUND_PATHS } from './audioKeys';

export type AudioSettings = {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number; // 0.0 - 1.0
  musicVolume: number; // 0.0 - 1.0
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
  /** Set SFX volume */
  setSfxVolume: (volume: number) => Promise<void>;
  /** Set Music volume */
  setMusicVolume: (volume: number) => Promise<void>;
  /** Unload all sounds */
  cleanup: () => Promise<void>;
  /** Check if manager is initialized */
  isInitialized: () => boolean;
};

const STORAGE_KEY = '@summit_wheels_audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
  sfxEnabled: true,
  musicEnabled: true,
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
    if (!initialized || !settings.sfxEnabled) return;

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

    if (!settings.musicEnabled) {
      currentMusicKey = key; // Remember what should be playing
      return;
    }

    const path = SOUND_PATHS[key];
    if (!path) return; // No asset available yet

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
  };

  const pauseMusic = async (): Promise<void> => {
    if (currentMusic) {
      try {
        await currentMusic.pauseAsync();
      } catch (error) {
        // Ignore
      }
    }
  };

  const resumeMusic = async (): Promise<void> => {
    if (currentMusic && settings.musicEnabled) {
      try {
        await currentMusic.playAsync();
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

  const setSfxVolume = async (volume: number): Promise<void> => {
    await updateSettings({ sfxVolume: Math.max(0, Math.min(1, volume)) });
  };

  const setMusicVolume = async (volume: number): Promise<void> => {
    await updateSettings({ musicVolume: Math.max(0, Math.min(1, volume)) });
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
  };

  const isInitialized = (): boolean => initialized;

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
    setSfxVolume,
    setMusicVolume,
    cleanup,
    isInitialized,
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
