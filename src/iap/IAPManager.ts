/**
 * IAP Manager - Handles all in-app purchase operations
 *
 * Responsibilities:
 * - Initialize connection to app stores
 * - Fetch products and subscriptions
 * - Handle purchases
 * - Restore purchases
 */

import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import type { Product, ProductSubscription, Purchase, PurchaseError, EventSubscription } from 'react-native-iap';
import {
  ALL_PRODUCT_IDS,
  ALL_SUBSCRIPTION_IDS,
  NON_CONSUMABLE_PRODUCTS,
  SUBSCRIPTION_PRODUCTS,
  CONSUMABLE_PRODUCTS,
  COIN_PACK_VALUES,
  CoinPackId,
} from './iapKeys';

export type IAPProduct = Product;
export type IAPSubscription = ProductSubscription;
export type IAPPurchase = Purchase;

export type PurchaseResult = {
  success: boolean;
  productId: string;
  transactionId?: string;
  error?: string;
};

export type IAPManagerState = {
  isInitialized: boolean;
  products: IAPProduct[];
  subscriptions: IAPSubscription[];
  isLoading: boolean;
  error: string | null;
};

/**
 * IAP Manager singleton
 */
class IAPManagerClass {
  private _isInitialized = false;
  private _products: IAPProduct[] = [];
  private _subscriptions: IAPSubscription[] = [];
  private _purchaseUpdateSubscription: EventSubscription | null = null;
  private _purchaseErrorSubscription: EventSubscription | null = null;
  private _onPurchaseSuccess: ((purchase: IAPPurchase) => void) | null = null;
  private _onPurchaseError: ((error: PurchaseError) => void) | null = null;

  /**
   * Initialize IAP connection
   */
  async initialize(): Promise<boolean> {
    if (this._isInitialized) {
      return true;
    }

    try {
      // Initialize connection
      await RNIap.initConnection();

      // Clear transactions (iOS)
      if (Platform.OS === 'ios') {
        await RNIap.clearTransactionIOS?.().catch(() => {});
      }

      // Fetch products
      await this.fetchProductsFromStore();

      // Set up purchase listeners
      this._setupListeners();

      this._isInitialized = true;
      return true;
    } catch (error) {
      console.error('IAP initialization failed:', error);
      return false;
    }
  }

  /**
   * Fetch all products and subscriptions from store
   */
  async fetchProductsFromStore(): Promise<void> {
    try {
      // Fetch regular products (in-app purchases)
      const products = await RNIap.fetchProducts({ skus: [...ALL_PRODUCT_IDS], type: 'in-app' });
      this._products = (products || []) as IAPProduct[];

      // Fetch subscriptions
      const subscriptions = await RNIap.fetchProducts({ skus: [...ALL_SUBSCRIPTION_IDS], type: 'subs' });
      this._subscriptions = (subscriptions || []) as IAPSubscription[];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  /**
   * Set up purchase listeners
   */
  private _setupListeners(): void {
    this._purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: IAPPurchase) => {
        const token = purchase.purchaseToken;

        if (token) {
          // Finish the transaction
          try {
            await RNIap.finishTransaction({ purchase, isConsumable: this._isConsumable(purchase.productId) });
            this._onPurchaseSuccess?.(purchase);
          } catch (error) {
            console.error('Failed to finish transaction:', error);
          }
        }
      }
    );

    this._purchaseErrorSubscription = RNIap.purchaseErrorListener(
      (error: PurchaseError) => {
        console.error('Purchase error:', error);
        this._onPurchaseError?.(error);
      }
    );
  }

  /**
   * Check if product is consumable
   */
  private _isConsumable(productId: string): boolean {
    return Object.values(CONSUMABLE_PRODUCTS).includes(productId as CoinPackId);
  }

  /**
   * Set purchase callbacks
   */
  setPurchaseCallbacks(
    onSuccess: (purchase: IAPPurchase) => void,
    onError: (error: PurchaseError) => void
  ): void {
    this._onPurchaseSuccess = onSuccess;
    this._onPurchaseError = onError;
  }

