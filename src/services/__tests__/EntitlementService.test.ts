/**
 * Tests for EntitlementService
 */

import { EntitlementServiceClass } from '../EntitlementService';

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
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    return Promise.resolve();
  }),
}));

// Helper to clear mock storage
const clearMockStorage = () => {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
};

describe('EntitlementService', () => {
  let service: EntitlementServiceClass;

  beforeEach(() => {
    clearMockStorage();
    service = new EntitlementServiceClass();
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('should return default entitlements when storage is empty', async () => {
      const entitlements = await service.load();

      expect(entitlements).toEqual({
        noAds: false,
        summitPass: false,
        coins: 0,
      });
    });

    it('should load stored entitlements', async () => {
      mockStorage['@summit_wheels_entitlements'] = JSON.stringify({
        noAds: true,
        summitPass: false,
        coins: 5000,
      });

      const entitlements = await service.load();

      expect(entitlements).toEqual({
        noAds: true,
        summitPass: false,
        coins: 5000,
      });
    });

    it('should handle partial stored data', async () => {
      mockStorage['@summit_wheels_entitlements'] = JSON.stringify({ noAds: true });

      const entitlements = await service.load();

      expect(entitlements).toEqual({
        noAds: true,
        summitPass: false,
        coins: 0,
      });
    });

    it('should set isLoaded to true after loading', async () => {
      expect(service.isLoaded()).toBe(false);
      await service.load();
      expect(service.isLoaded()).toBe(true);
    });
  });

  describe('setEntitlement', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('should update noAds entitlement', async () => {
      await service.setEntitlement('noAds', true);

      expect(service.getEntitlements().noAds).toBe(true);
    });

    it('should update summitPass entitlement', async () => {
      await service.setEntitlement('summitPass', true);

      expect(service.getEntitlements().summitPass).toBe(true);
    });

    it('should update coins entitlement', async () => {
      await service.setEntitlement('coins', 1000);

      expect(service.getEntitlements().coins).toBe(1000);
    });

    it('should persist changes to storage', async () => {
      await service.setEntitlement('noAds', true);

      expect(JSON.parse(mockStorage['@summit_wheels_entitlements']).noAds).toBe(true);
    });
  });

  describe('addCoins', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('should add coins to balance', async () => {
      const newBalance = await service.addCoins(1000);

      expect(newBalance).toBe(1000);
      expect(service.getCoins()).toBe(1000);
    });

    it('should accumulate coins', async () => {
      await service.addCoins(1000);
      await service.addCoins(500);

      expect(service.getCoins()).toBe(1500);
    });

    it('should persist coin changes', async () => {
      await service.addCoins(5000);

      expect(JSON.parse(mockStorage['@summit_wheels_entitlements']).coins).toBe(5000);
    });
  });

  describe('spendCoins', () => {
    beforeEach(async () => {
      await service.load();
      await service.addCoins(1000);
    });

    it('should deduct coins when sufficient balance', async () => {
      const success = await service.spendCoins(500);

      expect(success).toBe(true);
      expect(service.getCoins()).toBe(500);
    });

    it('should return false when insufficient balance', async () => {
      const success = await service.spendCoins(2000);

      expect(success).toBe(false);
      expect(service.getCoins()).toBe(1000);
    });

    it('should allow spending exact balance', async () => {
      const success = await service.spendCoins(1000);

      expect(success).toBe(true);
      expect(service.getCoins()).toBe(0);
    });
  });

  describe('hasNoAds', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('should return true when noAds is purchased', async () => {
      await service.setEntitlement('noAds', true);

      expect(service.hasNoAds()).toBe(true);
    });

    it('should return true when summitPass is active', async () => {
      await service.setEntitlement('summitPass', true);

      expect(service.hasNoAds()).toBe(true);
    });

    it('should return false when neither is active', async () => {
      expect(service.hasNoAds()).toBe(false);
    });
  });

  describe('hasSummitPass', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('should return true when summitPass is active', async () => {
      await service.setEntitlement('summitPass', true);

      expect(service.hasSummitPass()).toBe(true);
    });

    it('should return false when summitPass is not active', async () => {
      expect(service.hasSummitPass()).toBe(false);
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await service.load();
      await service.setEntitlement('noAds', true);
      await service.setEntitlement('summitPass', true);
      await service.addCoins(5000);
    });

    it('should reset all entitlements to defaults', async () => {
      await service.reset();

      expect(service.getEntitlements()).toEqual({
        noAds: false,
        summitPass: false,
        coins: 0,
      });
    });

    it('should clear storage', async () => {
      await service.reset();

      expect(mockStorage['@summit_wheels_entitlements']).toBeUndefined();
    });
  });

  describe('getEntitlements', () => {
    beforeEach(async () => {
      await service.load();
    });

    it('should return a copy of entitlements', async () => {
      const entitlements = service.getEntitlements();
      entitlements.coins = 9999;

      expect(service.getCoins()).toBe(0);
    });
  });
});
