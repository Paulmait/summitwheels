/**
 * Tests for IAP Keys
 */

import {
  NON_CONSUMABLE_PRODUCTS,
  SUBSCRIPTION_PRODUCTS,
  CONSUMABLE_PRODUCTS,
  COIN_PACK_VALUES,
  ALL_PRODUCT_IDS,
  ALL_SUBSCRIPTION_IDS,
  DISPLAY_PRICES,
} from '../iapKeys';

describe('IAP Keys', () => {
  describe('Product IDs', () => {
    it('should have correct Remove Ads product ID', () => {
      expect(NON_CONSUMABLE_PRODUCTS.REMOVE_ADS).toBe('com.cienrios.summitwheels.removeads');
    });

    it('should have correct subscription product IDs', () => {
      expect(SUBSCRIPTION_PRODUCTS.MONTHLY_PASS).toBe('com.cienrios.summitwheels.pass.monthly');
      expect(SUBSCRIPTION_PRODUCTS.YEARLY_PASS).toBe('com.cienrios.summitwheels.pass.yearly');
    });

    it('should have correct consumable product IDs', () => {
      expect(CONSUMABLE_PRODUCTS.COINS_SMALL).toBe('com.cienrios.summitwheels.coins.small');
      expect(CONSUMABLE_PRODUCTS.COINS_MEDIUM).toBe('com.cienrios.summitwheels.coins.medium');
      expect(CONSUMABLE_PRODUCTS.COINS_LARGE).toBe('com.cienrios.summitwheels.coins.large');
    });
  });

  describe('Coin Pack Values', () => {
    it('should have correct coin values for each pack', () => {
      expect(COIN_PACK_VALUES[CONSUMABLE_PRODUCTS.COINS_SMALL]).toBe(1000);
      expect(COIN_PACK_VALUES[CONSUMABLE_PRODUCTS.COINS_MEDIUM]).toBe(5000);
      expect(COIN_PACK_VALUES[CONSUMABLE_PRODUCTS.COINS_LARGE]).toBe(15000);
    });
  });

  describe('Product Arrays', () => {
    it('should include all non-subscription products in ALL_PRODUCT_IDS', () => {
      expect(ALL_PRODUCT_IDS).toContain(NON_CONSUMABLE_PRODUCTS.REMOVE_ADS);
      expect(ALL_PRODUCT_IDS).toContain(CONSUMABLE_PRODUCTS.COINS_SMALL);
      expect(ALL_PRODUCT_IDS).toContain(CONSUMABLE_PRODUCTS.COINS_MEDIUM);
      expect(ALL_PRODUCT_IDS).toContain(CONSUMABLE_PRODUCTS.COINS_LARGE);
    });

    it('should include all subscriptions in ALL_SUBSCRIPTION_IDS', () => {
      expect(ALL_SUBSCRIPTION_IDS).toContain(SUBSCRIPTION_PRODUCTS.MONTHLY_PASS);
      expect(ALL_SUBSCRIPTION_IDS).toContain(SUBSCRIPTION_PRODUCTS.YEARLY_PASS);
    });

    it('should have correct number of products', () => {
      expect(ALL_PRODUCT_IDS.length).toBe(4);
      expect(ALL_SUBSCRIPTION_IDS.length).toBe(2);
    });
  });

  describe('Display Prices', () => {
    it('should have display prices for all products', () => {
      expect(DISPLAY_PRICES[NON_CONSUMABLE_PRODUCTS.REMOVE_ADS]).toBe('$2.99');
      expect(DISPLAY_PRICES[SUBSCRIPTION_PRODUCTS.MONTHLY_PASS]).toBe('$4.99/mo');
      expect(DISPLAY_PRICES[SUBSCRIPTION_PRODUCTS.YEARLY_PASS]).toBe('$29.99/yr');
      expect(DISPLAY_PRICES[CONSUMABLE_PRODUCTS.COINS_SMALL]).toBe('$0.99');
      expect(DISPLAY_PRICES[CONSUMABLE_PRODUCTS.COINS_MEDIUM]).toBe('$4.99');
      expect(DISPLAY_PRICES[CONSUMABLE_PRODUCTS.COINS_LARGE]).toBe('$9.99');
    });
  });
});
