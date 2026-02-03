/**
 * HomeScreen - Main navigation hub
 *
 * Provides access to:
 * - Play (Stage Select)
 * - Garage (Vehicle Select & Upgrades)
 * - Settings
 * - Daily Rewards
 * - Season Pass
 * - Achievements
 * - Shop
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { getProgressionManager, PlayerProgress } from '../game/progression/upgrades';
import { useUISound } from '../hooks/useUISound';
import { DailyRewardSystem } from '../systems/DailyRewardSystem';
import { SeasonPassSystem } from '../systems/SeasonPassSystem';
import { DailyRewardModal } from '../components/DailyRewardModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type HomeScreenProps = {
  onPlay: () => void;
  onGarage: () => void;
  onStageSelect: () => void;
  onVehicleSelect: () => void;
  onSettings: () => void;
  onShop?: () => void;
  onAchievements?: () => void;
  onLeaderboard?: () => void;
  onDailyChallenge?: () => void;
};

export default function HomeScreen({
  onPlay,
  onGarage,
  onStageSelect,
  onVehicleSelect,
  onSettings,
  onShop,
  onAchievements,
  onLeaderboard,
  onDailyChallenge,
}: HomeScreenProps) {
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [hasDailyReward, setHasDailyReward] = useState(false);
  const [seasonLevel, setSeasonLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const { playClick, playConfirm } = useUISound();

  useEffect(() => {
    const init = async () => {
      const manager = getProgressionManager();
      const p = await manager.load();
      setProgress(p);

      // Load daily reward state
      const dailyState = await DailyRewardSystem.load();
      setHasDailyReward(!dailyState.dailyGiftClaimed);
      setStreak(dailyState.currentStreak);

      // Load season pass state
      const seasonState = await SeasonPassSystem.load();
      setSeasonLevel(seasonState.currentLevel);

      // Show daily reward modal on first load if available
      if (!dailyState.dailyGiftClaimed) {
        setTimeout(() => setShowDailyReward(true), 500);
      }
    };

    init();

    // Pulse animation for notification badges
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
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

  const handleDailyRewardClaim = (reward: any, bonus: number) => {
    // Add coins to progress
    if (reward.type === 'coins') {
      const manager = getProgressionManager();
      manager.addCoins(reward.amount + bonus);
      setProgress((p) => p ? { ...p, coins: p.coins + reward.amount + bonus } : p);
    }
    setHasDailyReward(false);
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <View style={styles.background}>
        <View style={styles.skyTop} />
        <View style={styles.skyBottom} />
        <View style={styles.ground} />
      </View>

      {/* Top bar with quick actions */}
      <View style={styles.topBar}>
        {/* Daily Reward Button */}
        <TouchableOpacity
          style={styles.topBarButton}
          onPress={() => setShowDailyReward(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.topBarIcon}>G</Text>
          {hasDailyReward && (
            <Animated.View style={[styles.notificationBadge, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.badgeText}>!</Text>
            </Animated.View>
          )}
        </TouchableOpacity>

        {/* Season Pass Progress */}
        <View style={styles.seasonPassBadge}>
          <Text style={styles.seasonLabel}>Season</Text>
          <Text style={styles.seasonLevel}>Lv.{seasonLevel}</Text>
        </View>

        {/* Streak Display */}
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>F</Text>
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        )}
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
        <TouchableOpacity
          style={styles.statItem}
          onPress={onShop}
          activeOpacity={0.8}
        >
          <View style={styles.coinDisplay}>
            <Text style={styles.coinIcon}>$</Text>
            <Text style={styles.coinValue}>{progress?.coins ?? 0}</Text>
            <Text style={styles.plusIcon}>+</Text>
          </View>
        </TouchableOpacity>
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

        {/* Daily Challenge button */}
        {onDailyChallenge && (
          <TouchableOpacity
            style={[styles.menuButton, styles.dailyChallengeButton]}
            onPress={onDailyChallenge}
            activeOpacity={0.8}
          >
            <Text style={styles.dailyChallengeText}>DAILY CHALLENGE</Text>
            <Text style={styles.dailyChallengeSubtext}>New challenge available!</Text>
          </TouchableOpacity>
        )}

        {/* Secondary buttons row */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.stageButton]}
            onPress={handleStageSelect}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryIcon}>M</Text>
            <Text style={styles.secondaryText}>Stages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.vehicleButton]}
            onPress={handleVehicleSelect}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryIcon}>C</Text>
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
            <Text style={styles.tertiaryIcon}>W</Text>
            <Text style={styles.tertiaryText}>Garage</Text>
          </TouchableOpacity>

          {onAchievements && (
            <TouchableOpacity
              style={[styles.tertiaryButton, styles.achievementsButton]}
              onPress={onAchievements}
              activeOpacity={0.8}
            >
              <Text style={styles.tertiaryIcon}>T</Text>
              <Text style={styles.tertiaryText}>Achieve</Text>
            </TouchableOpacity>
          )}

          {onLeaderboard && (
            <TouchableOpacity
              style={[styles.tertiaryButton, styles.leaderboardButton]}
              onPress={onLeaderboard}
              activeOpacity={0.8}
            >
              <Text style={styles.tertiaryIcon}>L</Text>
              <Text style={styles.tertiaryText}>Leaders</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.tertiaryButton, styles.settingsButton]}
            onPress={handleSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.tertiaryIcon}>S</Text>
            <Text style={styles.tertiaryText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>

      {/* Daily Reward Modal */}
      <DailyRewardModal
        visible={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        onClaim={handleDailyRewardClaim}
      />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    gap: 10,
  },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarIcon: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
  seasonPassBadge: {
    backgroundColor: 'rgba(156, 39, 176, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignItems: 'center',
  },
  seasonLabel: {
    fontSize: 10,
    color: '#DDD',
  },
  seasonLevel: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  streakIcon: {
    fontSize: 14,
    color: '#FFD700',
  },
  streakText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
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
  plusIcon: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 5,
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
  dailyChallengeButton: {
    backgroundColor: '#FF6B35',
    marginBottom: 15,
  },
  dailyChallengeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  dailyChallengeSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
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
  achievementsButton: {},
  leaderboardButton: {},
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
