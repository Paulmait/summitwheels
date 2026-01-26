/**
 * Paywall Screen - In-App Purchase UI
 *
 * Displays all available products for purchase:
 * - Remove Ads (one-time)
 * - Summit Pass subscriptions (monthly/yearly)
 * - Coin packs (consumables)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { IAPManager, IAPProduct, IAPSubscription } from '../iap/IAPManager';
import {
  NON_CONSUMABLE_PRODUCTS,
  SUBSCRIPTION_PRODUCTS,
  CONSUMABLE_PRODUCTS,
  DISPLAY_PRICES,
  COIN_PACK_VALUES,
} from '../iap/iapKeys';
import { handleRestorePurchases } from '../iap/purchaseHandler';
import { EntitlementService } from '../services/EntitlementService';

interface PaywallScreenProps {
  onClose?: () => void;
}

type PurchaseType = 'removeAds' | 'monthlyPass' | 'yearlyPass' | 'coinsSmall' | 'coinsMedium' | 'coinsLarge';

export function PaywallScreen({ onClose }: PaywallScreenProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<PurchaseType | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [hasNoAds, setHasNoAds] = useState(false);
  const [hasSummitPass, setHasSummitPass] = useState(false);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    initializeIAP();
    loadEntitlements();
  }, []);

  const initializeIAP = async () => {
    setIsLoading(true);
    await IAPManager.initialize();
    setIsLoading(false);
  };

  const loadEntitlements = async () => {
    await EntitlementService.load();
    setHasNoAds(EntitlementService.hasNoAds());
    setHasSummitPass(EntitlementService.hasSummitPass());
    setCoins(EntitlementService.getCoins());
  };

  const handlePurchase = async (type: PurchaseType) => {
    setIsPurchasing(type);
    try {
      let result;
      switch (type) {
        case 'removeAds':
          result = await IAPManager.purchaseRemoveAds();
          break;
        case 'monthlyPass':
          result = await IAPManager.purchaseMonthlyPass();
          break;
        case 'yearlyPass':
          result = await IAPManager.purchaseYearlyPass();
          break;
        case 'coinsSmall':
          result = await IAPManager.purchaseCoinPack('small');
          break;
        case 'coinsMedium':
          result = await IAPManager.purchaseCoinPack('medium');
          break;
        case 'coinsLarge':
          result = await IAPManager.purchaseCoinPack('large');
          break;
      }

      if (result?.success) {
        await loadEntitlements();
        Alert.alert('Success', 'Purchase completed!');
      } else if (result?.error) {
        Alert.alert('Purchase Failed', result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purchase failed';
      Alert.alert('Error', message);
    } finally {
      setIsPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const purchases = await IAPManager.restorePurchases();
      const { restoredNoAds, restoredSubscription } = await handleRestorePurchases(purchases);

      await loadEntitlements();

      if (restoredNoAds || restoredSubscription) {
        const items: string[] = [];
        if (restoredNoAds) items.push('Remove Ads');
        if (restoredSubscription) items.push('Summit Pass');
        Alert.alert('Restored', `Restored: ${items.join(', ')}`);
      } else {
        Alert.alert('No Purchases', 'No previous purchases found to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const getProductPrice = (productId: string): string => {
    const product = IAPManager.getProduct(productId);
    return product?.displayPrice || DISPLAY_PRICES[productId as keyof typeof DISPLAY_PRICES] || 'N/A';
  };

  const getSubscriptionPrice = (subscriptionId: string): string => {
    const subscription = IAPManager.getSubscription(subscriptionId);
    return subscription?.displayPrice || DISPLAY_PRICES[subscriptionId as keyof typeof DISPLAY_PRICES] || 'N/A';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Current Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusText}>Coins: {coins.toLocaleString()}</Text>
          {hasSummitPass && <Text style={styles.statusBadge}>Summit Pass Active</Text>}
          {hasNoAds && !hasSummitPass && <Text style={styles.statusBadge}>Ads Removed</Text>}
        </View>

        {/* Remove Ads Section */}
        {!hasNoAds && !hasSummitPass && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Remove Ads</Text>
            <TouchableOpacity
              style={[styles.purchaseButton, isPurchasing === 'removeAds' && styles.purchaseButtonDisabled]}
              onPress={() => handlePurchase('removeAds')}
              disabled={isPurchasing !== null}
            >
              {isPurchasing === 'removeAds' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.purchaseButtonText}>Remove Ads</Text>
                  <Text style={styles.priceText}>{getProductPrice(NON_CONSUMABLE_PRODUCTS.REMOVE_ADS)}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Summit Pass Section */}
        {!hasSummitPass && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summit Pass</Text>
            <Text style={styles.sectionDescription}>
              No ads + bonus coins on pickups + exclusive content
            </Text>

            <View style={styles.subscriptionOptions}>
              <TouchableOpacity
                style={[styles.subscriptionButton, isPurchasing === 'monthlyPass' && styles.purchaseButtonDisabled]}
                onPress={() => handlePurchase('monthlyPass')}
                disabled={isPurchasing !== null}
              >
                {isPurchasing === 'monthlyPass' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.subscriptionTitle}>Monthly</Text>
                    <Text style={styles.priceText}>
                      {getSubscriptionPrice(SUBSCRIPTION_PRODUCTS.MONTHLY_PASS)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subscriptionButton,
                  styles.subscriptionButtonBest,
                  isPurchasing === 'yearlyPass' && styles.purchaseButtonDisabled,
                ]}
                onPress={() => handlePurchase('yearlyPass')}
                disabled={isPurchasing !== null}
              >
                {isPurchasing === 'yearlyPass' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.bestValueBadge}>Best Value</Text>
                    <Text style={styles.subscriptionTitle}>Yearly</Text>
                    <Text style={styles.priceText}>
                      {getSubscriptionPrice(SUBSCRIPTION_PRODUCTS.YEARLY_PASS)}
                    </Text>
                    <Text style={styles.savingsText}>Save 50%</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Coin Packs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coin Packs</Text>

          <View style={styles.coinPacksContainer}>
            {/* Small Pack */}
            <TouchableOpacity
              style={[styles.coinPackButton, isPurchasing === 'coinsSmall' && styles.purchaseButtonDisabled]}
              onPress={() => handlePurchase('coinsSmall')}
              disabled={isPurchasing !== null}
            >
              {isPurchasing === 'coinsSmall' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.coinPackAmount}>
                    {COIN_PACK_VALUES[CONSUMABLE_PRODUCTS.COINS_SMALL].toLocaleString()}
                  </Text>
                  <Text style={styles.coinPackLabel}>coins</Text>
                  <Text style={styles.priceText}>{getProductPrice(CONSUMABLE_PRODUCTS.COINS_SMALL)}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Medium Pack */}
            <TouchableOpacity
              style={[styles.coinPackButton, isPurchasing === 'coinsMedium' && styles.purchaseButtonDisabled]}
              onPress={() => handlePurchase('coinsMedium')}
              disabled={isPurchasing !== null}
            >
              {isPurchasing === 'coinsMedium' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.coinPackAmount}>
                    {COIN_PACK_VALUES[CONSUMABLE_PRODUCTS.COINS_MEDIUM].toLocaleString()}
                  </Text>
                  <Text style={styles.coinPackLabel}>coins</Text>
                  <Text style={styles.priceText}>{getProductPrice(CONSUMABLE_PRODUCTS.COINS_MEDIUM)}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Large Pack */}
            <TouchableOpacity
              style={[
                styles.coinPackButton,
                styles.coinPackButtonBest,
                isPurchasing === 'coinsLarge' && styles.purchaseButtonDisabled,
              ]}
              onPress={() => handlePurchase('coinsLarge')}
              disabled={isPurchasing !== null}
            >
              {isPurchasing === 'coinsLarge' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.coinPackBadge}>Best Value</Text>
                  <Text style={styles.coinPackAmount}>
                    {COIN_PACK_VALUES[CONSUMABLE_PRODUCTS.COINS_LARGE].toLocaleString()}
                  </Text>
                  <Text style={styles.coinPackLabel}>coins</Text>
                  <Text style={styles.priceText}>{getProductPrice(CONSUMABLE_PRODUCTS.COINS_LARGE)}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={[styles.restoreButton, isRestoring && styles.restoreButtonDisabled]}
          onPress={handleRestore}
          disabled={isRestoring || isPurchasing !== null}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  statusText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#252545',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 12,
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriptionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  subscriptionButton: {
    flex: 1,
    backgroundColor: '#3f51b5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  subscriptionButtonBest: {
    backgroundColor: '#7c4dff',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  subscriptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bestValueBadge: {
    backgroundColor: '#FFD700',
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  savingsText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 4,
  },
  coinPacksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  coinPackButton: {
    flex: 1,
    backgroundColor: '#ff9800',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  coinPackButtonBest: {
    backgroundColor: '#f57c00',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  coinPackBadge: {
    backgroundColor: '#FFD700',
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  coinPackAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coinPackLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  restoreButtonDisabled: {
    opacity: 0.6,
  },
  restoreButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default PaywallScreen;
