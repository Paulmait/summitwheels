/**
 * Daily Challenge Screen - Shows today's challenge and modifiers
 *
 * Features:
 * - Daily rotating challenge display
 * - Challenge modifiers preview
 * - Progress tracking
 * - Countdown to next challenge
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  generateDailyChallenge,
  DailyChallenge,
  MODIFIER_EFFECTS,
  getTimeUntilNextChallenge,
  ChallengeProgress,
} from '../game/systems/dailyChallenge';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHALLENGE_PROGRESS_KEY = '@summit_wheels_challenge_progress';

type DailyChallengeScreenProps = {
  onPlay: (challenge: DailyChallenge) => void;
  onBack: () => void;
};

export default function DailyChallengeScreen({ onPlay, onBack }: DailyChallengeScreenProps) {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    loadChallenge();
    loadProgress();

    // Update countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilNextChallenge());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadChallenge = () => {
    const today = new Date();
    const dailyChallenge = generateDailyChallenge(today);
    setChallenge(dailyChallenge);
  };

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHALLENGE_PROGRESS_KEY);
      if (stored) {
        const savedProgress = JSON.parse(stored) as ChallengeProgress;
        // Check if progress is for today's challenge
        const today = new Date().toISOString().split('T')[0];
        if (savedProgress.challengeId === `daily_${today}`) {
          setProgress(savedProgress);
        }
      }
    } catch (error) {
      console.error('Failed to load challenge progress:', error);
    }
  };

  const getGoalIcon = (goalType: string): string => {
    switch (goalType) {
      case 'distance':
        return 'D';
      case 'coins':
        return '$';
      case 'tricks':
        return 'T';
      case 'airtime':
        return 'A';
      case 'no_crash':
        return 'S';
      default:
        return '*';
    }
  };

  const getModifierIcon = (modifier: string): string => {
    switch (modifier) {
      case 'low_gravity':
        return 'M';
      case 'high_gravity':
        return 'H';
      case 'slippery':
        return 'I';
      case 'sticky':
        return 'G';
      case 'double_coins':
        return '$';
      case 'half_fuel':
        return 'F';
      case 'no_brakes':
        return '!';
      case 'super_boost':
        return 'B';
      default:
        return '*';
    }
  };

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading challenge...</Text>
      </View>
    );
  }

  const isCompleted = progress?.completed ?? false;
  const progressPercent = progress
    ? Math.min(100, Math.floor((progress.current / challenge.target) * 100))
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Challenge</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Countdown Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Next Challenge In</Text>
          <Text style={styles.timerValue}>
            {String(timeRemaining.hours).padStart(2, '0')}:
            {String(timeRemaining.minutes).padStart(2, '0')}:
            {String(timeRemaining.seconds).padStart(2, '0')}
          </Text>
        </View>

        {/* Challenge Card */}
        <View style={[styles.challengeCard, isCompleted && styles.challengeCardCompleted]}>
          {/* Challenge Name (Modifiers) */}
          <Text style={styles.challengeName}>{challenge.name}</Text>

          {/* Goal */}
          <View style={styles.goalContainer}>
            <View style={styles.goalIcon}>
              <Text style={styles.goalIconText}>{getGoalIcon(challenge.goalType)}</Text>
            </View>
            <Text style={styles.goalText}>{challenge.description}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress?.current ?? 0} / {challenge.target}
            </Text>
          </View>

          {/* Modifiers */}
          <View style={styles.modifiersContainer}>
            <Text style={styles.modifiersTitle}>Active Modifiers:</Text>
            {challenge.modifiers.map((modifier) => {
              const effect = MODIFIER_EFFECTS[modifier];
              return (
                <View key={modifier} style={styles.modifierItem}>
                  <View style={styles.modifierIcon}>
                    <Text style={styles.modifierIconText}>{getModifierIcon(modifier)}</Text>
                  </View>
                  <View style={styles.modifierInfo}>
                    <Text style={styles.modifierName}>{effect.name}</Text>
                    <Text style={styles.modifierDescription}>{effect.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Reward */}
          <View style={styles.rewardContainer}>
            <Text style={styles.rewardLabel}>Reward</Text>
            <View style={styles.rewardValue}>
              <Text style={styles.rewardIcon}>$</Text>
              <Text style={styles.rewardAmount}>{challenge.rewardCoins}</Text>
            </View>
          </View>

          {/* Completion Badge */}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>COMPLETED!</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Attempts</Text>
            <Text style={styles.statValue}>{progress?.attempts ?? 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>{progress?.bestAttempt ?? 0}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Play Button */}
      <TouchableOpacity
        style={[styles.playButton, isCompleted && styles.playButtonCompleted]}
        onPress={() => onPlay(challenge)}
        activeOpacity={0.8}
      >
        <Text style={styles.playButtonText}>
          {isCompleted ? 'PLAY AGAIN' : 'START CHALLENGE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    fontVariant: ['tabular-nums'],
  },
  challengeCard: {
    backgroundColor: '#2A2A4E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  challengeCardCompleted: {
    borderColor: '#4CAF50',
  },
  challengeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  goalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  goalIconText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  goalText: {
    flex: 1,
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
  modifiersContainer: {
    marginBottom: 20,
  },
  modifiersTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  modifierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  modifierIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modifierIconText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  modifierInfo: {
    flex: 1,
  },
  modifierName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  modifierDescription: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },
  rewardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
  },
  rewardLabel: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  rewardValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 24,
    color: '#FFD700',
    marginRight: 5,
  },
  rewardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  completedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2A2A4E',
    borderRadius: 15,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  playButton: {
    backgroundColor: '#FF6B35',
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  playButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
  },
});
