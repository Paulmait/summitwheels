/**
 * Tests for IAP Manager
 */

import { IAPManagerClass } from '../IAPManager';
import {
  NON_CONSUMABLE_PRODUCTS,
  SUBSCRIPTION_PRODUCTS,
  CONSUMABLE_PRODUCTS,
  COIN_PACK_VALUES,
} from '../iapKeys';

// Mock react-native-iap
jest.mock('react-native-iap', () => ({
  initConnection: jest.fn(() => Promise.resolve(true)),
  endConnection: jest.fn(() => Promise.resolve()),
  fetchProducts: jest.fn(({ type }: { skus: string[]; type: string }) => {
    if (type === 'subs') {
      return Promise.resolve([
        { id: 'com.cienrios.summitwheels.pass.monthly', displayPrice: '$4.99' },
        { id: 'com.cienrios.summitwheels.pass.yearly', displayPrice: '$29.99' },
      ]);
    }
    return Promise.resolve([
      { id: 'com.cienrios.summitwheels.removeads', displayPrice: '$2.99' },
      { id: 'com.cienrios.summitwheels.coins.small', displayPrice: '$0.99' },
      { id: 'com.cienrios.summitwheels.coins.medium', displayPrice: '$4.99' },
      { id: 'com.cienrios.summitwheels.coins.large', displayPrice: '$9.99' },
    ]);
  }),
  requestPurchase: jest.fn(() => Promise.resolve()),
  getAvailablePurchases: jest.fn(() => Promise.resolve([])),
  finishTransaction: jest.fn(() => Promise.resolve()),
  clearTransactionIOS: jest.fn(() => Promise.resolve()),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('IAPManager', () => {
  let manager: IAPManagerClass;

  beforeEach(() => {
    manager = new IAPManagerClass();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize connection successfully', async () => {
      const result = await manager.initialize();
      expect(result).toBe(true);
      expect(manager.isInitialized()).toBe(true);
    });

    it('should fetch products on initialization', async () => {
      await manager.initialize();
      const products = manager.getProducts();
      expect(products.length).toBe(4);
    });

    it('should fetch subscriptions on initialization', async () => {
      await manager.initialize();
      const subscriptions = manager.getSubscriptions();
      expect(subscriptions.length).toBe(2);
    });

    it('should not reinitialize if already initialized', async () => {
      await manager.initialize();
      const RNIap = require('react-native-iap');
      const initCallCount = RNIap.initConnection.mock.calls.length;

      await manager.initialize();
      expect(RNIap.initConnection.mock.calls.length).toBe(initCallCount);
    });
  });

  describe('purchase handlers', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should have purchaseRemoveAds function', () => {
      expect(typeof manager.purchaseRemoveAds).toBe('function');
    });

    it('should have purchaseMonthlyPass function', () => {
      expect(typeof manager.purchaseMonthlyPass).toBe('function');
    });

    it('should have purchaseYearlyPass function', () => {
      expect(typeof manager.purchaseYearlyPass).toBe('function');
    });

    it('should have purchaseCoinPack function', () => {
      expect(typeof manager.purchaseCoinPack).toBe('function');
    });

    it('should have restorePurchases function', () => {
      expect(typeof manager.restorePurchases).toBe('function');
    });

    it('should call requestPurchase for removeAds', async () => {
      const RNIap = require('react-native-iap');
      await manager.purchaseRemoveAds();
      expect(RNIap.requestPurchase).toHaveBeenCalledWith({
        request: { apple: { sku: NON_CONSUMABLE_PRODUCTS.REMOVE_ADS } },
        type: 'in-app',
      });
    });

    it('should call requestPurchase for monthly pass', async () => {
      const RNIap = require('react-native-iap');
      await manager.purchaseMonthlyPass();
      expect(RNIap.requestPurchase).toHaveBeenCalledWith({
        request: { apple: { sku: SUBSCRIPTION_PRODUCTS.MONTHLY_PASS } },
        type: 'subs',
      });
    });

    it('should call requestPurchase for yearly pass', async () => {
      const RNIap = require('react-native-iap');
      await manager.purchaseYearlyPass();
      expect(RNIap.requestPurchase).toHaveBeenCalledWith({
        request: { apple: { sku: SUBSCRIPTION_PRODUCTS.YEARLY_PASS } },
        type: 'subs',
      });
    });

    it('should call requestPurchase for small coin pack', async () => {
      const RNIap = require('react-native-iap');
      await manager.purchaseCoinPack('small');
      expect(RNIap.requestPurchase).toHaveBeenCalledWith({
        request: { apple: { sku: CONSUMABLE_PRODUCTS.COINS_SMALL } },
        type: 'in-app',
      });
    });

    it('should call requestPurchase for medium coin pack', async () => {
      const RNIap = require('react-native-iap');
      await manager.purchaseCoinPack('medium');
      expect(RNIap.requestPurchase).toHaveBeenCalledWith({
        request: { apple: { sku: CONSUMABLE_PRODUCTS.COINS_MEDIUM } },
        type: 'in-app',
      });
    });

    it('should call requestPurchase for large coin pack', async () => {
      const RNIap = require('react-native-iap');
      await manager.purchaseCoinPack('large');
      expect(RNIap.requestPurchase).toHaveBeenCalledWith({
        request: { apple: { sku: CONSUMABLE_PRODUCTS.COINS_LARGE } },
        type: 'in-app',
      });
    });
  });

  describe('coin pack values', () => {
    it('should return correct coin value for small pack', () => {
      const value = manager.getCoinPackValue(CONSUMABLE_PRODUCTS.COINS_SMALL);
      expect(value).toBe(5000);
    });

    it('should return correct coin value for medium pack', () => {
      const value = manager.getCoinPackValue(CONSUMABLE_PRODUCTS.COINS_MEDIUM);
      expect(value).toBe(15000);
    });

    it('should return correct coin value for large pack', () => {
      const value = manager.getCoinPackValue(CONSUMABLE_PRODUCTS.COINS_LARGE);
      expect(value).toBe(40000);
    });

    it('should return 0 for unknown product', () => {
      const value = manager.getCoinPackValue('unknown.product');
      expect(value).toBe(0);
    });
  });

  describe('purchase detection', () => {
    it('should detect active subscription from purchases', () => {
      const purchases = [
        { productId: SUBSCRIPTION_PRODUCTS.MONTHLY_PASS, transactionReceipt: 'receipt' },
      ] as any[];

      expect(manager.hasActiveSubscription(purchases)).toBe(true);
    });

    it('should return false when no subscription', () => {
      const purchases = [
        { productId: NON_CONSUMABLE_PRODUCTS.REMOVE_ADS, transactionReceipt: 'receipt' },
      ] as any[];

      expect(manager.hasActiveSubscription(purchases)).toBe(false);
    });

    it('should detect remove ads purchase', () => {
      const purchases = [
        { productId: NON_CONSUMABLE_PRODUCTS.REMOVE_ADS, transactionReceipt: 'receipt' },
      ] as any[];

      expect(manager.hasRemoveAds(purchases)).toBe(true);
    });

    it('should return false when no remove ads', () => {
      const purchases = [
        { productId: CONSUMABLE_PRODUCTS.COINS_SMALL, transactionReceipt: 'receipt' },
      ] as any[];

      expect(manager.hasRemoveAds(purchases)).toBe(false);
    });
  });

  describe('restore purchases', () => {
    it('should call getAvailablePurchases', async () => {
      await manager.initialize();
      const RNIap = require('react-native-iap');

      await manager.restorePurchases();
      expect(RNIap.getAvailablePurchases).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should end connection and reset state', async () => {
      await manager.initialize();
      expect(manager.isInitialized()).toBe(true);

      await manager.endConnection();
      expect(manager.isInitialized()).toBe(false);
    });
  });
});
