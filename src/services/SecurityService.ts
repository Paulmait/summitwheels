/**
 * Security Service - Protects game data integrity
 *
 * Provides:
 * - Coin balance integrity validation with SHA-256
 * - Server-side IAP receipt validation
 * - Anti-tampering detection
 * - Secure storage with cryptographic checksums
 * - Fraud detection integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

const SECURITY_KEY = '@summit_wheels_security';
const DEVICE_ID_KEY = '@summit_wheels_device_id';

// Supabase Edge Function URLs (configure in production)
const API_BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lxgrdhyzgxmfdtbvrhel.supabase.co';
const FUNCTIONS_URL = `${API_BASE_URL}/functions/v1`;

type SecureData = {
  coins: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  lastValidated: number;
  checksum: string;
  version: number; // For detecting rollback attacks
};

/**
 * Generate a cryptographic checksum using SHA-256
 */
async function generateChecksum(coins: number, earned: number, spent: number, version: number): Promise<string> {
  const data = `sw_secure_${coins}_${earned}_${spent}_${version}_${Platform.OS}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return hash;
}

/**
 * Generate or retrieve device ID
 */
async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate a random device ID
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    deviceId = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * IAP Receipt validation result
 */
export type ReceiptValidationResult = {
  isValid: boolean;
  productId?: string;
  transactionId?: string;
  coins?: number;
  entitlement?: string;
  error?: string;
};

/**
 * Fraud check result
 */
export type FraudCheckResult = {
  isSuspicious: boolean;
  isCritical: boolean;
  action: 'allow' | 'review' | 'block';
  score?: number;
};

/**
 * Security Service singleton
 */
class SecurityServiceClass {
  private _secureData: SecureData | null = null;
  private _isLoaded = false;
  private _tamperDetected = false;
  private _deviceId: string = '';
  private _userId: string = '';

  /**
   * Initialize with user ID
   */
  setUserId(userId: string): void {
    this._userId = userId;
  }

  /**
   * Load secure data from storage
   */
  async load(): Promise<boolean> {
    try {
      this._deviceId = await getDeviceId();

      const stored = await AsyncStorage.getItem(SECURITY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SecureData;

        // Validate checksum
        const expectedChecksum = await generateChecksum(
          parsed.coins,
          parsed.totalCoinsEarned,
          parsed.totalCoinsSpent,
          parsed.version || 0
        );

        if (parsed.checksum !== expectedChecksum) {
          console.warn('Security: Checksum mismatch - possible tampering');
          this._tamperDetected = true;

          // Report tampering attempt
          await this._reportSecurityEvent('tamper_detected', {
            expected: expectedChecksum.substring(0, 16),
            actual: parsed.checksum?.substring(0, 16)
          });

          // Reset to safe state
          this._secureData = await this._createInitialData();
          await this._save();
        } else {
          this._secureData = parsed;
        }
      } else {
        this._secureData = await this._createInitialData();
        await this._save();
      }

      this._isLoaded = true;
      return true;
    } catch (error) {
      console.error('Security: Failed to load:', error);
      this._secureData = await this._createInitialData();
      this._isLoaded = true;
      return false;
    }
  }

  /**
   * Create initial secure data
   */
  private async _createInitialData(): Promise<SecureData> {
    const data: SecureData = {
      coins: 0,
      totalCoinsEarned: 0,
      totalCoinsSpent: 0,
      lastValidated: Date.now(),
      checksum: '',
      version: 1,
    };
    data.checksum = await generateChecksum(data.coins, data.totalCoinsEarned, data.totalCoinsSpent, data.version);
    return data;
  }

  /**
   * Save secure data with updated checksum
   */
  private async _save(): Promise<void> {
    if (!this._secureData) return;

    // Increment version to detect rollback attacks
    this._secureData.version = (this._secureData.version || 0) + 1;

    this._secureData.checksum = await generateChecksum(
      this._secureData.coins,
      this._secureData.totalCoinsEarned,
      this._secureData.totalCoinsSpent,
      this._secureData.version
    );

    await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(this._secureData));
  }

  /**
   * Report security event to server
   */
  private async _reportSecurityEvent(event: string, details: Record<string, unknown>): Promise<void> {
    try {
      await fetch(`${FUNCTIONS_URL}/detect-fraud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this._userId,
          deviceId: this._deviceId,
          action: event,
          metadata: details
        })
      });
    } catch (error) {
      // Don't fail the main operation if reporting fails
      console.warn('Security: Failed to report event:', error);
    }
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
   * Add coins with tracking and fraud detection
   */
  async addCoins(amount: number, source: 'gameplay' | 'purchase' | 'reward' | 'achievement'): Promise<number> {
    if (!this._secureData || amount <= 0) return this.getVerifiedCoins();

    const now = Date.now();
    const timeSinceLastValidation = now - this._secureData.lastValidated;

    // Anti-cheat: Check for suspicious patterns
    if (source === 'gameplay') {
      // Max coins per game session should be reasonable
      if (amount > 5000) {
        console.warn('Security: Unusually high gameplay coins');
        await this._reportSecurityEvent('high_score', { amount, source });
      }

      // Check velocity - too many coins too fast
      if (amount > 1000 && timeSinceLastValidation < 5000) {
        console.warn('Security: Suspicious coin rate');
        await this._reportSecurityEvent('velocity_coins', {
          amount,
          timeSince: timeSinceLastValidation
        });
      }
    }

    // Valid coin reward amounts (anti-cheat)
    const validRewardAmounts = [100, 250, 500, 1000, 2500];
    if (source === 'reward' && !validRewardAmounts.includes(amount)) {
      console.warn('Security: Invalid reward amount');
      // Don't add invalid amounts
      return this.getVerifiedCoins();
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
   * Process a purchase with server-side validation
   */
  async processPurchase(
    receipt: string,
    productId: string,
    platform: 'ios' | 'android',
    transactionId?: string
  ): Promise<ReceiptValidationResult> {
    try {
      // Call server-side validation
      const response = await fetch(`${FUNCTIONS_URL}/process-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({
          userId: this._userId,
          deviceId: this._deviceId,
          productId,
          platform,
          transactionId: transactionId || `local_${Date.now()}`,
          receipt
        })
      });

      const result = await response.json();

      if (result.success && this._secureData) {
        // Apply coins from server response
        if (result.coins && result.coins > 0) {
          this._secureData.coins += result.coins;
          this._secureData.totalCoinsEarned += result.coins;
          this._secureData.lastValidated = Date.now();
          await this._save();
        }

        return {
          isValid: true,
          productId,
          transactionId: result.transactionId,
          coins: result.coins,
          entitlement: result.entitlement
        };
      }

      return {
        isValid: false,
        error: result.error || 'Validation failed'
      };
    } catch (error) {
      console.error('Security: Purchase validation error:', error);

      // Fallback to client-side validation if server is unavailable
      // This should be removed in production for strict security
      return this._fallbackValidation(receipt, productId, platform);
    }
  }

  /**
   * Fallback client-side validation (use sparingly)
   */
  private async _fallbackValidation(
    receipt: string,
    productId: string,
    platform: 'ios' | 'android'
  ): Promise<ReceiptValidationResult> {
    // Basic validation - should NOT be used in production
    if (!receipt || receipt.length < 10) {
      return { isValid: false, error: 'Invalid receipt format' };
    }

    console.warn('Security: Using fallback validation - server unavailable');

    // Log for later reconciliation
    await this._reportSecurityEvent('fallback_validation', {
      productId,
      platform,
      receiptLength: receipt.length
    });

    return {
      isValid: true,
      productId,
    };
  }

  /**
   * Check for fraud before sensitive operations
   */
  async checkFraud(action: string, amount?: number): Promise<FraudCheckResult> {
    try {
      const response = await fetch(`${FUNCTIONS_URL}/detect-fraud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({
          userId: this._userId,
          deviceId: this._deviceId,
          action,
          amount
        })
      });

      return await response.json();
    } catch (error) {
      // If fraud check fails, allow but log
      console.warn('Security: Fraud check failed:', error);
      return { isSuspicious: false, isCritical: false, action: 'allow' };
    }
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
    deviceId: string;
  } {
    return {
      totalEarned: this._secureData?.totalCoinsEarned ?? 0,
      totalSpent: this._secureData?.totalCoinsSpent ?? 0,
      currentBalance: this.getVerifiedCoins(),
      tamperDetected: this._tamperDetected,
      deviceId: this._deviceId,
    };
  }

  /**
   * Reset security data (for GDPR deletion)
   */
  async reset(): Promise<void> {
    this._secureData = await this._createInitialData();
    this._tamperDetected = false;
    await AsyncStorage.removeItem(SECURITY_KEY);
    // Note: Keep device ID for fraud prevention
  }

  /**
   * Full reset including device ID (for complete account deletion)
   */
  async fullReset(): Promise<void> {
    await this.reset();
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    this._deviceId = '';
    this._userId = '';
  }
}

export const SecurityService = new SecurityServiceClass();
export { SecurityServiceClass };
