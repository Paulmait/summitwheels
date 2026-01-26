/**
 * Tests for DataManager (Delete My Data functionality)
 * Required for GDPR/CCPA/Apple App Store compliance
 */

import {
  deleteAllLocalData,
  getDataSummary,
  STORAGE_KEYS,
} from '../DataManager';

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
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStorage))),
}));

describe('DataManager', () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  describe('STORAGE_KEYS', () => {
    it('should have all required storage keys defined', () => {
      expect(STORAGE_KEYS.PROGRESS).toBeDefined();
      expect(STORAGE_KEYS.AUDIO_SETTINGS).toBeDefined();
      expect(STORAGE_KEYS.EULA_ACCEPTED).toBeDefined();
      expect(STORAGE_KEYS.BEST_DISTANCE).toBeDefined();
      expect(STORAGE_KEYS.TOTAL_COINS).toBeDefined();
      expect(STORAGE_KEYS.UPGRADES).toBeDefined();
    });

    it('should use @summit_wheels prefix for all keys', () => {
      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(key).toMatch(/^@summit_wheels/);
      });
    });
  });

  describe('deleteAllLocalData', () => {
    it('should delete all stored data', async () => {
      // Setup: Add some data
      mockStorage[STORAGE_KEYS.PROGRESS] = JSON.stringify({ coins: 100 });
      mockStorage[STORAGE_KEYS.AUDIO_SETTINGS] = JSON.stringify({
        sfxEnabled: true,
      });
      mockStorage[STORAGE_KEYS.BEST_DISTANCE] = '1500';

      // Execute
      const result = await deleteAllLocalData();

      // Verify
      expect(result.success).toBe(true);
      expect(result.deletedKeys.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should return empty deletedKeys when no data exists', async () => {
      const result = await deleteAllLocalData();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should delete custom summit_wheels keys', async () => {
      // Add custom key with summit_wheels prefix
      mockStorage['@summit_wheels_custom_data'] = 'test';

      const result = await deleteAllLocalData();

      expect(result.success).toBe(true);
      expect(result.deletedKeys).toContain('@summit_wheels_custom_data');
    });
  });

  describe('getDataSummary', () => {
    it('should return hasData: false when no data exists', async () => {
      const summary = await getDataSummary();

      expect(summary.hasData).toBe(false);
      expect(summary.dataTypes).toHaveLength(0);
    });

    it('should detect game progress data', async () => {
      mockStorage[STORAGE_KEYS.PROGRESS] = JSON.stringify({ coins: 100 });

      const summary = await getDataSummary();

      expect(summary.hasData).toBe(true);
      expect(summary.dataTypes).toContain('Game Progress');
    });

    it('should detect settings data', async () => {
      mockStorage[STORAGE_KEYS.AUDIO_SETTINGS] = JSON.stringify({
        sfxEnabled: true,
      });

      const summary = await getDataSummary();

      expect(summary.hasData).toBe(true);
      expect(summary.dataTypes).toContain('Settings');
    });

    it('should detect statistics data', async () => {
      mockStorage[STORAGE_KEYS.BEST_DISTANCE] = '1500';

      const summary = await getDataSummary();

      expect(summary.hasData).toBe(true);
      expect(summary.dataTypes).toContain('Statistics');
    });

    it('should detect upgrades data', async () => {
      mockStorage[STORAGE_KEYS.UPGRADES] = JSON.stringify({ engine: 3 });

      const summary = await getDataSummary();

      expect(summary.hasData).toBe(true);
      expect(summary.dataTypes).toContain('Upgrades');
    });
  });
});

describe('Delete My Data - GDPR/CCPA Compliance', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it('should completely remove user data on request', async () => {
    // Simulate user data
    mockStorage[STORAGE_KEYS.PROGRESS] = JSON.stringify({
      coins: 500,
      totalRuns: 25,
    });
    mockStorage[STORAGE_KEYS.BEST_DISTANCE] = '2500';
    mockStorage[STORAGE_KEYS.UPGRADES] = JSON.stringify({
      engine: 5,
      tires: 3,
    });
    mockStorage[STORAGE_KEYS.AUDIO_SETTINGS] = JSON.stringify({
      sfxEnabled: true,
      musicEnabled: false,
    });

    // User requests data deletion
    const result = await deleteAllLocalData();

    // Verify complete deletion
    expect(result.success).toBe(true);
    expect(mockStorage[STORAGE_KEYS.PROGRESS]).toBeUndefined();
    expect(mockStorage[STORAGE_KEYS.BEST_DISTANCE]).toBeUndefined();
    expect(mockStorage[STORAGE_KEYS.UPGRADES]).toBeUndefined();
    expect(mockStorage[STORAGE_KEYS.AUDIO_SETTINGS]).toBeUndefined();
  });

  it('should not affect data from other apps', async () => {
    // Add summit wheels data
    mockStorage[STORAGE_KEYS.PROGRESS] = 'summit_data';

    // Add other app data
    mockStorage['@other_app_data'] = 'should_remain';

    // Delete summit wheels data
    await deleteAllLocalData();

    // Verify other app data remains
    expect(mockStorage['@other_app_data']).toBe('should_remain');
  });
});
