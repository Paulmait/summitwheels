/**
 * Entitlement Service - Manages user entitlements from purchases
 *
 * Responsibilities:
 * - Track purchased entitlements (noAds, summitPass, coins)
 * - Persist entitlements with AsyncStorage
 * - Provide getters/setters for entitlement state
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@summit_wheels_entitlements';

export interface Entitlements {
  noAds: boolean;
  summitPass: boolean;
  coins: number;
}

const DEFAULT_ENTITLEMENTS: Entitlements = {
  noAds: false,
  summitPass: false,
  coins: 0,
};

/**
 * Entitlement Service singleton
 */
class EntitlementServiceClass {
  private _entitlements: Entitlements = { ...DEFAULT_ENTITLEMENTS };
  private _isLoaded = false;

  /**
   * Load entitlements from storage
   */
  async load(): Promise<Entitlements> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Entitlements>;
        this._entitlements = {
          noAds: parsed.noAds ?? DEFAULT_ENTITLEMENTS.noAds,
          summitPass: parsed.summitPass ?? DEFAULT_ENTITLEMENTS.summitPass,
          coins: parsed.coins ?? DEFAULT_ENTITLEMENTS.coins,
        };
      }
      this._isLoaded = true;
      return this._entitlements;
    } catch (error) {
      console.error('Failed to load entitlements:', error);
      this._isLoaded = true;
      return this._entitlements;
    }
  }

  /**
   * Save entitlements to storage
   */
  private async _save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this._entitlements));
    } catch (error) {
      console.error('Failed to save entitlements:', error);
    }
  }

  /**
   * Get current entitlements
   */
  getEntitlements(): Entitlements {
    return { ...this._entitlements };
  }

  /**
   * Check if entitlements have been loaded
   */
  isLoaded(): boolean {
    return this._isLoaded;
  }

  /**
   * Set a specific entitlement
   */
  async setEntitlement<K extends keyof Entitlements>(
    key: K,
    value: Entitlements[K]
  ): Promise<void> {
    this._entitlements[key] = value;
    await this._save();
  }

  /**
   * Add coins to the current balance
   */
  async addCoins(amount: number): Promise<number> {
    this._entitlements.coins += amount;
    await this._save();
    return this._entitlements.coins;
  }

  /**
   * Spend coins if sufficient balance
   * Returns true if successful, false if insufficient funds
   */
  async spendCoins(amount: number): Promise<boolean> {
    if (this._entitlements.coins < amount) {
      return false;
    }
    this._entitlements.coins -= amount;
    await this._save();
    return true;
  }

  /**
   * Check if user has no ads entitlement (either purchased or from subscription)
   */
  hasNoAds(): boolean {
    return this._entitlements.noAds || this._entitlements.summitPass;
  }

  /**
   * Check if user has active Summit Pass subscription
   */
  hasSummitPass(): boolean {
    return this._entitlements.summitPass;
  }

  /**
   * Get current coin balance
   */
  getCoins(): number {
    return this._entitlements.coins;
  }

  /**
   * Reset all entitlements (for debug/testing)
   */
  async reset(): Promise<void> {
    this._entitlements = { ...DEFAULT_ENTITLEMENTS };
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

// Export singleton instance
export const EntitlementService = new EntitlementServiceClass();

// Export class for testing
export { EntitlementServiceClass };
