/**
 * Tests for AudioManager
 * GREEN GATE: AudioToggleTest must pass
 */

// Mock soundAssets BEFORE importing AudioManager
jest.mock('../soundAssets', () => ({
  getSfxAsset: jest.fn(() => 'mock-asset'),
  getMusicAsset: jest.fn(() => 'mock-asset'),
}));

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

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
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
      expect(settings.hapticsEnabled).toBe(true);
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
        hapticsEnabled: false,
        sfxVolume: 0.5,
        musicVolume: 0.3,
      });

      await manager.init();
      const settings = manager.getSettings();

      expect(settings.sfxEnabled).toBe(false);
      expect(settings.musicEnabled).toBe(false);
      expect(settings.hapticsEnabled).toBe(false);
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

    it('should toggle Haptics', async () => {
      await manager.init();
      expect(manager.getSettings().hapticsEnabled).toBe(true);

      await manager.toggleHaptics();
      expect(manager.getSettings().hapticsEnabled).toBe(false);

      await manager.toggleHaptics();
      expect(manager.getSettings().hapticsEnabled).toBe(true);
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

/**
 * GREEN GATE TEST: AudioToggleTest
 *
 * This test verifies that:
 * 1. When SFX is disabled, playSfx does not play sound (isPlaying = false)
 * 2. When SFX is enabled, playSfx does play sound (isPlaying = true)
 */
describe('AudioToggleTest - GREEN GATE', () => {
  let manager: AudioManager;

  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    manager = createAudioManager();
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  it('should NOT play SFX when disabled, and SHOULD play when enabled', async () => {
    // Initialize
    await manager.init();

    // Step 1: Disable SFX
    await manager.updateSettings({ sfxEnabled: false });
    expect(manager.getSettings().sfxEnabled).toBe(false);

    // Step 2: Trigger coin pickup
    await manager.playSfx(SFX_KEYS.COIN_PICKUP);

    // Step 3: Assert AudioSource.isPlaying == false
    const stateDisabled = manager.getPlaybackState();
    expect(stateDisabled.isSfxPlaying).toBe(false);
    expect(stateDisabled.lastPlayedSfx).toBe(SFX_KEYS.COIN_PICKUP);

    // Step 4: Enable SFX
    await manager.updateSettings({ sfxEnabled: true });
    expect(manager.getSettings().sfxEnabled).toBe(true);

    // Step 5: Trigger coin pickup
    await manager.playSfx(SFX_KEYS.COIN_PICKUP);

    // Step 6: Assert AudioSource.isPlaying == true
    const stateEnabled = manager.getPlaybackState();
    expect(stateEnabled.isSfxPlaying).toBe(true);
    expect(stateEnabled.lastPlayedSfx).toBe(SFX_KEYS.COIN_PICKUP);
  });

  it('should track playback state for all SFX types', async () => {
    await manager.init();

    // Test coin pickup
    await manager.playSfx(SFX_KEYS.COIN_PICKUP);
    expect(manager.getPlaybackState().lastPlayedSfx).toBe(SFX_KEYS.COIN_PICKUP);
    expect(manager.getPlaybackState().isSfxPlaying).toBe(true);

    // Test fuel pickup
    await manager.playSfx(SFX_KEYS.FUEL_PICKUP);
    expect(manager.getPlaybackState().lastPlayedSfx).toBe(SFX_KEYS.FUEL_PICKUP);

    // Test crash
    await manager.playSfx(SFX_KEYS.CRASH);
    expect(manager.getPlaybackState().lastPlayedSfx).toBe(SFX_KEYS.CRASH);

    // Test flip
    await manager.playSfx(SFX_KEYS.FLIP);
    expect(manager.getPlaybackState().lastPlayedSfx).toBe(SFX_KEYS.FLIP);

    // Test upgrade
    await manager.playSfx(SFX_KEYS.UPGRADE);
    expect(manager.getPlaybackState().lastPlayedSfx).toBe(SFX_KEYS.UPGRADE);

    // Test button tap
    await manager.playSfx(SFX_KEYS.BUTTON_TAP);
    expect(manager.getPlaybackState().lastPlayedSfx).toBe(SFX_KEYS.BUTTON_TAP);
  });
});

/**
 * AudioSettingsPersistenceTest
 * Verifies settings save and load correctly
 */
describe('AudioSettingsPersistenceTest', () => {
  it('Settings_Save_And_Load', async () => {
    // Create manager and init with custom settings
    const manager1 = createAudioManager();
    await manager1.init();

    // Update settings
    await manager1.updateSettings({
      sfxEnabled: false,
      musicEnabled: false,
      hapticsEnabled: false,
      sfxVolume: 0.25,
      musicVolume: 0.75,
    });

    // Verify settings were saved
    const savedSettings = manager1.getSettings();
    expect(savedSettings.sfxEnabled).toBe(false);
    expect(savedSettings.musicEnabled).toBe(false);
    expect(savedSettings.hapticsEnabled).toBe(false);
    expect(savedSettings.sfxVolume).toBe(0.25);
    expect(savedSettings.musicVolume).toBe(0.75);

    await manager1.cleanup();

    // Create new manager and verify it loads saved settings
    const manager2 = createAudioManager();
    await manager2.init();

    const loadedSettings = manager2.getSettings();
    expect(loadedSettings.sfxEnabled).toBe(false);
    expect(loadedSettings.musicEnabled).toBe(false);
    expect(loadedSettings.hapticsEnabled).toBe(false);
    expect(loadedSettings.sfxVolume).toBe(0.25);
    expect(loadedSettings.musicVolume).toBe(0.75);

    await manager2.cleanup();
  });
});

/**
 * Haptics tests
 */
describe('Haptics', () => {
  let manager: AudioManager;

  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    manager = createAudioManager();
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  it('should not throw when triggering haptics', async () => {
    await manager.init();

    expect(() => manager.triggerHaptic('light')).not.toThrow();
    expect(() => manager.triggerHaptic('medium')).not.toThrow();
    expect(() => manager.triggerHaptic('heavy')).not.toThrow();
    expect(() => manager.triggerHaptic('success')).not.toThrow();
    expect(() => manager.triggerHaptic('warning')).not.toThrow();
    expect(() => manager.triggerHaptic('error')).not.toThrow();
  });

  it('should not trigger haptics when disabled', async () => {
    await manager.init();
    await manager.updateSettings({ hapticsEnabled: false });

    // Should complete without error (and not call haptics API)
    expect(() => manager.triggerHaptic('light')).not.toThrow();
  });
});