  /**
   * Get products
   */
  getProducts(): IAPProduct[] {
    return this._products;
  }

  /**
   * Get subscriptions
   */
  getSubscriptions(): IAPSubscription[] {
    return this._subscriptions;
  }

  /**
   * Get product by ID
   */
  getProduct(productId: string): IAPProduct | undefined {
    return this._products.find((p) => p.id === productId);
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): IAPSubscription | undefined {
    return this._subscriptions.find((s) => s.id === subscriptionId);
  }

  /**
   * Purchase Remove Ads
   */
  async purchaseRemoveAds(): Promise<PurchaseResult> {
    return this._requestPurchase(NON_CONSUMABLE_PRODUCTS.REMOVE_ADS);
  }

  /**
   * Purchase Monthly Pass
   */
  async purchaseMonthlyPass(): Promise<PurchaseResult> {
    return this._requestSubscription(SUBSCRIPTION_PRODUCTS.MONTHLY_PASS);
  }

  /**
   * Purchase Yearly Pass
   */
  async purchaseYearlyPass(): Promise<PurchaseResult> {
    return this._requestSubscription(SUBSCRIPTION_PRODUCTS.YEARLY_PASS);
  }

  /**
   * Purchase Coin Pack
   */
  async purchaseCoinPack(size: 'small' | 'medium' | 'large'): Promise<PurchaseResult> {
    const productId = CONSUMABLE_PRODUCTS[`COINS_${size.toUpperCase()}` as keyof typeof CONSUMABLE_PRODUCTS];
    return this._requestPurchase(productId);
  }

  /**
   * Get coin amount for a coin pack
   */
  getCoinPackValue(productId: string): number {
    return COIN_PACK_VALUES[productId as CoinPackId] || 0;
  }

  /**
   * Request a product purchase
   */
  private async _requestPurchase(productId: string): Promise<PurchaseResult> {
    try {
      const request = Platform.OS === 'ios'
        ? { apple: { sku: productId } }
        : { google: { skus: [productId] } };

      await RNIap.requestPurchase({ request, type: 'in-app' });
      return {
        success: true,
        productId,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Purchase failed';
      return {
        success: false,
        productId,
        error: errorMessage,
      };
    }
  }

  /**
   * Request a subscription purchase
   */
  private async _requestSubscription(subscriptionId: string): Promise<PurchaseResult> {
    try {
      const request = Platform.OS === 'ios'
        ? { apple: { sku: subscriptionId } }
        : { google: { skus: [subscriptionId] } };

      await RNIap.requestPurchase({ request, type: 'subs' });
      return {
        success: true,
        productId: subscriptionId,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Subscription failed';
      return {
        success: false,
        productId: subscriptionId,
        error: errorMessage,
      };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<IAPPurchase[]> {
    try {
      const purchases = await RNIap.getAvailablePurchases();
      return purchases;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return [];
    }
  }

  /**
   * Check if user has active subscription
   */
  hasActiveSubscription(purchases: IAPPurchase[]): boolean {
    return purchases.some(
      (p) =>
        p.productId === SUBSCRIPTION_PRODUCTS.MONTHLY_PASS ||
        p.productId === SUBSCRIPTION_PRODUCTS.YEARLY_PASS
    );
  }

  /**
   * Check if user has Remove Ads
   */
  hasRemoveAds(purchases: IAPPurchase[]): boolean {
    return purchases.some((p) => p.productId === NON_CONSUMABLE_PRODUCTS.REMOVE_ADS);
  }

  /**
   * End connection and clean up
   */
  async endConnection(): Promise<void> {
    this._purchaseUpdateSubscription?.remove();
    this._purchaseErrorSubscription?.remove();
    await RNIap.endConnection();
    this._isInitialized = false;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }
}

// Export singleton instance
export const IAPManager = new IAPManagerClass();

// Export for testing
export { IAPManagerClass };
