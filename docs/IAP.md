# In-App Purchases (IAP) Documentation

Summit Wheels implements in-app purchases using `react-native-iap` for both iOS App Store and Google Play Store.

## Product Catalog

| Product ID | Type | Price | Description |
|------------|------|-------|-------------|
| `com.cienrios.summitwheels.removeads` | Non-consumable | $2.99 | Permanently removes interstitial ads |
| `com.cienrios.summitwheels.pass.monthly` | Subscription | $4.99/mo | Summit Pass - no ads, bonus coins, exclusive content |
| `com.cienrios.summitwheels.pass.yearly` | Subscription | $29.99/yr | Summit Pass (yearly) - save 50% |
| `com.cienrios.summitwheels.coins.small` | Consumable | $0.99 | 1,000 coins |
| `com.cienrios.summitwheels.coins.medium` | Consumable | $4.99 | 5,000 coins |
| `com.cienrios.summitwheels.coins.large` | Consumable | $9.99 | 15,000 coins |

## Entitlement Model

```typescript
interface Entitlements {
  noAds: boolean;      // Remove Ads purchased OR Summit Pass active
  summitPass: boolean; // Active Summit Pass subscription
  coins: number;       // Current coin balance
}
```

**Entitlement Logic:**
- `noAds` is granted by either Remove Ads purchase OR active Summit Pass
- `summitPass` grants: no ads, bonus coins on pickups, exclusive content
- Coins are consumable and accumulate with purchases

## Architecture

```
src/
├── iap/
│   ├── iapKeys.ts          # Product IDs and configuration
│   ├── IAPManager.ts       # Core IAP operations singleton
│   └── purchaseHandler.ts  # Connects purchases to entitlements
├── services/
│   └── EntitlementService.ts  # Persists user entitlements
├── ads/
│   └── AdService.ts        # Entitlement-aware ad display
└── screens/
    └── PaywallScreen.tsx   # Purchase UI
```

## App Store Connect Setup (iOS)

### 1. Create Products

1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Create each product with the exact Product IDs listed above
3. For subscriptions, create a Subscription Group called "Summit Pass"

### 2. Non-Consumable (Remove Ads)

- Type: Non-Consumable
- Product ID: `com.cienrios.summitwheels.removeads`
- Reference Name: Remove Ads
- Price: $2.99 (or tier)

### 3. Subscriptions (Summit Pass)

Create Subscription Group: "Summit Pass"

**Monthly:**
- Type: Auto-Renewable Subscription
- Product ID: `com.cienrios.summitwheels.pass.monthly`
- Reference Name: Summit Pass Monthly
- Duration: 1 Month
- Price: $4.99

**Yearly:**
- Type: Auto-Renewable Subscription
- Product ID: `com.cienrios.summitwheels.pass.yearly`
- Reference Name: Summit Pass Yearly
- Duration: 1 Year
- Price: $29.99

### 4. Consumables (Coin Packs)

- Type: Consumable
- Product IDs: `com.cienrios.summitwheels.coins.small|medium|large`
- Prices: $0.99, $4.99, $9.99

### 5. Sandbox Testing

1. Create Sandbox test accounts in App Store Connect → Users and Access → Sandbox
2. Sign out of App Store on device
3. Sign in with sandbox account when prompted during purchase

## Google Play Console Setup (Android)

### 1. Create Products

1. Go to Google Play Console → Your App → Monetize → Products
2. Create In-app products and Subscriptions

### 2. In-App Products

Create products with the exact Product IDs:
- `com.cienrios.summitwheels.removeads` - Managed product
- `com.cienrios.summitwheels.coins.small` - Consumable
- `com.cienrios.summitwheels.coins.medium` - Consumable
- `com.cienrios.summitwheels.coins.large` - Consumable

### 3. Subscriptions

1. Go to Monetize → Subscriptions
2. Create "Summit Pass" subscription with two base plans:
   - Monthly: `pass.monthly` at $4.99/month
   - Yearly: `pass.yearly` at $29.99/year

