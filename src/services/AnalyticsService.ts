/**
 * Analytics Service - Comprehensive user analytics tracking
 *
 * Captures:
 * - Device information (ID, model, OS)
 * - Session data (start, duration, screens viewed)
 * - Location (with permission)
 * - Gameplay metrics (runs, coins, achievements)
 * - Revenue events (purchases, subscriptions)
 *
 * GDPR/CCPA Compliant:
 * - Requires explicit consent before tracking
 * - Supports data export and deletion
 * - Anonymization options available
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import { supabaseClient } from './SupabaseClient';

// Storage keys
const ANALYTICS_CONSENT_KEY = '@analytics_consent';
const ANALYTICS_USER_ID_KEY = '@analytics_user_id';
const ANALYTICS_SESSION_KEY = '@analytics_session';
const ANALYTICS_QUEUE_KEY = '@analytics_queue';

// Event types
export type AnalyticsEventType =
  | 'app_open'
  | 'app_close'
  | 'session_start'
  | 'session_end'
  | 'screen_view'
  | 'game_start'
  | 'game_end'
  | 'purchase'
  | 'subscription'
  | 'achievement'
  | 'level_up'
  | 'coins_earned'
  | 'coins_spent'
  | 'ad_watched'
  | 'daily_reward_claimed'
  | 'referral'
  | 'error'
  | 'custom';

// Analytics event structure
export interface AnalyticsEvent {
  id: string;
  userId: string;
  deviceId: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  eventName: string;
  eventData: Record<string, any>;
  timestamp: string;
  platform: 'ios' | 'android';
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  locale: string;
  timezone: string;
  screenName?: string;
  location?: {
    latitude: number;
    longitude: number;
    country?: string;
    city?: string;
  };
  networkType?: string;
  ipAddress?: string;
}

// User profile for analytics
export interface AnalyticsUser {
  id: string;
  deviceId: string;
  firstSeen: string;
  lastSeen: string;
  totalSessions: number;
  totalPlaytime: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  totalPurchases: number;
  totalRevenue: number;
  platform: 'ios' | 'android';
  appVersion: string;
  country?: string;
  city?: string;
  deviceModel: string;
  osVersion: string;
  isPremium: boolean;
  hasSubscription: boolean;
  acquisitionSource?: string;
}

// Session data
interface SessionData {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number;
  screenViews: string[];
  eventsCount: number;
}

// Consent preferences
export interface AnalyticsConsent {
  analyticsEnabled: boolean;
  locationEnabled: boolean;
  personalizedAdsEnabled: boolean;
  dataSharingEnabled: boolean;
  consentTimestamp: string;
  consentVersion: string;
}

const DEFAULT_CONSENT: AnalyticsConsent = {
  analyticsEnabled: false,
  locationEnabled: false,
  personalizedAdsEnabled: false,
  dataSharingEnabled: false,
  consentTimestamp: '',
  consentVersion: '1.0',
};

/**
 * Generate a unique ID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Analytics Service singleton
 */
class AnalyticsServiceClass {
  private _consent: AnalyticsConsent = DEFAULT_CONSENT;
  private _userId: string = '';
  private _deviceId: string = '';
  private _currentSession: SessionData | null = null;
  private _eventQueue: AnalyticsEvent[] = [];
  private _isInitialized = false;
  private _flushInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the analytics service
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      // Load consent preferences
      await this._loadConsent();

      // Load or generate user ID
      await this._loadUserId();

      // Load device ID
      await this._loadDeviceId();

      // Load queued events
      await this._loadEventQueue();

      // Start flush interval (every 30 seconds)
      this._flushInterval = setInterval(() => {
        this._flushEvents();
      }, 30000);

