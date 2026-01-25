/**
 * Tests for AudioManager
 */

import {
  createAudioManager,
  AudioManager,
  AudioSettings,
} from '../AudioManager';
import { SFX_KEYS, MUSIC_KEYS } from '../audioKeys';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({
          sound: {
            playAsync: jest.fn(() => Promise.resolve()),
            stopAsync: jest.fn(() => Promise.resolve()),
            pauseAsync: jest.fn(() => Promise.resolve()),
            unloadAsync: jest.fn(() => Promise.resolve()),
            setVolumeAsync: jest.fn(() => Promise.resolve()),
            setPositionAsync: jest.fn(() => Promise.resolve()),
            getStatusAsync: jest.fn(() =>
              Promise.resolve({ isLoaded: true, isPlaying: false })
            ),
          },
        })
      ),
    },
  },
}));

describe('AudioManager', () => {
  let manager: AudioManager;

  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    manager = createAudioManager();
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  describe('initialization', () => {
    it('should not be initialized before init() is called', () => {
      expect(manager.isInitialized()).toBe(false);
    });

    it('should be initialized after init() is called', async () => {
      await manager.init();
      expect(manager.isInitialized()).toBe(true);
    });

    it('should have default settings', async () => {
      await manager.init();
      const settings = manager.getSettings();

      expect(settings.sfxEnabled).toBe(true);
      expect(settings.musicEnabled).toBe(true);
      expect(settings.sfxVolume).toBe(0.8);
      expect(settings.musicVolume).toBe(0.6);
    });
  });

  describe('settings persistence', () => {
    it('should save settings to AsyncStorage', async () => {
      await manager.init();
      await manager.updateSettings({ sfxEnabled: false });

      // Check that storage was updated
      const stored = mockStorage['@summit_wheels_audio_settings'];
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored);
      expect(parsed.sfxEnabled).toBe(false);
    });

    it('should load settings from AsyncStorage', async () => {
      // Pre-populate storage
      mockStorage['@summit_wheels_audio_settings'] = JSON.stringify({
        sfxEnabled: false,
        musicEnabled: false,
        sfxVolume: 0.5,
        musicVolume: 0.3,
      });

      await manager.init();
      const settings = manager.getSettings();

      expect(settings.sfxEnabled).toBe(false);
      expect(settings.musicEnabled).toBe(false);
      expect(settings.sfxVolume).toBe(0.5);
      expect(settings.musicVolume).toBe(0.3);
    });
  });

  describe('SFX', () => {
    it('should not throw when playing SFX before init', async () => {
      await expect(manager.playSfx(SFX_KEYS.COIN_PICKUP)).resolves.not.toThrow();
    });

    it('should not play SFX when disabled', async () => {
      await manager.init();
      await manager.updateSettings({ sfxEnabled: false });

      // This should be a no-op (not throw)
      await expect(manager.playSfx(SFX_KEYS.COIN_PICKUP)).resolves.not.toThrow();
    });

    it('should accept all SFX keys', async () => {
      await manager.init();

      for (const key of Object.values(SFX_KEYS)) {
        await expect(manager.playSfx(key)).resolves.not.toThrow();
      }
    });
  });

  describe('Music', () => {
    it('should not throw when playing music before init', async () => {
      await expect(
        manager.playMusic(MUSIC_KEYS.GAMEPLAY_LOOP)
      ).resolves.not.toThrow();
    });

    it('should accept all music keys', async () => {
      await manager.init();

      for (const key of Object.values(MUSIC_KEYS)) {
        await expect(manager.playMusic(key)).resolves.not.toThrow();
      }
    });

    it('should stop music without error', async () => {
      await manager.init();
      await manager.playMusic(MUSIC_KEYS.GAMEPLAY_LOOP);
      await expect(manager.stopMusic()).resolves.not.toThrow();
    });
  });

  describe('toggles', () => {
    it('should toggle SFX', async () => {
      await manager.init();
      expect(manager.getSettings().sfxEnabled).toBe(true);

      await manager.toggleSfx();
      expect(manager.getSettings().sfxEnabled).toBe(false);

      await manager.toggleSfx();
      expect(manager.getSettings().sfxEnabled).toBe(true);
    });

    it('should toggle Music', async () => {
      await manager.init();
      expect(manager.getSettings().musicEnabled).toBe(true);

      await manager.toggleMusic();
      expect(manager.getSettings().musicEnabled).toBe(false);

      await manager.toggleMusic();
      expect(manager.getSettings().musicEnabled).toBe(true);
    });
  });

  describe('volume', () => {
    it('should set SFX volume', async () => {
      await manager.init();
      await manager.setSfxVolume(0.5);

      expect(manager.getSettings().sfxVolume).toBe(0.5);
    });

    it('should clamp SFX volume to 0-1', async () => {
      await manager.init();

      await manager.setSfxVolume(-0.5);
      expect(manager.getSettings().sfxVolume).toBe(0);

      await manager.setSfxVolume(1.5);
      expect(manager.getSettings().sfxVolume).toBe(1);
    });

    it('should set Music volume', async () => {
      await manager.init();
      await manager.setMusicVolume(0.3);

      expect(manager.getSettings().musicVolume).toBe(0.3);
    });

    it('should clamp Music volume to 0-1', async () => {
      await manager.init();

      await manager.setMusicVolume(-0.5);
      expect(manager.getSettings().musicVolume).toBe(0);

      await manager.setMusicVolume(1.5);
      expect(manager.getSettings().musicVolume).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should cleanup without error', async () => {
      await manager.init();
      await manager.playMusic(MUSIC_KEYS.GAMEPLAY_LOOP);

      await expect(manager.cleanup()).resolves.not.toThrow();
      expect(manager.isInitialized()).toBe(false);
    });
  });
});

describe('AudioManager - SFX disabled behavior', () => {
  it('playSfx should be a no-op when SFX is disabled', async () => {
    const manager = createAudioManager();
    await manager.init();
    await manager.updateSettings({ sfxEnabled: false });

    // Should complete without error and without calling any actual play function
    await expect(manager.playSfx(SFX_KEYS.CRASH)).resolves.not.toThrow();

    await manager.cleanup();
  });
});
