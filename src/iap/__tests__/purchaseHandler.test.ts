/**
 * Tests for Purchase Handler
 */

import {
  handlePurchaseSuccess,
  handleRestorePurchases,
} from '../purchaseHandler';
import {
  NON_CONSUMABLE_PRODUCTS,
  SUBSCRIPTION_PRODUCTS,
  CONSUMABLE_PRODUCTS,
} from '../iapKeys';
import { EntitlementService } from '../../services/EntitlementService';

// Mock EntitlementService
jest.mock('../../services/EntitlementService', () => ({
  EntitlementService: {
    setEntitlement: jest.fn(() => Promise.resolve()),
    addCoins: jest.fn(() => Promise.resolve(0)),
  },
}));

// Mock IAPManager
jest.mock('../IAPManager', () => ({
  IAPManager: {
    setPurchaseCallbacks: jest.fn(),
  },
}));

describe('purchaseHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePurchaseSuccess', () => {
    it('should grant noAds entitlement for Remove Ads purchase', async () => {
      const purchase = {
        productId: NON_CONSUMABLE_PRODUCTS.REMOVE_ADS,
      } as any;

      await handlePurchaseSuccess(purchase);

      expect(EntitlementService.setEntitlement).toHaveBeenCalledWith('noAds', true);
    });

    it('should grant summitPass entitlement for Monthly Pass purchase', async () => {
      const purchase = {
        productId: SUBSCRIPTION_PRODUCTS.MONTHLY_PASS,
      } as any;

      await handlePurchaseSuccess(purchase);

      expect(EntitlementService.setEntitlement).toHaveBeenCalledWith('summitPass', true);
    });

    it('should grant summitPass entitlement for Yearly Pass purchase', async () => {
      const purchase = {
        productId: SUBSCRIPTION_PRODUCTS.YEARLY_PASS,
      } as any;

      await handlePurchaseSuccess(purchase);

      expect(EntitlementService.setEntitlement).toHaveBeenCalledWith('summitPass', true);
    });

    it('should add 1000 coins for small coin pack purchase', async () => {
      const purchase = {
        productId: CONSUMABLE_PRODUCTS.COINS_SMALL,
      } as any;

      await handlePurchaseSuccess(purchase);

      expect(EntitlementService.addCoins).toHaveBeenCalledWith(1000);
    });

    it('should add 5000 coins for medium coin pack purchase', async () => {
      const purchase = {
        productId: CONSUMABLE_PRODUCTS.COINS_MEDIUM,
      } as any;

      await handlePurchaseSuccess(purchase);

      expect(EntitlementService.addCoins).toHaveBeenCalledWith(5000);
    });

    it('should add 15000 coins for large coin pack purchase', async () => {
      const purchase = {
        productId: CONSUMABLE_PRODUCTS.COINS_LARGE,
      } as any;

      await handlePurchaseSuccess(purchase);

      expect(EntitlementService.addCoins).toHaveBeenCalledWith(15000);
    });

    it('should not throw for unknown product', async () => {
      const purchase = {
        productId: 'unknown.product',
      } as any;

      await expect(handlePurchaseSuccess(purchase)).resolves.not.toThrow();
    });
  });

  describe('handleRestorePurchases', () => {
    it('should restore noAds entitlement', async () => {
      const purchases = [
        { productId: NON_CONSUMABLE_PRODUCTS.REMOVE_ADS },
      ] as any[];

      const result = await handleRestorePurchases(purchases);

      expect(EntitlementService.setEntitlement).toHaveBeenCalledWith('noAds', true);
      expect(result.restoredNoAds).toBe(true);
      expect(result.restoredSubscription).toBe(false);
    });

    it('should restore subscription entitlement', async () => {
      const purchases = [
        { productId: SUBSCRIPTION_PRODUCTS.MONTHLY_PASS },
      ] as any[];

      const result = await handleRestorePurchases(purchases);

      expect(EntitlementService.setEntitlement).toHaveBeenCalledWith('summitPass', true);
      expect(result.restoredNoAds).toBe(false);
      expect(result.restoredSubscription).toBe(true);
    });

    it('should restore both noAds and subscription', async () => {
      const purchases = [
        { productId: NON_CONSUMABLE_PRODUCTS.REMOVE_ADS },
        { productId: SUBSCRIPTION_PRODUCTS.YEARLY_PASS },
      ] as any[];

      const result = await handleRestorePurchases(purchases);

      expect(EntitlementService.setEntitlement).toHaveBeenCalledWith('noAds', true);
      expect(EntitlementService.setEntitlement).toHaveBeenCalledWith('summitPass', true);
      expect(result.restoredNoAds).toBe(true);
      expect(result.restoredSubscription).toBe(true);
    });

    it('should NOT restore coins (consumables)', async () => {
      const purchases = [
        { productId: CONSUMABLE_PRODUCTS.COINS_SMALL },
        { productId: CONSUMABLE_PRODUCTS.COINS_LARGE },
      ] as any[];

      const result = await handleRestorePurchases(purchases);

      expect(EntitlementService.addCoins).not.toHaveBeenCalled();
      expect(result.restoredNoAds).toBe(false);
      expect(result.restoredSubscription).toBe(false);
    });

    it('should return false flags for empty purchases', async () => {
      const result = await handleRestorePurchases([]);

      expect(result.restoredNoAds).toBe(false);
      expect(result.restoredSubscription).toBe(false);
    });
  });
});
