/**
 * Daily Reward Modal - Displays daily login rewards
 *
 * Features:
 * - 7-day reward calendar
 * - Streak bonus display
 * - Animated reward claim
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import {
  DailyRewardSystem,
  DAILY_REWARDS,
  DailyReward,
} from '../systems/DailyRewardSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DailyRewardModalProps = {
  visible: boolean;
  onClose: () => void;
  onClaim: (reward: DailyReward, bonus: number) => void;
};

export function DailyRewardModal({ visible, onClose, onClaim }: DailyRewardModalProps) {
  const [currentDay, setCurrentDay] = useState(1);
  const [streak, setStreak] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [claimAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      loadState();
      // Animate in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadState = async () => {
    const state = await DailyRewardSystem.load();
    setCurrentDay(state.nextRewardDay);
    setStreak(state.currentStreak);
    setCanClaim(!state.dailyGiftClaimed);
    setClaimed(state.dailyGiftClaimed);
  };

  const handleClaim = async () => {
    if (!canClaim || claimed) return;

    const result = await DailyRewardSystem.claimDailyReward();
    if (result.success && result.reward) {
      setClaimed(true);
      setCanClaim(false);

      // Animate claim
      Animated.sequence([
        Animated.timing(claimAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(claimAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClaim(result.reward!, result.streakBonus ?? 0);
      });
    }
  };

  const getRewardIcon = (type: string): string => {
    switch (type) {
      case 'coins':
      case 'coin':
        return '$';
      case 'fuel_bonus':
        return 'F';
      case 'boost':
        return 'B';
      case 'mystery_box':
        return '?';
      default:
        return '*';
    }
  };

  const streakInfo = DailyRewardSystem.getStreakInfo();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Daily Rewards</Text>
            <View style={styles.streakContainer}>
              <Text style={styles.streakLabel}>Streak</Text>
              <Text style={styles.streakValue}>{streak}</Text>
              <Text style={styles.streakBonus}>+{streakInfo.bonusPercentage}% bonus</Text>
            </View>
          </View>

          {/* Reward Calendar */}
          <View style={styles.calendar}>
            {DAILY_REWARDS.map((reward, index) => {
              const isToday = reward.day === currentDay;
              const isPast = reward.day < currentDay;
              const isFuture = reward.day > currentDay;

              return (
                <View
                  key={reward.day}
                  style={[
                    styles.dayCard,
                    isToday && styles.dayCardToday,
                    isPast && styles.dayCardPast,
                    isFuture && styles.dayCardFuture,
                  ]}
                >
                  <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                    Day {reward.day}
                  </Text>
                  <View
                    style={[
                      styles.rewardIcon,
                      reward.isPremium && styles.rewardIconPremium,
                      isToday && styles.rewardIconToday,
                    ]}
                  >
                    <Text style={styles.rewardIconText}>{getRewardIcon(reward.type)}</Text>
                  </View>
                  <Text
                    style={[styles.rewardAmount, isToday && styles.rewardAmountToday]}
                    numberOfLines={1}
                  >
                    {reward.description}
                  </Text>
                  {isPast && <Text style={styles.checkmark}>V</Text>}
                </View>
              );
            })}
          </View>

          {/* Claim Button */}
          <Animated.View
            style={[
              styles.claimButtonContainer,
              {
                transform: [
                  {
                    scale: claimAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.claimButton, !canClaim && styles.claimButtonDisabled]}
              onPress={handleClaim}
              disabled={!canClaim}
            >
              <Text style={styles.claimButtonText}>
                {claimed ? 'Claimed!' : canClaim ? 'Claim Reward' : 'Come Back Tomorrow'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
        </Animated.View>
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
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 40, 500),
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  streakContainer: {
    alignItems: 'center',
    backgroundColor: '#2A2A4E',
    borderRadius: 10,
    padding: 10,
  },
  streakLabel: {
    fontSize: 10,
    color: '#888',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  streakBonus: {
    fontSize: 10,
    color: '#4CAF50',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCard: {
    width: '13%',
    aspectRatio: 0.8,
    backgroundColor: '#2A2A4E',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    marginBottom: 5,
  },
  dayCardToday: {
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  dayCardPast: {
    backgroundColor: '#1A3A1A',
  },
  dayCardFuture: {
    opacity: 0.5,
  },
  dayNumber: {
    fontSize: 8,
    color: '#888',
    marginBottom: 2,
  },
  dayNumberToday: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  rewardIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3A3A5E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  rewardIconPremium: {
    backgroundColor: '#9C27B0',
  },
  rewardIconToday: {
    backgroundColor: '#FFD700',
  },
  rewardIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  rewardAmount: {
    fontSize: 7,
    color: '#CCC',
    textAlign: 'center',
  },
  rewardAmountToday: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  checkmark: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  claimButtonContainer: {
    marginBottom: 10,
  },
  claimButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  claimButtonDisabled: {
    backgroundColor: '#555',
  },
  claimButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
