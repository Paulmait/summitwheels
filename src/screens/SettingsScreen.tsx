/**
 * SettingsScreen - Audio, privacy, and game settings
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Linking,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudio } from '../audio/useAudio';
import { DeleteDataModal } from '../components/DeleteDataModal';

type SettingsScreenProps = {
  onBack?: () => void;
};

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const {
    settings,
    isReady,
    toggleSfx,
    toggleMusic,
    toggleHaptics,
    setSfxVolume,
    setMusicVolume,
  } = useAudio();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleOpenPrivacyPolicy = () => {
    // Link to hosted privacy policy (replace with actual URL)
    Linking.openURL('https://summitwheels.app/privacy');
  };

  const handleOpenTerms = () => {
    // Link to hosted terms (replace with actual URL)
    Linking.openURL('https://summitwheels.app/terms');
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Delete Data Modal */}
      <DeleteDataModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDataDeleted={() => {
          // Optionally restart app or show confirmation
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Audio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>

          {/* SFX Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Switch
              value={settings.sfxEnabled}
              onValueChange={toggleSfx}
              trackColor={{ false: '#444', true: '#FF6B35' }}
              thumbColor={settings.sfxEnabled ? '#FFF' : '#AAA'}
            />
          </View>

          {/* SFX Volume */}
          {settings.sfxEnabled && (
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>SFX Volume</Text>
              <View style={styles.sliderContainer}>
                <SliderComponent
                  value={settings.sfxVolume}
                  onValueChange={setSfxVolume}
                />
                <Text style={styles.sliderValue}>
                  {Math.round(settings.sfxVolume * 100)}%
                </Text>
              </View>
            </View>
          )}

          {/* Music Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Music</Text>
            <Switch
              value={settings.musicEnabled}
              onValueChange={toggleMusic}
              trackColor={{ false: '#444', true: '#FF6B35' }}
              thumbColor={settings.musicEnabled ? '#FFF' : '#AAA'}
            />
          </View>

          {/* Music Volume */}
          {settings.musicEnabled && (
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Music Volume</Text>
              <View style={styles.sliderContainer}>
                <SliderComponent
                  value={settings.musicVolume}
                  onValueChange={setMusicVolume}
                />
                <Text style={styles.sliderValue}>
                  {Math.round(settings.musicVolume * 100)}%
                </Text>
              </View>
            </View>
          )}

          {/* Haptics Toggle */}
          <View style={[styles.settingRow, styles.lastRow]}>
            <Text style={styles.settingLabel}>Haptics</Text>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={toggleHaptics}
              trackColor={{ false: '#444', true: '#FF6B35' }}
              thumbColor={settings.hapticsEnabled ? '#FFF' : '#AAA'}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>

          {/* Delete My Data - REQUIRED BY APPLE/GDPR/CCPA */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setShowDeleteModal(true)}
          >
            <View>
              <Text style={styles.actionLabel}>Delete My Data</Text>
              <Text style={styles.actionDescription}>
                Remove all your personal data
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleOpenPrivacyPolicy}
          >
            <Text style={styles.actionLabel}>Privacy Policy</Text>
            <Text style={styles.actionArrow}>↗</Text>
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity
            style={[styles.actionRow, styles.lastRow]}
            onPress={handleOpenTerms}
          >
            <Text style={styles.actionLabel}>Terms of Service</Text>
            <Text style={styles.actionArrow}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>Summit Wheels v1.0.0</Text>
          <Text style={styles.aboutText}>A hill-climbing adventure</Text>
          <View style={styles.developerInfo}>
            <Text style={styles.developerText}>Cien Rios LLC</Text>
            <Text style={styles.developerText}>
              17113 Miramar Parkway, Miramar, FL 33027
            </Text>
            <Text style={styles.developerText}>(754) 254-7141</Text>
          </View>
        </View>

        {/* Spacer for bottom padding */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

/**
 * Slider component with fallback for web/missing native module
 */
function SliderComponent({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number) => void;
}) {
  // Try to use native slider, fall back to simple buttons
  try {
    if (Slider) {
      return (
        <Slider
          style={styles.slider}
          value={value}
          onValueChange={onValueChange}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#FF6B35"
          maximumTrackTintColor="#444"
          thumbTintColor="#FFF"
        />
      );
    }
  } catch {
    // Fallback for missing native module
  }

  // Fallback: simple buttons
  return (
    <View style={styles.fallbackSlider}>
      <TouchableOpacity
        style={styles.volumeButton}
        onPress={() => onValueChange(Math.max(0, value - 0.1))}
      >
        <Text style={styles.volumeButtonText}>-</Text>
      </TouchableOpacity>
      <View style={styles.volumeBar}>
        <View style={[styles.volumeFill, { width: `${value * 100}%` }]} />
      </View>
      <TouchableOpacity
        style={styles.volumeButton}
        onPress={() => onValueChange(Math.min(1, value + 0.1))}
      >
        <Text style={styles.volumeButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    padding: 20,
  },
  loading: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  backButton: {
    marginRight: 20,
  },
  backText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  section: {
    backgroundColor: '#2A2A4E',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 18,
    color: '#FFF',
  },
  sliderRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sliderLabel: {
    fontSize: 16,
    color: '#AAA',
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    color: '#FFF',
    fontSize: 16,
    width: 50,
    textAlign: 'right',
  },
  fallbackSlider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  volumeBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#444',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionLabel: {
    fontSize: 18,
    color: '#FFF',
  },
  actionDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 20,
    color: '#666',
  },
  aboutText: {
    fontSize: 16,
    color: '#AAA',
    marginBottom: 5,
  },
  developerInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  developerText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
