/**
 * Ad Service - Manages ad display with entitlement awareness
 *
 * Responsibilities:
 * - Show interstitial ads (respects noAds entitlement)
 * - Show rewarded ads (always allowed for users who opt-in)
 * - Track ad state and frequency
 */

import { EntitlementService } from '../services/EntitlementService';

// Ad config
const AD_CONFIG = {
  // Minimum games between interstitial ads
  minGamesBetweenInterstitials: 3,
  // Minimum time between interstitial ads (ms)
  minTimeBetweenInterstitials: 120000, // 2 minutes
};

// Ad result types
export type InterstitialResult = {
  shown: boolean;
  skippedReason?: 'noAds' | 'tooFrequent' | 'notLoaded' | 'error';
};

export type RewardedResult = {
  completed: boolean;
  reward?: boolean;
  error?: string;
};

/**
 * Ad Service singleton
 */
class AdServiceClass {
  private _isInitialized = false;
  private _interstitialLoaded = false;
  private _rewardedLoaded = false;
  private _lastInterstitialTime = 0;
  private _gamesSinceInterstitial = 0;
  private _onRewardedComplete: ((success: boolean) => void) | null = null;

  /**
   * Initialize the ad service
   * In a real implementation, this would initialize the ad SDK
   */
  async initialize(): Promise<boolean> {
    if (this._isInitialized) {
      return true;
    }

    try {
      // In production, this would initialize AdMob/Unity Ads/etc
      // For now, simulate successful initialization
      this._isInitialized = true;
      this._interstitialLoaded = true;
      this._rewardedLoaded = true;
      return true;
    } catch (error) {
      console.error('Ad service initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if ads are disabled for user
   */
  areAdsDisabled(): boolean {
    return EntitlementService.hasNoAds();
  }

  /**
   * Record that a game was played (for frequency capping)
   */
  recordGamePlayed(): void {
    this._gamesSinceInterstitial++;
  }

  /**
   * Check if enough games have been played for interstitial
   */
  private _shouldShowInterstitial(): boolean {
    // Check minimum games requirement
    if (this._gamesSinceInterstitial < AD_CONFIG.minGamesBetweenInterstitials) {
      return false;
    }

    // Check minimum time requirement
    const now = Date.now();
    if (now - this._lastInterstitialTime < AD_CONFIG.minTimeBetweenInterstitials) {
      return false;
    }

    return true;
  }

  /**
   * Show interstitial ad if allowed
   * Respects noAds entitlement and frequency caps
   */
  async showInterstitial(): Promise<InterstitialResult> {
    // Check if user has noAds entitlement
    if (this.areAdsDisabled()) {
      return { shown: false, skippedReason: 'noAds' };
    }

    // Check frequency caps
    if (!this._shouldShowInterstitial()) {
      return { shown: false, skippedReason: 'tooFrequent' };
    }

    // Check if ad is loaded
    if (!this._interstitialLoaded) {
      return { shown: false, skippedReason: 'notLoaded' };
    }

    try {
      // In production, this would show the actual ad
      // Simulate showing ad
      this._lastInterstitialTime = Date.now();
      this._gamesSinceInterstitial = 0;

      // Preload next interstitial
      this._loadInterstitial();

      return { shown: true };
    } catch (error) {
      console.error('Failed to show interstitial:', error);
      return { shown: false, skippedReason: 'error' };
    }
  }

  /**
   * Load an interstitial ad
   */
  private _loadInterstitial(): void {
    // In production, this would request an ad from the network
    // Simulate ad loading
    this._interstitialLoaded = false;
    setTimeout(() => {
      this._interstitialLoaded = true;
    }, 1000);
  }

  /**
   * Show rewarded ad
   * Always allowed - user opts in to watch for rewards
   */
  async showRewarded(onRewarded: () => void): Promise<RewardedResult> {
    // Check if ad is loaded
    if (!this._rewardedLoaded) {
      return { completed: false, error: 'Ad not loaded' };
    }

    try {
      // Store callback for when ad completes
      this._onRewardedComplete = (success) => {
        if (success) {
          onRewarded();
        }
        this._onRewardedComplete = null;
      };

      // In production, this would show the actual rewarded ad
      // For simulation, immediately grant reward
      this._onRewardedComplete?.(true);

      // Preload next rewarded ad
      this._loadRewarded();

      return { completed: true, reward: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to show rewarded ad:', errorMessage);
      return { completed: false, error: errorMessage };
    }
  }

  /**
   * Load a rewarded ad
   */
  private _loadRewarded(): void {
    // In production, this would request an ad from the network
    // Simulate ad loading
    this._rewardedLoaded = false;
    setTimeout(() => {
      this._rewardedLoaded = true;
    }, 1000);
  }

  /**
   * Check if interstitial ad is ready
   */
  isInterstitialReady(): boolean {
    return this._interstitialLoaded && !this.areAdsDisabled();
  }

  /**
   * Check if rewarded ad is ready
   */
  isRewardedReady(): boolean {
    return this._rewardedLoaded;
  }

  /**
   * Get current ad state (for debugging)
   */
  getState(): {
    initialized: boolean;
    adsDisabled: boolean;
    interstitialReady: boolean;
    rewardedReady: boolean;
    gamesSinceInterstitial: number;
  } {
    return {
      initialized: this._isInitialized,
      adsDisabled: this.areAdsDisabled(),
      interstitialReady: this._interstitialLoaded,
      rewardedReady: this._rewardedLoaded,
      gamesSinceInterstitial: this._gamesSinceInterstitial,
    };
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this._isInitialized = false;
    this._interstitialLoaded = false;
    this._rewardedLoaded = false;
    this._lastInterstitialTime = 0;
    this._gamesSinceInterstitial = 0;
    this._onRewardedComplete = null;
  }
}

// Export singleton instance
export const AdService = new AdServiceClass();

// Export class for testing
export { AdServiceClass };
