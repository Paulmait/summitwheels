/**
 * AchievementsScreen - Display all achievements with progress
 *
 * Shows achievements by category with progress bars, tier badges,
 * and reward claiming functionality.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Achievement,
  AchievementCategory,
  AchievementProgress,
  ACHIEVEMENTS,
  createAchievementSystem,
  getAchievementTierColor,
  getCategoryIcon,
} from '../game/systems/achievements';
import { getAudioManager } from '../audio/AudioManager';
import { SFX_KEYS } from '../audio/audioKeys';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AchievementsScreenProps = {
  onBack: () => void;
};

type CategoryTab = 'all' | AchievementCategory;

const CATEGORIES: { key: CategoryTab; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '🏆' },
  { key: 'distance', label: 'Distance', icon: '🛣️' },
  { key: 'tricks', label: 'Tricks', icon: '🤸' },
  { key: 'collection', label: 'Collection', icon: '💰' },
  { key: 'mastery', label: 'Mastery', icon: '⭐' },
  { key: 'secret', label: 'Secret', icon: '🔒' },
];

export default function AchievementsScreen({ onBack }: AchievementsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');
  const [achievementProgress, setAchievementProgress] = useState<
    Record<string, AchievementProgress>
  >({});
  const [totalCoins, setTotalCoins] = useState(0);

  // Load achievement progress
  useEffect(() => {
    const system = createAchievementSystem();
    // TODO: Load from storage
    const progress = system.exportProgress();
    setAchievementProgress(progress);

    // Calculate unclaimed coins
    const unclaimed = system.getUnclaimedCoins();
    setTotalCoins(unclaimed);
  }, []);

  const handleCategorySelect = useCallback((category: CategoryTab) => {
    const audioManager = getAudioManager();
    audioManager.playSfx(SFX_KEYS.UI_CLICK);
    setSelectedCategory(category);
  }, []);

  const handleBack = useCallback(() => {
    const audioManager = getAudioManager();
    audioManager.playSfx(SFX_KEYS.UI_CLICK);
    onBack();
  }, [onBack]);

  const handleClaimReward = useCallback((achievementId: string) => {
    const audioManager = getAudioManager();
    audioManager.playSfx(SFX_KEYS.UPGRADE);

    // TODO: Actually claim the reward and persist
    setAchievementProgress((prev) => ({
      ...prev,
      [achievementId]: {
        ...prev[achievementId],
        rewardClaimed: true,
      },
    }));
  }, []);

  // Filter achievements by category
  const filteredAchievements =
    selectedCategory === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  // Count stats
  const totalUnlocked = ACHIEVEMENTS.filter(
    (a) => achievementProgress[a.id]?.unlocked
  ).length;
  const totalAchievements = ACHIEVEMENTS.length;

  const renderAchievementCard = (achievement: Achievement) => {
    const progress = achievementProgress[achievement.id] || {
      current: 0,
      unlocked: false,
      rewardClaimed: false,
    };
    const tierColor = getAchievementTierColor(achievement.tier);
    const progressPercent = Math.min(
      (progress.current / achievement.target) * 100,
      100
    );

    // Handle secret achievements
    const isSecret = achievement.isSecret && !progress.unlocked;
    const displayName = isSecret ? '???' : achievement.name;
    const displayDesc = isSecret
      ? 'Complete special conditions to unlock'
      : achievement.description;
    const displayIcon = isSecret ? '🔒' : achievement.icon;

    return (
      <View
        key={achievement.id}
        style={[
          styles.achievementCard,
          progress.unlocked && styles.achievementCardUnlocked,
        ]}
      >
        {/* Tier Badge */}
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierText}>
            {achievement.tier.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.achievementIcon}>{displayIcon}</Text>
        </View>

        {/* Content */}
        <View style={styles.achievementContent}>
          <Text
            style={[
              styles.achievementName,
              progress.unlocked && styles.achievementNameUnlocked,
            ]}
          >
            {displayName}
          </Text>
          <Text style={styles.achievementDesc}>{displayDesc}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: progress.unlocked ? '#27AE60' : '#3498DB',
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.unlocked
                ? 'Completed!'
                : `${progress.current}/${achievement.target}`}
            </Text>
          </View>

          {/* Reward */}
          <View style={styles.rewardContainer}>
            <Text style={styles.rewardText}>
              Reward: {achievement.rewardCoins} coins
              {achievement.rewardUnlock && ` + ${achievement.rewardUnlock}`}
            </Text>
            {progress.unlocked && !progress.rewardClaimed && (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => handleClaimReward(achievement.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.claimButtonText}>CLAIM</Text>
              </TouchableOpacity>
            )}
            {progress.rewardClaimed && (
              <Text style={styles.claimedText}>Claimed</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {totalUnlocked}/{totalAchievements}
          </Text>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              selectedCategory === cat.key && styles.categoryTabSelected,
            ]}
            onPress={() => handleCategorySelect(cat.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === cat.key && styles.categoryLabelSelected,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievement List */}
      <ScrollView
        style={styles.achievementList}
        contentContainerStyle={styles.achievementListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredAchievements.map(renderAchievementCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#16213E',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statsText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryTabs: {
    maxHeight: 70,
    backgroundColor: '#16213E',
  },
  categoryTabsContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  categoryTab: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryTabSelected: {
    backgroundColor: '#FF6B35',
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryLabel: {
    color: '#BDC3C7',
    fontSize: 12,
    marginTop: 2,
  },
  categoryLabelSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  achievementList: {
    flex: 1,
  },
  achievementListContent: {
    padding: 15,
    paddingBottom: 30,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#2C3E50',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  achievementCardUnlocked: {
    borderColor: '#27AE60',
    backgroundColor: '#1E3A2F',
  },
  tierBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A2E',
  },
  tierText: {
    color: '#1A1A2E',
    fontSize: 14,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementIcon: {
    fontSize: 28,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  achievementNameUnlocked: {
    color: '#27AE60',
  },
  achievementDesc: {
    fontSize: 13,
    color: '#BDC3C7',
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#BDC3C7',
    fontSize: 12,
    minWidth: 70,
    textAlign: 'right',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardText: {
    fontSize: 12,
    color: '#FFD700',
  },
  claimButton: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimedText: {
    color: '#27AE60',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
