/**
 * IAP Product Keys and Configuration
 *
 * All product IDs for Apple App Store and Google Play Store
 */

// Non-consumable products
export const NON_CONSUMABLE_PRODUCTS = {
  REMOVE_ADS: 'com.cienrios.summitwheels.removeads',
} as const;

// Subscription products
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY_PASS: 'com.cienrios.summitwheels.pass.monthly',
  YEARLY_PASS: 'com.cienrios.summitwheels.pass.yearly',
} as const;

// Consumable products (coin packs)
export const CONSUMABLE_PRODUCTS = {
  COINS_SMALL: 'com.cienrios.summitwheels.coins.small',
  COINS_MEDIUM: 'com.cienrios.summitwheels.coins.medium',
  COINS_LARGE: 'com.cienrios.summitwheels.coins.large',
} as const;

// Coin pack values
export const COIN_PACK_VALUES = {
  [CONSUMABLE_PRODUCTS.COINS_SMALL]: 1000,
  [CONSUMABLE_PRODUCTS.COINS_MEDIUM]: 5000,
  [CONSUMABLE_PRODUCTS.COINS_LARGE]: 15000,
} as const;

// Prices (for display, actual prices come from store)
export const DISPLAY_PRICES = {
  [NON_CONSUMABLE_PRODUCTS.REMOVE_ADS]: '$2.99',
  [SUBSCRIPTION_PRODUCTS.MONTHLY_PASS]: '$4.99/mo',
  [SUBSCRIPTION_PRODUCTS.YEARLY_PASS]: '$29.99/yr',
  [CONSUMABLE_PRODUCTS.COINS_SMALL]: '$0.99',
  [CONSUMABLE_PRODUCTS.COINS_MEDIUM]: '$4.99',
  [CONSUMABLE_PRODUCTS.COINS_LARGE]: '$9.99',
} as const;

// All product IDs for initialization
export const ALL_PRODUCT_IDS = [
  NON_CONSUMABLE_PRODUCTS.REMOVE_ADS,
  CONSUMABLE_PRODUCTS.COINS_SMALL,
  CONSUMABLE_PRODUCTS.COINS_MEDIUM,
  CONSUMABLE_PRODUCTS.COINS_LARGE,
] as const;

export const ALL_SUBSCRIPTION_IDS = [
  SUBSCRIPTION_PRODUCTS.MONTHLY_PASS,
  SUBSCRIPTION_PRODUCTS.YEARLY_PASS,
] as const;

// Product types
export type ProductId = typeof ALL_PRODUCT_IDS[number];
export type SubscriptionId = typeof ALL_SUBSCRIPTION_IDS[number];
export type CoinPackId = typeof CONSUMABLE_PRODUCTS[keyof typeof CONSUMABLE_PRODUCTS];