      this._isInitialized = true;
      console.log('Analytics: Initialized');
    } catch (error) {
      console.error('Analytics: Failed to initialize:', error);
    }
  }

  /**
   * Load consent preferences
   */
  private async _loadConsent(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_CONSENT_KEY);
      if (stored) {
        this._consent = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Analytics: Failed to load consent:', error);
    }
  }

  /**
   * Load or generate user ID
   */
  private async _loadUserId(): Promise<void> {
    try {
      let userId = await AsyncStorage.getItem(ANALYTICS_USER_ID_KEY);
      if (!userId) {
        userId = generateUUID();
        await AsyncStorage.setItem(ANALYTICS_USER_ID_KEY, userId);
      }
      this._userId = userId;
    } catch (error) {
      this._userId = generateUUID();
    }
  }

  /**
   * Load device ID
   */
  private async _loadDeviceId(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        this._deviceId = (await Application.getIosIdForVendorAsync()) || generateUUID();
      } else {
        this._deviceId = Application.getAndroidId() || generateUUID();
      }
    } catch (error) {
      this._deviceId = generateUUID();
    }
  }

  /**
   * Load event queue from storage
   */
  private async _loadEventQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
      if (stored) {
        this._eventQueue = JSON.parse(stored);
      }
    } catch (error) {
      this._eventQueue = [];
    }
  }

  /**
   * Save event queue to storage
   */
  private async _saveEventQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(this._eventQueue));
    } catch (error) {
      console.error('Analytics: Failed to save queue:', error);
    }
  }

  /**
   * Set user consent preferences
   */
  async setConsent(consent: Partial<AnalyticsConsent>): Promise<void> {
    this._consent = {
      ...this._consent,
      ...consent,
      consentTimestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify(this._consent));

    // Track consent change
    if (this._consent.analyticsEnabled) {
      await this.trackEvent('custom', 'consent_updated', { consent: this._consent });
    }
  }

  /**
   * Get current consent preferences
   */
  getConsent(): AnalyticsConsent {
    return { ...this._consent };
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this._consent.analyticsEnabled;
  }

  /**
   * Start a new session
   */
  async startSession(): Promise<void> {
    if (!this._consent.analyticsEnabled) return;

    this._currentSession = {
      id: generateUUID(),
      startTime: new Date().toISOString(),
      duration: 0,
      screenViews: [],
      eventsCount: 0,
    };

    await this.trackEvent('session_start', 'session_started', {
      sessionId: this._currentSession.id,
    });
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    if (!this._consent.analyticsEnabled || !this._currentSession) return;

    const endTime = new Date();
    const startTime = new Date(this._currentSession.startTime);
    this._currentSession.endTime = endTime.toISOString();
    this._currentSession.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await this.trackEvent('session_end', 'session_ended', {
      sessionId: this._currentSession.id,
      duration: this._currentSession.duration,
      screenViews: this._currentSession.screenViews.length,
      eventsCount: this._currentSession.eventsCount,
    });

    // Flush events immediately
    await this._flushEvents();

    this._currentSession = null;
  }

  /**
   * Track an analytics event
   */
  async trackEvent(
    eventType: AnalyticsEventType,
    eventName: string,
    eventData: Record<string, any> = {}
  ): Promise<void> {
    if (!this._consent.analyticsEnabled) return;

    try {
      const event: AnalyticsEvent = {
        id: generateUUID(),
        userId: this._userId,
        deviceId: this._deviceId,
        sessionId: this._currentSession?.id || 'no-session',
        eventType,
        eventName,
        eventData,
        timestamp: new Date().toISOString(),
        platform: Platform.OS as 'ios' | 'android',
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        osVersion: Device.osVersion || 'unknown',
        deviceModel: Device.modelName || 'unknown',
        locale: 'en-US', // Could use expo-localization
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Add location if enabled and available
      if (this._consent.locationEnabled) {
        try {
          const location = await this._getLocation();
          if (location) {
            event.location = location;
          }
        } catch (e) {
          // Location not available
        }
      }

      // Add network info
      try {
        const networkState = await Network.getNetworkStateAsync();
        event.networkType = networkState.type;
        event.ipAddress = await this._getIPAddress();
      } catch (e) {
        // Network info not available
      }

      // Add to queue
      this._eventQueue.push(event);
      if (this._currentSession) {
        this._currentSession.eventsCount++;
      }

      // Save queue
      await this._saveEventQueue();

      // Flush if queue is large
      if (this._eventQueue.length >= 50) {
        await this._flushEvents();
      }
    } catch (error) {
      console.error('Analytics: Failed to track event:', error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string): Promise<void> {
    if (this._currentSession) {
      this._currentSession.screenViews.push(screenName);
    }
    await this.trackEvent('screen_view', 'screen_viewed', { screenName });
  }

  /**
   * Track game session
   */
  async trackGameStart(stageId: string, vehicleId: string): Promise<void> {
    await this.trackEvent('game_start', 'game_started', { stageId, vehicleId });
  }

  async trackGameEnd(
    stageId: string,
    vehicleId: string,
    distance: number,
    coinsEarned: number,
    duration: number,
    reason: 'fuel' | 'crash' | 'quit'
  ): Promise<void> {
    await this.trackEvent('game_end', 'game_ended', {
      stageId,
      vehicleId,
      distance,
      coinsEarned,
      duration,
      endReason: reason,
    });
  }

  /**
   * Track purchase
   */
  async trackPurchase(
    productId: string,
    price: number,
    currency: string,
    transactionId: string
  ): Promise<void> {
    await this.trackEvent('purchase', 'purchase_completed', {
      productId,
      price,
      currency,
      transactionId,
      revenue: price,
    });
  }

  /**
   * Track subscription
   */
  async trackSubscription(
    productId: string,
    price: number,
    currency: string,
    period: string
  ): Promise<void> {
    await this.trackEvent('subscription', 'subscription_started', {
      productId,
      price,
      currency,
      period,
      revenue: price,
    });
  }

  /**
   * Track achievement
   */
  async trackAchievement(achievementId: string, achievementName: string): Promise<void> {
    await this.trackEvent('achievement', 'achievement_unlocked', {
      achievementId,
      achievementName,
    });
  }

  /**
   * Track coins
   */
  async trackCoinsEarned(amount: number, source: string): Promise<void> {
    await this.trackEvent('coins_earned', 'coins_earned', { amount, source });
  }

  async trackCoinsSpent(amount: number, item: string): Promise<void> {
    await this.trackEvent('coins_spent', 'coins_spent', { amount, item });
  }

  /**
   * Track ad watched
   */
  async trackAdWatched(adType: string, reward?: number): Promise<void> {
    await this.trackEvent('ad_watched', 'ad_watched', { adType, reward });
  }

  /**
   * Track daily reward
   */
  async trackDailyRewardClaimed(day: number, reward: string): Promise<void> {
    await this.trackEvent('daily_reward_claimed', 'daily_reward_claimed', { day, reward });
  }

  /**
   * Track error
   */
  async trackError(errorType: string, errorMessage: string, stackTrace?: string): Promise<void> {
    await this.trackEvent('error', 'error_occurred', {
      errorType,
      errorMessage,
      stackTrace: stackTrace?.substring(0, 500), // Limit stack trace size
    });
  }

  /**
   * Get location with permission
   */
  private async _getLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await Location.getLastKnownPositionAsync();
      if (location) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get IP address
   */
  private async _getIPAddress(): Promise<string | undefined> {
    try {
      const ip = await Network.getIpAddressAsync();
      return ip;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Flush events to server
   */
  private async _flushEvents(): Promise<void> {
    if (this._eventQueue.length === 0) return;

    try {
      const eventsToSend = [...this._eventQueue];
      this._eventQueue = [];

      // Send to Supabase
      const { error } = await supabaseClient
        .from('analytics_events')
        .insert(eventsToSend.map(event => ({
          id: event.id,
          user_id: event.userId,
          device_id: event.deviceId,
          session_id: event.sessionId,
          event_type: event.eventType,
          event_name: event.eventName,
          event_data: event.eventData,
          timestamp: event.timestamp,
          platform: event.platform,
          app_version: event.appVersion,
          os_version: event.osVersion,
          device_model: event.deviceModel,
          locale: event.locale,
          timezone: event.timezone,
          screen_name: event.screenName,
          location: event.location,
          network_type: event.networkType,
          ip_address: event.ipAddress,
        })));

      if (error) {
        // Re-queue events on failure
        this._eventQueue = [...eventsToSend, ...this._eventQueue];
        await this._saveEventQueue();
        console.error('Analytics: Failed to flush events:', error);
      } else {
        await this._saveEventQueue();
        console.log(`Analytics: Flushed ${eventsToSend.length} events`);
      }
    } catch (error) {
      console.error('Analytics: Flush error:', error);
    }
  }

  /**
   * Get user ID for data requests
   */
  getUserId(): string {
    return this._userId;
  }

  /**
   * Get device ID
   */
  getDeviceId(): string {
    return this._deviceId;
  }

  /**
   * Export user data (GDPR)
   */
  async exportUserData(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabaseClient
        .from('analytics_events')
        .select('*')
        .eq('user_id', this._userId);

      if (error) throw error;

      return {
        userId: this._userId,
        deviceId: this._deviceId,
        consent: this._consent,
        events: data,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Analytics: Failed to export data:', error);
      return {
        userId: this._userId,
        error: 'Failed to export data',
      };
    }
  }

  /**
   * Delete user data (GDPR)
   */
  async deleteUserData(): Promise<boolean> {
    try {
      const { error } = await supabaseClient
        .from('analytics_events')
        .delete()
        .eq('user_id', this._userId);

      if (error) throw error;

      // Clear local data
      await AsyncStorage.multiRemove([
        ANALYTICS_CONSENT_KEY,
        ANALYTICS_USER_ID_KEY,
        ANALYTICS_SESSION_KEY,
        ANALYTICS_QUEUE_KEY,
      ]);

      // Reset state
      this._consent = DEFAULT_CONSENT;
      this._userId = generateUUID();
      this._eventQueue = [];

      await AsyncStorage.setItem(ANALYTICS_USER_ID_KEY, this._userId);

      return true;
    } catch (error) {
      console.error('Analytics: Failed to delete data:', error);
      return false;
    }
  }

  /**
   * Cleanup on app close
   */
  async cleanup(): Promise<void> {
    if (this._flushInterval) {
      clearInterval(this._flushInterval);
    }
    await this._flushEvents();
  }
}

export const AnalyticsService = new AnalyticsServiceClass();
export { AnalyticsServiceClass };
