/**
 * Summit Wheels - Main App Entry Point
 *
 * Manages:
 * - Screen navigation
 * - EULA acceptance flow
 * - Error boundaries
 * - System initialization
 */

import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';

// Screens
import GameScreen from './src/screens/GameScreen';
import HomeScreen from './src/screens/HomeScreen';
import GarageScreen from './src/screens/GarageScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StageSelectScreen from './src/screens/StageSelectScreen';
import VehicleSelectScreen from './src/screens/VehicleSelectScreen';
import ShopScreen from './src/screens/ShopScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';

// Components
import { EulaModal } from './src/components/EulaModal';
import { ErrorBoundary, GameErrorBoundary, checkCrashRecovery } from './src/components/ErrorBoundary';

// Hooks & Services
import { useEulaAcceptance } from './src/hooks/useEulaAcceptance';
import { getAudioManager } from './src/audio/AudioManager';
import { getProgressionManager } from './src/game/progression/upgrades';
import { DailyRewardSystem } from './src/systems/DailyRewardSystem';
import { SeasonPassSystem } from './src/systems/SeasonPassSystem';
import { LeaderboardSystem } from './src/systems/LeaderboardSystem';
import { SecurityService } from './src/services/SecurityService';
import { IAPManager } from './src/iap/IAPManager';
import { initializePurchaseHandler } from './src/iap/purchaseHandler';
import { AdService } from './src/ads/AdService';

// Types
import type { VehicleId } from './src/game/config/vehicles';
import type { StageId } from './src/game/config/stages';

type Screen =
  | 'home'
  | 'game'
  | 'garage'
  | 'settings'
  | 'stageSelect'
  | 'vehicleSelect'
  | 'shop'
  | 'achievements'
  | 'leaderboard'
  | 'dailyChallenge';