### 4. License Testing

1. Go to Setup → License testing
2. Add test email accounts
3. These accounts can make test purchases without being charged

## Usage in Code

### Initialize IAP

```typescript
import { IAPManager } from './iap/IAPManager';
import { EntitlementService } from './services/EntitlementService';
import { initializePurchaseHandler } from './iap/purchaseHandler';

// In your app initialization
async function initializeApp() {
  await EntitlementService.load();
  await IAPManager.initialize();
  initializePurchaseHandler();
}
```

### Check Entitlements

```typescript
import { EntitlementService } from './services/EntitlementService';

// Check if user should see ads
if (!EntitlementService.hasNoAds()) {
  await AdService.showInterstitial();
}

// Check subscription status
if (EntitlementService.hasSummitPass()) {
  // Show premium content
}

// Get coin balance
const coins = EntitlementService.getCoins();
```

### Make a Purchase

```typescript
import { IAPManager } from './iap/IAPManager';

// Purchase Remove Ads
await IAPManager.purchaseRemoveAds();

// Purchase subscription
await IAPManager.purchaseMonthlyPass();
await IAPManager.purchaseYearlyPass();

// Purchase coins
await IAPManager.purchaseCoinPack('small');  // 1,000 coins
await IAPManager.purchaseCoinPack('medium'); // 5,000 coins
await IAPManager.purchaseCoinPack('large');  // 15,000 coins
```

### Restore Purchases

```typescript
import { IAPManager } from './iap/IAPManager';
import { handleRestorePurchases } from './iap/purchaseHandler';

const purchases = await IAPManager.restorePurchases();
const { restoredNoAds, restoredSubscription } = await handleRestorePurchases(purchases);
```

## Testing Checklist

### Pre-submission Testing

- [ ] **Remove Ads**
  - [ ] Purchase succeeds and removes interstitial ads
  - [ ] State persists after app restart
  - [ ] Restore purchases works

- [ ] **Summit Pass Monthly**
  - [ ] Purchase succeeds
  - [ ] Ads are removed
  - [ ] Bonus content unlocked
  - [ ] Subscription auto-renews (sandbox)
  - [ ] Cancel/resubscribe flow works

- [ ] **Summit Pass Yearly**
  - [ ] Purchase succeeds
  - [ ] Same benefits as monthly
  - [ ] Correct pricing shown

- [ ] **Coin Packs**
  - [ ] Each pack grants correct amount
  - [ ] Multiple purchases accumulate
  - [ ] Balance persists after restart

- [ ] **Restore Purchases**
  - [ ] Restores non-consumables (Remove Ads)
  - [ ] Restores active subscriptions
  - [ ] Does NOT restore consumed coin packs

- [ ] **Edge Cases**
  - [ ] Cancelled purchase handled gracefully
  - [ ] Network error during purchase
  - [ ] Already purchased product
  - [ ] Expired subscription

### iOS-Specific

- [ ] Test in Sandbox environment
- [ ] Verify receipt validation (if implemented)
- [ ] Test subscription management deeplink
- [ ] Verify Family Sharing settings (if applicable)

### Android-Specific

- [ ] Test with license testing accounts
- [ ] Verify purchase acknowledgement
- [ ] Test Google Play subscription management
- [ ] Handle pending purchases

## Troubleshooting

### "Product not found" error
- Verify Product ID matches exactly
- Ensure product is "Ready to Submit" in App Store Connect
- Wait 24-48 hours after creating products

### Purchases not restoring
- Ensure using correct Apple ID / Google account
- Non-consumables and active subscriptions only
- Check console for errors

### Subscription not recognized
- Verify subscription group setup
- Check subscription status with store
- Server-side validation recommended for production

## Security Notes

1. **Never trust client-side verification alone** - Implement server-side receipt validation for production
2. **Store entitlements locally** for offline access, but re-validate on app launch
3. **Use App Store/Play Console webhook** for subscription status changes
4. **Protect coin balance** - Consider server-side tracking for high-value virtual currency
