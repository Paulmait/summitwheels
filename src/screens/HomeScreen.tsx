/**
 * HomeScreen - Main navigation hub
 *
 * Provides access to:
 * - Play (Stage Select)
 * - Garage (Vehicle Select & Upgrades)
 * - Settings
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getProgressionManager, PlayerProgress } from '../game/progression/upgrades';
import { useUISound } from '../hooks/useUISound';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type HomeScreenProps = {
  onPlay: () => void;
  onGarage: () => void;
  onStageSelect: () => void;
  onVehicleSelect: () => void;
  onSettings: () => void;
};

export default function HomeScreen({
  onPlay,
  onGarage,
  onStageSelect,
  onVehicleSelect,
  onSettings,
}: HomeScreenProps) {
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const { playClick, playConfirm } = useUISound();

  useEffect(() => {
    const manager = getProgressionManager();
    manager.load().then((p) => setProgress(p));
  }, []);

  const handlePlay = useCallback(() => {
    playConfirm();
    onPlay();
  }, [playConfirm, onPlay]);

  const handleStageSelect = useCallback(() => {
    playClick();
    onStageSelect();
  }, [playClick, onStageSelect]);

  const handleVehicleSelect = useCallback(() => {
    playClick();
    onVehicleSelect();
  }, [playClick, onVehicleSelect]);

  const handleGarage = useCallback(() => {
    playClick();
    onGarage();
  }, [playClick, onGarage]);

  const handleSettings = useCallback(() => {
    playClick();
    onSettings();
  }, [playClick, onSettings]);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <View style={styles.background}>
        <View style={styles.skyTop} />
        <View style={styles.skyBottom} />
        <View style={styles.ground} />
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>SUMMIT</Text>
        <Text style={styles.logoSubtext}>WHEELS</Text>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={styles.statValue}>
            {Math.floor(progress?.bestDistance ?? 0)}m
          </Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.coinDisplay}>
            <Text style={styles.coinIcon}>⬤</Text>
            <Text style={styles.coinValue}>{progress?.coins ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* Main menu buttons */}
      <View style={styles.menuContainer}>
        {/* Play button */}
        <TouchableOpacity
          style={[styles.menuButton, styles.playButton]}
          onPress={handlePlay}
          activeOpacity={0.8}
        >
          <Text style={styles.playButtonText}>PLAY</Text>
        </TouchableOpacity>

        {/* Secondary buttons row */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.stageButton]}
            onPress={handleStageSelect}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryIcon}>🏔️</Text>
            <Text style={styles.secondaryText}>Stages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.vehicleButton]}
            onPress={handleVehicleSelect}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryIcon}>🚗</Text>
            <Text style={styles.secondaryText}>Vehicles</Text>
          </TouchableOpacity>
        </View>

        {/* Tertiary buttons row */}
        <View style={styles.tertiaryRow}>
          <TouchableOpacity
            style={[styles.tertiaryButton, styles.garageButton]}
            onPress={handleGarage}
            activeOpacity={0.8}
          >
            <Text style={styles.tertiaryIcon}>🔧</Text>
            <Text style={styles.tertiaryText}>Garage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tertiaryButton, styles.settingsButton]}
            onPress={handleSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.tertiaryIcon}>⚙️</Text>
            <Text style={styles.tertiaryText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  skyTop: {
    flex: 3,
    backgroundColor: '#1E90FF',
  },
  skyBottom: {
    flex: 2,
    backgroundColor: '#87CEEB',
  },
  ground: {
    flex: 1,
    backgroundColor: '#8B4513',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 4,
  },
  logoSubtext: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 8,
    marginTop: -10,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  statItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statLabel: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: 18,
    color: '#FFD700',
    marginRight: 8,
  },
  coinValue: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  menuButton: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 4,
  },
  secondaryRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
    marginBottom: 15,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stageButton: {
    backgroundColor: '#FF6B35',
  },
  vehicleButton: {
    backgroundColor: '#2196F3',
  },
  secondaryIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  secondaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tertiaryRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
  },
  tertiaryButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  garageButton: {},
  settingsButton: {},
  tertiaryIcon: {
    fontSize: 24,
    marginBottom: 3,
  },
  tertiaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  version: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