export default function App() {
  const { hasAccepted, isLoading: eulaLoading, acceptEula } = useEulaAcceptance();

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Game state
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>('jeep');
  const [selectedStage, setSelectedStage] = useState<StageId>('countryside');
  const [gameSeed, setGameSeed] = useState(Date.now());
  const [bestDistance, setBestDistance] = useState(0);

  // Initialize all services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Check for crash recovery
        const wasCrash = await checkCrashRecovery();
        if (wasCrash) {
          console.log('Recovered from previous crash');
        }

        // Initialize security service
        await SecurityService.load();

        // Initialize progression manager
        const progressionManager = getProgressionManager();
        const progress = await progressionManager.load();
        setBestDistance(progress.bestDistance);
        setSelectedVehicle(progress.selectedVehicle);
        setSelectedStage(progress.selectedStage);

        // Initialize engagement systems
        await DailyRewardSystem.load();
        await SeasonPassSystem.load();
        await LeaderboardSystem.load();

        // Initialize audio
        const audioManager = getAudioManager();
        await audioManager.init();

        // Initialize IAP
        await IAPManager.initialize();
        initializePurchaseHandler();

        // Initialize Ads
        await AdService.initialize();

        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize');
        // Still allow app to continue
        setIsInitialized(true);
      }
    };

    initializeServices();
  }, []);

  // Screen navigation handlers
  const navigateTo = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const handlePlay = useCallback(() => {
    setGameSeed(Date.now());
    navigateTo('game');
  }, [navigateTo]);

  const handleRunEnd = useCallback(
    async (stats: { distance: number; coins: number; trickPoints: number; maxCombo: number }) => {
      // Update best distance
      if (stats.distance > bestDistance) {
        setBestDistance(stats.distance);
      }

      // Submit to leaderboard
      await LeaderboardSystem.submitRun({
        vehicleId: selectedVehicle,
        stageId: selectedStage,
        distance: stats.distance,
        coins: stats.coins,
        trickPoints: stats.trickPoints,
        maxCombo: stats.maxCombo,
        timeElapsed: 0,
      });

      // Add XP to season pass
      await SeasonPassSystem.addXP('distance', Math.floor(stats.distance / 100));
      await SeasonPassSystem.addXP('coins_collected', Math.floor(stats.coins / 10));
      await SeasonPassSystem.addXP('tricks', stats.trickPoints);

      // Record game played for ad frequency
      AdService.recordGamePlayed();
    },
    [bestDistance, selectedVehicle, selectedStage]
  );

  const handleQuitToMenu = useCallback(() => {
    navigateTo('home');
  }, [navigateTo]);

  const handleVehicleSelect = useCallback((vehicleId: VehicleId) => {
    setSelectedVehicle(vehicleId);
    const manager = getProgressionManager();
    manager.selectVehicle(vehicleId);
  }, []);

  const handleStageSelect = useCallback((stageId: StageId) => {
    setSelectedStage(stageId);
    const manager = getProgressionManager();
    manager.selectStage(stageId);
  }, []);

  // Loading screen
  if (eulaLoading || !isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.logoText}>SUMMIT</Text>
          <Text style={styles.logoSubtext}>WHEELS</Text>
          <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
          <Text style={styles.loadingText}>
            {eulaLoading ? 'Loading...' : 'Initializing...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onPlay={handlePlay}
            onGarage={() => navigateTo('garage')}
            onStageSelect={() => navigateTo('stageSelect')}
            onVehicleSelect={() => navigateTo('vehicleSelect')}
            onSettings={() => navigateTo('settings')}
            onShop={() => navigateTo('shop')}
            onAchievements={() => navigateTo('achievements')}
            onLeaderboard={() => navigateTo('leaderboard')}
            onDailyChallenge={() => navigateTo('dailyChallenge')}
          />
        );

      case 'game':
        return (
          <GameErrorBoundary>
            <GameScreen
              seed={gameSeed}
              onRunEnd={handleRunEnd}
              onQuit={handleQuitToMenu}
              bestDistance={bestDistance}
            />
          </GameErrorBoundary>
        );

      case 'garage':
        return (
          <GarageScreen
            onBack={() => navigateTo('home')}
          />
        );

      case 'settings':
        return <SettingsScreen onBack={() => navigateTo('home')} />;

      case 'stageSelect':
        return (
          <StageSelectScreen
            selectedStage={selectedStage}
            onSelectStage={(stageId: StageId) => {
              handleStageSelect(stageId);
              navigateTo('home');
            }}
            onBack={() => navigateTo('home')}
          />
        );

      case 'vehicleSelect':
        return (
          <VehicleSelectScreen
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(vehicleId: VehicleId) => {
              handleVehicleSelect(vehicleId);
              navigateTo('home');
            }}
            onBack={() => navigateTo('home')}
          />
        );

      case 'shop':
        return <ShopScreen onBack={() => navigateTo('home')} />;

      case 'achievements':
        return <AchievementsScreen onBack={() => navigateTo('home')} />;

      case 'leaderboard':
        // Fall back to home for now - leaderboard screen to be implemented
        navigateTo('home');
        return null;

      case 'dailyChallenge':
        // Start game with daily challenge modifier
        setGameSeed(Date.now());
        navigateTo('game');
        return null;

      default:
        return (
          <HomeScreen
            onPlay={handlePlay}
            onGarage={() => navigateTo('garage')}
            onStageSelect={() => navigateTo('stageSelect')}
            onVehicleSelect={() => navigateTo('vehicleSelect')}
            onSettings={() => navigateTo('settings')}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        {/* EULA Modal - shown on first launch */}
        <EulaModal visible={!hasAccepted} onAccept={acceptEula} />

        {/* Main content */}
        {hasAccepted && renderScreen()}

        {/* Init error notification */}
        {initError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Warning: {initError}</Text>
          </View>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  logoSubtext: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B35',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginTop: -5,
  },
  loader: {
    marginTop: 40,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 16,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
  },
});
