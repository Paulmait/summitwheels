/**
 * Tests for PaywallScreen
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PaywallScreen } from '../PaywallScreen';
import { IAPManager } from '../../iap/IAPManager';
import { EntitlementService } from '../../services/EntitlementService';
import { handleRestorePurchases } from '../../iap/purchaseHandler';
import { Alert } from 'react-native';

// Mock IAPManager
jest.mock('../../iap/IAPManager', () => ({
  IAPManager: {
    initialize: jest.fn(() => Promise.resolve(true)),
    getProducts: jest.fn(() => []),
    getSubscriptions: jest.fn(() => []),
    getProduct: jest.fn(() => null),
    getSubscription: jest.fn(() => null),
    purchaseRemoveAds: jest.fn(() => Promise.resolve({ success: true })),
    purchaseMonthlyPass: jest.fn(() => Promise.resolve({ success: true })),
    purchaseYearlyPass: jest.fn(() => Promise.resolve({ success: true })),
    purchaseCoinPack: jest.fn(() => Promise.resolve({ success: true })),
    restorePurchases: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock EntitlementService
jest.mock('../../services/EntitlementService', () => ({
  EntitlementService: {
    load: jest.fn(() => Promise.resolve()),
    hasNoAds: jest.fn(() => false),
    hasSummitPass: jest.fn(() => false),
    getCoins: jest.fn(() => 5000),
  },
}));

// Mock purchaseHandler
jest.mock('../../iap/purchaseHandler', () => ({
  handleRestorePurchases: jest.fn(() =>
    Promise.resolve({ restoredNoAds: false, restoredSubscription: false })
  ),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('PaywallScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(false);
    (EntitlementService.hasSummitPass as jest.Mock).mockReturnValue(false);
    (EntitlementService.getCoins as jest.Mock).mockReturnValue(5000);
  });

  it('should render loading state initially', () => {
    const { getByText } = render(<PaywallScreen />);

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should render shop title after loading', async () => {
    const { getByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(getByText('Shop')).toBeTruthy();
    });
  });

  it('should display current coin balance', async () => {
    (EntitlementService.getCoins as jest.Mock).mockReturnValue(5000);

    const { getByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(getByText('Coins: 5,000')).toBeTruthy();
    });
  });

  it('should display Summit Pass Active badge when subscribed', async () => {
    (EntitlementService.hasSummitPass as jest.Mock).mockReturnValue(true);

    const { getByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(getByText('Summit Pass Active')).toBeTruthy();
    });
  });

  it('should display Ads Removed badge when purchased', async () => {
    (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(true);
    (EntitlementService.hasSummitPass as jest.Mock).mockReturnValue(false);

    const { getByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(getByText('Ads Removed')).toBeTruthy();
    });
  });

  it('should not show Remove Ads button if already purchased', async () => {
    (EntitlementService.hasNoAds as jest.Mock).mockReturnValue(true);

    const { queryByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(queryByText('Remove Ads')).toBeNull();
    });
  });

  it('should not show Summit Pass section if already subscribed', async () => {
    (EntitlementService.hasSummitPass as jest.Mock).mockReturnValue(true);

    const { queryByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(queryByText('Monthly')).toBeNull();
      expect(queryByText('Yearly')).toBeNull();
    });
  });

  it('should call onClose when close button is pressed', async () => {
    const onClose = jest.fn();
    const { getByText } = render(<PaywallScreen onClose={onClose} />);

    await waitFor(() => {
      expect(getByText('Shop')).toBeTruthy();
    });

    fireEvent.press(getByText('X'));

    expect(onClose).toHaveBeenCalled();
  });

  it('should show Restore Purchases button', async () => {
    const { getByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(getByText('Restore Purchases')).toBeTruthy();
    });
  });

  it('should call IAPManager.initialize on mount', async () => {
    render(<PaywallScreen />);

    await waitFor(() => {
      expect(IAPManager.initialize).toHaveBeenCalled();
    });
  });

  it('should call EntitlementService.load on mount', async () => {
    render(<PaywallScreen />);

    await waitFor(() => {
      expect(EntitlementService.load).toHaveBeenCalled();
    });
  });

  it('should show coin pack options', async () => {
    const { getByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(getByText('1,000')).toBeTruthy();
      expect(getByText('5,000')).toBeTruthy();
      expect(getByText('15,000')).toBeTruthy();
    });
  });

  it('should call purchaseRemoveAds when Remove Ads button is pressed', async () => {
    const { getAllByText } = render(<PaywallScreen />);

    await waitFor(() => {
      const removeAdsElements = getAllByText('Remove Ads');
      expect(removeAdsElements.length).toBeGreaterThanOrEqual(1);
    });

    // Get the button (second occurrence - button text, not section title)
    const removeAdsElements = getAllByText('Remove Ads');
    const removeAdsButton = removeAdsElements[removeAdsElements.length - 1];
    fireEvent.press(removeAdsButton);

    await waitFor(() => {
      expect(IAPManager.purchaseRemoveAds).toHaveBeenCalled();
    });
  });

  it('should show success alert on successful purchase', async () => {
    (IAPManager.purchaseRemoveAds as jest.Mock).mockResolvedValue({ success: true });

    const { getAllByText } = render(<PaywallScreen />);

    await waitFor(() => {
      const removeAdsElements = getAllByText('Remove Ads');
      expect(removeAdsElements.length).toBeGreaterThanOrEqual(1);
    });

    const removeAdsElements = getAllByText('Remove Ads');
    const removeAdsButton = removeAdsElements[removeAdsElements.length - 1];
    fireEvent.press(removeAdsButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Purchase completed!');
    });
  });

  it('should show error alert on failed purchase', async () => {
    (IAPManager.purchaseRemoveAds as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Payment failed',
    });

    const { getAllByText } = render(<PaywallScreen />);

    await waitFor(() => {
      const removeAdsElements = getAllByText('Remove Ads');
      expect(removeAdsElements.length).toBeGreaterThanOrEqual(1);
    });

    const removeAdsElements = getAllByText('Remove Ads');
    const removeAdsButton = removeAdsElements[removeAdsElements.length - 1];
    fireEvent.press(removeAdsButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Purchase Failed', 'Payment failed');
    });
  });

  it('should call restorePurchases when Restore button is pressed', async () => {
    const { getByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(getByText('Restore Purchases')).toBeTruthy();
    });

    fireEvent.press(getByText('Restore Purchases'));

    await waitFor(() => {
      expect(IAPManager.restorePurchases).toHaveBeenCalled();
      expect(handleRestorePurchases).toHaveBeenCalled();
    });
  });

  it('should show restore success alert when purchases restored', async () => {
    (handleRestorePurchases as jest.Mock).mockResolvedValue({
      restoredNoAds: true,
      restoredSubscription: false,
    });

    const { getByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(getByText('Restore Purchases')).toBeTruthy();
    });

    fireEvent.press(getByText('Restore Purchases'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Restored', 'Restored: Remove Ads');
    });
  });

  it('should show no purchases alert when nothing to restore', async () => {
    (handleRestorePurchases as jest.Mock).mockResolvedValue({
      restoredNoAds: false,
      restoredSubscription: false,
    });

    const { getByText } = render(<PaywallScreen />);

    await waitFor(() => {
      expect(getByText('Restore Purchases')).toBeTruthy();
    });

    fireEvent.press(getByText('Restore Purchases'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'No Purchases',
        'No previous purchases found to restore.'
      );
    });
  });
});
