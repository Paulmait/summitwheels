/**
 * Security Service - Protects game data integrity
 *
 * Provides:
 * - Coin balance integrity validation
 * - IAP receipt validation hooks
 * - Anti-tampering detection
 * - Secure storage with checksums
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SECURITY_KEY = '@summit_wheels_security';
const INTEGRITY_SALT = 'sw_2024_'; // In production, use a more secure method

type SecureData = {
  coins: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  lastValidated: number;
  checksum: string;
};

/**
 * Generate a simple checksum for data integrity
 * In production, use a more robust cryptographic hash
 */
function generateChecksum(coins: number, earned: number, spent: number): string {
  const data = `${INTEGRITY_SALT}${coins}_${earned}_${spent}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Validate checksum matches stored data
 */
function validateChecksum(data: SecureData): boolean {
  const expectedChecksum = generateChecksum(
    data.coins,
    data.totalCoinsEarned,
    data.totalCoinsSpent
  );
  return data.checksum === expectedChecksum;
}

/**
 * IAP Receipt validation result
 */
export type ReceiptValidationResult = {
  isValid: boolean;
  productId?: string;
  error?: string;
};

/**
 * Security Service singleton
 */
class SecurityServiceClass {
  private _secureData: SecureData | null = null;
  private _isLoaded = false;
  private _tamperDetected = false;

  /**
   * Load secure data from storage
   */
  async load(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SecureData;

        // Validate checksum
        if (!validateChecksum(parsed)) {
          console.warn('Security: Checksum mismatch detected');
          this._tamperDetected = true;
          // Reset to safe state
          this._secureData = this._createInitialData();
          await this._save();
        } else {
          this._secureData = parsed;
        }
      } else {
        this._secureData = this._createInitialData();
        await this._save();
      }

      this._isLoaded = true;
      return true;
    } catch (error) {
      console.error('Security: Failed to load:', error);
      this._secureData = this._createInitialData();
      this._isLoaded = true;
      return false;
    }
  }

  /**
   * Create initial secure data
   */
  private _createInitialData(): SecureData {
    const data: SecureData = {
      coins: 0,
      totalCoinsEarned: 0,
      totalCoinsSpent: 0,
      lastValidated: Date.now(),
      checksum: '',
    };
    data.checksum = generateChecksum(data.coins, data.totalCoinsEarned, data.totalCoinsSpent);
    return data;
  }

  /**
   * Save secure data with updated checksum
   */
  private async _save(): Promise<void> {
    if (!this._secureData) return;

    this._secureData.checksum = generateChecksum(
      this._secureData.coins,
      this._secureData.totalCoinsEarned,
      this._secureData.totalCoinsSpent
    );

    await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(this._secureData));
  }

  /**
   * Get verified coin balance
   */
  getVerifiedCoins(): number {
    if (!this._secureData) return 0;

    // Verify balance makes sense
    const expectedBalance = this._secureData.totalCoinsEarned - this._secureData.totalCoinsSpent;
    if (this._secureData.coins !== expectedBalance) {
      console.warn('Security: Balance mismatch detected');
      this._secureData.coins = Math.max(0, expectedBalance);
    }

    return this._secureData.coins;
  }

  /**
   * Add coins with tracking
   */
  async addCoins(amount: number, source: 'gameplay' | 'purchase' | 'reward' | 'achievement'): Promise<number> {
    if (!this._secureData || amount <= 0) return this.getVerifiedCoins();

    // Rate limit coin additions (anti-cheat)
    const now = Date.now();
    const timeSinceLastValidation = now - this._secureData.lastValidated;

    // If adding large amounts from gameplay too quickly, flag it
    if (source === 'gameplay' && amount > 1000 && timeSinceLastValidation < 10000) {
      console.warn('Security: Suspicious coin addition rate');
      // Allow but log for analytics
    }

    this._secureData.coins += amount;
    this._secureData.totalCoinsEarned += amount;
    this._secureData.lastValidated = now;

    await this._save();
    return this._secureData.coins;
  }

  /**
   * Spend coins with validation
   */
  async spendCoins(amount: number): Promise<boolean> {
    if (!this._secureData || amount <= 0) return false;

    if (this._secureData.coins < amount) {
      return false;
    }

    this._secureData.coins -= amount;
    this._secureData.totalCoinsSpent += amount;
    this._secureData.lastValidated = Date.now();

    await this._save();
    return true;
  }

  /**
   * Set coins directly (for IAP purchases)
   */
  async setCoinsFromPurchase(totalCoins: number, purchaseAmount: number): Promise<void> {
    if (!this._secureData) return;

    this._secureData.coins = totalCoins;
    this._secureData.totalCoinsEarned += purchaseAmount;
    this._secureData.lastValidated = Date.now();

    await this._save();
  }

  /**
   * Validate IAP receipt (client-side basic validation)
   * In production, this should call a server endpoint
   */
  async validateReceipt(
    receipt: string,
    productId: string,
    platform: 'ios' | 'android'
  ): Promise<ReceiptValidationResult> {
    // Basic client-side validation
    if (!receipt || receipt.length < 10) {
      return { isValid: false, error: 'Invalid receipt format' };
    }

    // In production, call your server here:
    // const response = await fetch('https://your-server.com/validate-receipt', {
    //   method: 'POST',
    //   body: JSON.stringify({ receipt, productId, platform }),
    // });
    // return response.json();

    // For now, trust the store's validation
    return {
      isValid: true,
      productId,
    };
  }

  /**
   * Check if tampering was detected
   */
  wasTamperDetected(): boolean {
    return this._tamperDetected;
  }

  /**
   * Get security stats for analytics
   */
  getStats(): {
    totalEarned: number;
    totalSpent: number;
    currentBalance: number;
    tamperDetected: boolean;
  } {
    return {
      totalEarned: this._secureData?.totalCoinsEarned ?? 0,
      totalSpent: this._secureData?.totalCoinsSpent ?? 0,
      currentBalance: this.getVerifiedCoins(),
      tamperDetected: this._tamperDetected,
    };
  }

  /**
   * Reset security data (for GDPR deletion)
   */
  async reset(): Promise<void> {
    this._secureData = this._createInitialData();
    this._tamperDetected = false;
    await AsyncStorage.removeItem(SECURITY_KEY);
  }
}

export const SecurityService = new SecurityServiceClass();
export { SecurityServiceClass };
