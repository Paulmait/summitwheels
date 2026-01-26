/**
 * Tests for AdService
 */

import { AdServiceClass } from '../AdService';
import { EntitlementService } from '../../services/EntitlementService';

// Mock EntitlementService
jest.mock('../../services/EntitlementService', () => ({
  EntitlementService: {
    hasNoAds: jest.fn(() => false),
  },
}));

describe('AdService', () => {
  let adService: AdServiceClass;

  beforeEach(() => {
    adService = new AdServiceClass();
    jest.clearAllMocks();
    (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(false);
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const result = await adService.initialize();
      expect(result).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await adService.initialize();
      const result = await adService.initialize();
      expect(result).toBe(true);
    });

    it('should set interstitial and rewarded as loaded after init', async () => {
      await adService.initialize();
      expect(adService.isInterstitialReady()).toBe(true);
      expect(adService.isRewardedReady()).toBe(true);
    });
  });

  describe('areAdsDisabled', () => {
    it('should return false when user has no entitlements', () => {
      (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(false);
      expect(adService.areAdsDisabled()).toBe(false);
    });

    it('should return true when user has noAds entitlement', () => {
      (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(true);
      expect(adService.areAdsDisabled()).toBe(true);
    });
  });

  describe('showInterstitial', () => {
    beforeEach(async () => {
      await adService.initialize();
      // Play enough games to trigger interstitial
      adService.recordGamePlayed();
      adService.recordGamePlayed();
      adService.recordGamePlayed();
    });

    it('should skip interstitial when noAds entitlement is active', async () => {
      (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(true);

      const result = await adService.showInterstitial();

      expect(result.shown).toBe(false);
      expect(result.skippedReason).toBe('noAds');
    });

    it('should show interstitial when allowed', async () => {
      const result = await adService.showInterstitial();

      expect(result.shown).toBe(true);
      expect(result.skippedReason).toBeUndefined();
    });

    it('should skip interstitial when not enough games played', async () => {
      adService._reset();
      await adService.initialize();
      adService.recordGamePlayed(); // Only 1 game

      const result = await adService.showInterstitial();

      expect(result.shown).toBe(false);
      expect(result.skippedReason).toBe('tooFrequent');
    });

    it('should skip interstitial when shown too recently', async () => {
      // Show first interstitial
      await adService.showInterstitial();

      // Wait a tiny bit for ad to "load"
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Play more games
      adService.recordGamePlayed();
      adService.recordGamePlayed();
      adService.recordGamePlayed();

      // Try to show again immediately
      const result = await adService.showInterstitial();

      expect(result.shown).toBe(false);
      expect(result.skippedReason).toBe('tooFrequent');
    });

    it('should reset games counter after showing interstitial', async () => {
      await adService.showInterstitial();

      expect(adService.getState().gamesSinceInterstitial).toBe(0);
    });
  });

  describe('showRewarded', () => {
    beforeEach(async () => {
      await adService.initialize();
    });

    it('should show rewarded ad and call callback', async () => {
      const onRewarded = jest.fn();

      const result = await adService.showRewarded(onRewarded);

      expect(result.completed).toBe(true);
      expect(result.reward).toBe(true);
      expect(onRewarded).toHaveBeenCalled();
    });

    it('should show rewarded ad even when noAds entitlement is active', async () => {
      (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(true);
      const onRewarded = jest.fn();

      const result = await adService.showRewarded(onRewarded);

      expect(result.completed).toBe(true);
      expect(onRewarded).toHaveBeenCalled();
    });

    it('should return error when ad not loaded', async () => {
      adService._reset();
      const onRewarded = jest.fn();

      const result = await adService.showRewarded(onRewarded);

      expect(result.completed).toBe(false);
      expect(result.error).toBe('Ad not loaded');
      expect(onRewarded).not.toHaveBeenCalled();
    });
  });

  describe('recordGamePlayed', () => {
    it('should increment games counter', () => {
      expect(adService.getState().gamesSinceInterstitial).toBe(0);

      adService.recordGamePlayed();
      expect(adService.getState().gamesSinceInterstitial).toBe(1);

      adService.recordGamePlayed();
      expect(adService.getState().gamesSinceInterstitial).toBe(2);
    });
  });

  describe('isInterstitialReady', () => {
    it('should return false when not initialized', () => {
      expect(adService.isInterstitialReady()).toBe(false);
    });

    it('should return true when initialized and no entitlement', async () => {
      await adService.initialize();
      expect(adService.isInterstitialReady()).toBe(true);
    });

    it('should return false when noAds entitlement is active', async () => {
      await adService.initialize();
      (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(true);
      expect(adService.isInterstitialReady()).toBe(false);
    });
  });

  describe('isRewardedReady', () => {
    it('should return false when not initialized', () => {
      expect(adService.isRewardedReady()).toBe(false);
    });

    it('should return true when initialized', async () => {
      await adService.initialize();
      expect(adService.isRewardedReady()).toBe(true);
    });

    it('should return true even when noAds entitlement is active', async () => {
      await adService.initialize();
      (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(true);
      expect(adService.isRewardedReady()).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return correct initial state', () => {
      const state = adService.getState();

      expect(state).toEqual({
        initialized: false,
        adsDisabled: false,
        interstitialReady: false,
        rewardedReady: false,
        gamesSinceInterstitial: 0,
      });
    });

    it('should return correct state after initialization', async () => {
      await adService.initialize();
      adService.recordGamePlayed();
      adService.recordGamePlayed();

      const state = adService.getState();

      expect(state).toEqual({
        initialized: true,
        adsDisabled: false,
        interstitialReady: true,
        rewardedReady: true,
        gamesSinceInterstitial: 2,
      });
    });

    it('should show adsDisabled when entitlement is active', async () => {
      await adService.initialize();
      (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(true);

      const state = adService.getState();

      expect(state.adsDisabled).toBe(true);
    });
  });
});
