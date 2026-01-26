/**
 * Purchase Handler - Connects IAP purchases to entitlement updates
 *
 * Handles the business logic of granting entitlements when purchases complete
 */

import { IAPManager, IAPPurchase } from './IAPManager';
import {
  NON_CONSUMABLE_PRODUCTS,
  SUBSCRIPTION_PRODUCTS,
  CONSUMABLE_PRODUCTS,
  COIN_PACK_VALUES,
  CoinPackId,
} from './iapKeys';
import { EntitlementService } from '../services/EntitlementService';

/**
 * Handle a successful purchase and update entitlements
 */
export async function handlePurchaseSuccess(purchase: IAPPurchase): Promise<void> {
  const { productId } = purchase;

  // Handle Remove Ads purchase
  if (productId === NON_CONSUMABLE_PRODUCTS.REMOVE_ADS) {
    await EntitlementService.setEntitlement('noAds', true);
    return;
  }

  // Handle subscription purchases
  if (
    productId === SUBSCRIPTION_PRODUCTS.MONTHLY_PASS ||
    productId === SUBSCRIPTION_PRODUCTS.YEARLY_PASS
  ) {
    await EntitlementService.setEntitlement('summitPass', true);
    return;
  }

  // Handle coin pack purchases
  const coinPackIds = Object.values(CONSUMABLE_PRODUCTS) as string[];
  if (coinPackIds.includes(productId)) {
    const coinAmount = COIN_PACK_VALUES[productId as CoinPackId] || 0;
    if (coinAmount > 0) {
      await EntitlementService.addCoins(coinAmount);
    }
    return;
  }

  console.warn('Unknown product purchased:', productId);
}

/**
 * Handle purchase restoration and update entitlements
 */
export async function handleRestorePurchases(purchases: IAPPurchase[]): Promise<{
  restoredNoAds: boolean;
  restoredSubscription: boolean;
}> {
  let restoredNoAds = false;
  let restoredSubscription = false;

  for (const purchase of purchases) {
    const { productId } = purchase;

    // Restore Remove Ads
    if (productId === NON_CONSUMABLE_PRODUCTS.REMOVE_ADS) {
      await EntitlementService.setEntitlement('noAds', true);
      restoredNoAds = true;
    }

    // Restore subscription (note: subscriptions need server validation for expiration)
    if (
      productId === SUBSCRIPTION_PRODUCTS.MONTHLY_PASS ||
      productId === SUBSCRIPTION_PRODUCTS.YEARLY_PASS
    ) {
      await EntitlementService.setEntitlement('summitPass', true);
      restoredSubscription = true;
    }

    // Note: Consumables are NOT restored (they're consumed immediately)
  }

  return { restoredNoAds, restoredSubscription };
}

/**
 * Initialize the purchase handler by setting up callbacks
 */
export function initializePurchaseHandler(): void {
  IAPManager.setPurchaseCallbacks(
    handlePurchaseSuccess,
    (error) => {
      console.error('Purchase failed:', error.message);
    }
  );
}
