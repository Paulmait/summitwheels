/**
 * AchievementToast - Notification popup when achievements unlock
 *
 * Shows a slide-in toast notification with achievement details
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Achievement,
  getAchievementTierColor,
} from '../game/systems/achievements';
import { getAudioManager } from '../audio/AudioManager';
import { SFX_KEYS } from '../audio/audioKeys';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AchievementToastProps = {
  achievement: Achievement | null;
  onDismiss: () => void;
  autoHideDuration?: number;
};

export function AchievementToast({
  achievement,
  onDismiss,
  autoHideDuration = 4000,
}: AchievementToastProps) {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      // Play achievement sound
      const audioManager = getAudioManager();
      audioManager.playSfx(SFX_KEYS.NEW_BEST);
      audioManager.triggerHaptic('medium');

      setIsVisible(true);

      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto hide
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [achievement, autoHideDuration]);

  const handleDismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onDismiss();
    });
  }, [slideAnim, onDismiss]);

  if (!achievement || !isVisible) return null;

  const tierColor = getAchievementTierColor(achievement.tier);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toast}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        {/* Tier stripe */}
        <View style={[styles.tierStripe, { backgroundColor: tierColor }]} />

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{achievement.icon}</Text>
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.unlockText}>ACHIEVEMENT UNLOCKED!</Text>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.reward}>
              +{achievement.rewardCoins} coins
              {achievement.rewardUnlock && ` + ${achievement.rewardUnlock} unlocked!`}
            </Text>
          </View>

          {/* Tier badge */}
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierText}>
              {achievement.tier.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Achievement Toast Manager - Queue and display achievements
 */
type QueuedAchievement = Achievement;

let toastQueue: QueuedAchievement[] = [];
let showToastCallback: ((achievement: Achievement) => void) | null = null;

export function queueAchievementToast(achievement: Achievement) {
  if (showToastCallback) {
    showToastCallback(achievement);
  } else {
    toastQueue.push(achievement);
  }
}

export function useAchievementToast() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(
    null
  );

  useEffect(() => {
    showToastCallback = (achievement: Achievement) => {
      if (currentAchievement) {
        // Queue if already showing
        toastQueue.push(achievement);
      } else {
        setCurrentAchievement(achievement);
      }
    };

    // Process any queued toasts
    if (!currentAchievement && toastQueue.length > 0) {
      setCurrentAchievement(toastQueue.shift()!);
    }

    return () => {
      showToastCallback = null;
    };
  }, [currentAchievement]);

  const handleDismiss = useCallback(() => {
    setCurrentAchievement(null);
    // Show next queued toast
    setTimeout(() => {
      if (toastQueue.length > 0) {
        setCurrentAchievement(toastQueue.shift()!);
      }
    }, 300);
  }, []);

  return {
    currentAchievement,
    handleDismiss,
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#2C3E50',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tierStripe: {
    height: 4,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  unlockText: {
    fontSize: 10,
    color: '#27AE60',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  reward: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
});
