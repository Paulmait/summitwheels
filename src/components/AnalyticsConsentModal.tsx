/**
 * Analytics Consent Modal - GDPR/CCPA Compliant Consent Collection
 *
 * Displays on first app launch to collect user consent for:
 * - Analytics tracking
 * - Location data
 * - Personalized ads
 * - Data sharing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
} from 'react-native';
import { AnalyticsService, AnalyticsConsent } from '../services/AnalyticsService';

interface AnalyticsConsentModalProps {
  visible: boolean;
  onComplete: () => void;
}

export default function AnalyticsConsentModal({
  visible,
  onComplete,
}: AnalyticsConsentModalProps) {
  const [consent, setConsent] = useState<Partial<AnalyticsConsent>>({
    analyticsEnabled: true,
    locationEnabled: false,
    personalizedAdsEnabled: false,
    dataSharingEnabled: false,
  });

  const handleAcceptAll = async () => {
    await AnalyticsService.setConsent({
      analyticsEnabled: true,
      locationEnabled: true,
      personalizedAdsEnabled: true,
      dataSharingEnabled: true,
    });
    onComplete();
  };

  const handleAcceptSelected = async () => {
    await AnalyticsService.setConsent(consent);
    onComplete();
  };

  const handleDeclineAll = async () => {
    await AnalyticsService.setConsent({
      analyticsEnabled: false,
      locationEnabled: false,
      personalizedAdsEnabled: false,
      dataSharingEnabled: false,
    });
    onComplete();
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://summitwheels.app/privacy');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Privacy & Data</Text>
            <Text style={styles.subtitle}>
              We value your privacy. Please choose how you'd like us to use your data.
            </Text>

            {/* Analytics Toggle */}
            <View style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Analytics</Text>
                  <Text style={styles.optionDescription}>
                    Help us improve the game by sharing anonymous usage data
                  </Text>
                </View>
                <Switch
                  value={consent.analyticsEnabled}
                  onValueChange={(value) =>
                    setConsent({ ...consent, analyticsEnabled: value })
                  }
                  trackColor={{ false: '#475569', true: '#f97316' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Location Toggle */}
            <View style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Location</Text>
                  <Text style={styles.optionDescription}>
                    Allow location access for regional features and analytics
                  </Text>
                </View>
                <Switch
                  value={consent.locationEnabled}
                  onValueChange={(value) =>
                    setConsent({ ...consent, locationEnabled: value })
                  }
                  trackColor={{ false: '#475569', true: '#f97316' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Personalized Ads Toggle */}
            <View style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Personalized Ads</Text>
                  <Text style={styles.optionDescription}>
                    Show ads based on your interests and activity
                  </Text>
                </View>
                <Switch
                  value={consent.personalizedAdsEnabled}
                  onValueChange={(value) =>
                    setConsent({ ...consent, personalizedAdsEnabled: value })
                  }
                  trackColor={{ false: '#475569', true: '#f97316' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Data Sharing Toggle */}
            <View style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Data Sharing</Text>
                  <Text style={styles.optionDescription}>
                    Share anonymized data with partners to improve services
                  </Text>
                </View>
                <Switch
                  value={consent.dataSharingEnabled}
                  onValueChange={(value) =>
                    setConsent({ ...consent, dataSharingEnabled: value })
                  }
                  trackColor={{ false: '#475569', true: '#f97316' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <TouchableOpacity onPress={openPrivacyPolicy} style={styles.privacyLink}>
              <Text style={styles.privacyLinkText}>Read our Privacy Policy</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.declineButton} onPress={handleDeclineAll}>
              <Text style={styles.declineButtonText}>Decline All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptSelected}>
              <Text style={styles.acceptButtonText}>Accept Selected</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.acceptAllButton} onPress={handleAcceptAll}>
            <Text style={styles.acceptAllButtonText}>Accept All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: '#f97316',
  },
  scrollView: {
    maxHeight: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  privacyLink: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  privacyLinkText: {
    color: '#3b82f6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#475569',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  acceptButtonText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptAllButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  acceptAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
