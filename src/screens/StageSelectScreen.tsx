/**
 * StageSelectScreen - Choose environment/stage to play
 */

import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getAllStages,
  getStage,
  isStageUnlocked,
  StageDefinition,
  StageId,
} from '../game/config/stages';
import { getProgressionManager } from '../game/progression/upgrades';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type StageSelectScreenProps = {
  onBack: () => void;
  onSelectStage: (stageId: StageId) => void;
  selectedStage?: StageId;
};

export default function StageSelectScreen({
  onBack,
  onSelectStage,
  selectedStage = 'countryside',
}: StageSelectScreenProps) {
  const [coins, setCoins] = useState(0);
  const [unlockedStages, setUnlockedStages] = useState<StageId[]>(['countryside']);
  const [currentSelection, setCurrentSelection] = useState<StageId>(selectedStage);

  useEffect(() => {
    const manager = getProgressionManager();
    manager.load().then((progress) => {
      setCoins(progress.coins);
      // For now, only countryside is unlocked by default
      // In a full implementation, this would come from saved progress
      setUnlockedStages(['countryside']);
    });
  }, []);

  const handleSelectStage = (stageId: StageId) => {
    if (isStageUnlocked(stageId, unlockedStages)) {
      setCurrentSelection(stageId);
    }
  };

  const handleUnlockStage = async (stage: StageDefinition) => {
    const manager = getProgressionManager();
    const progress = manager.getProgress();

    if (progress.coins >= stage.unlockCost) {
      // Deduct coins and unlock stage
      // This would be saved to AsyncStorage in a full implementation
      setUnlockedStages([...unlockedStages, stage.id]);
      setCoins(coins - stage.unlockCost);
    }
  };

  const handlePlay = () => {
    onSelectStage(currentSelection);
  };

  const stages = getAllStages();
  const selectedStageData = getStage(currentSelection);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Stage</Text>
        <View style={styles.coinsDisplay}>
          <Text style={styles.coinIcon}>⬤</Text>
          <Text style={styles.coinValue}>{coins}</Text>
        </View>
      </View>

      {/* Stage preview */}
      <View
        style={[
          styles.previewContainer,
          {
            backgroundColor: selectedStageData.visual.skyColorBottom,
          },
        ]}
      >
        <View
          style={[
            styles.previewSky,
            { backgroundColor: selectedStageData.visual.skyColorTop },
          ]}
        />
        <View
          style={[
            styles.previewGround,
            { backgroundColor: selectedStageData.visual.groundColor },
          ]}
        >
          <View
            style={[
              styles.previewSurface,
              { backgroundColor: selectedStageData.visual.surfaceColor },
            ]}
          />
        </View>
        <View style={styles.previewInfo}>
          <Text style={styles.previewName}>{selectedStageData.name}</Text>
          <Text style={styles.previewDescription}>
            {selectedStageData.description}
          </Text>
        </View>
      </View>

      {/* Stage modifiers */}
      <View style={styles.modifiersContainer}>
        <View style={styles.modifier}>
          <Text style={styles.modifierLabel}>Gravity</Text>
          <Text style={styles.modifierValue}>
            {(selectedStageData.physics.gravityMultiplier * 100).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.modifier}>
          <Text style={styles.modifierLabel}>Friction</Text>
          <Text style={styles.modifierValue}>
            {(selectedStageData.physics.frictionMultiplier * 100).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.modifier}>
          <Text style={styles.modifierLabel}>Coins</Text>
          <Text style={styles.modifierValue}>
            {selectedStageData.pickups.coinRateMultiplier}x
          </Text>
        </View>
      </View>

      {/* Stage list */}
      <ScrollView
        style={styles.stageList}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stageListContent}
      >
        {stages.map((stage) => {
          const isUnlocked = isStageUnlocked(stage.id, unlockedStages);
          const isSelected = stage.id === currentSelection;

          return (
            <TouchableOpacity
              key={stage.id}
              style={[
                styles.stageCard,
                isSelected && styles.stageCardSelected,
                !isUnlocked && styles.stageCardLocked,
              ]}
              onPress={() =>
                isUnlocked
                  ? handleSelectStage(stage.id)
                  : handleUnlockStage(stage)
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.stageThumb,
                  { backgroundColor: stage.visual.skyColorBottom },
                ]}
              >
                <View
                  style={[
                    styles.stageThumbGround,
                    { backgroundColor: stage.visual.surfaceColor },
                  ]}
                />
                {!isUnlocked && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockCost}>{stage.unlockCost} ⬤</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.stageName,
                  isSelected && styles.stageNameSelected,
                ]}
              >
                {stage.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Play button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={handlePlay}
        activeOpacity={0.8}
      >
        <Text style={styles.playButtonText}>PLAY</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A4E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  coinIcon: {
    fontSize: 14,
    color: '#FFD700',
    marginRight: 6,
  },
  coinValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  previewContainer: {
    height: 180,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewSky: {
    flex: 2,
  },
  previewGround: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  previewSurface: {
    height: 15,
  },
  previewInfo: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
  },
  previewName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modifiersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modifier: {
    alignItems: 'center',
    backgroundColor: '#2A2A4E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  modifierLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  modifierValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  stageList: {
    maxHeight: 160,
    marginBottom: 20,
  },
  stageListContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  stageCard: {
    width: 120,
    alignItems: 'center',
    borderRadius: 15,
    overflow: 'hidden',
  },
  stageCardSelected: {
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  stageCardLocked: {
    opacity: 0.7,
  },
  stageThumb: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
  },
  stageThumbGround: {
    height: 30,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 28,
  },
  lockCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 5,
  },
  stageName: {
    width: '100%',
    backgroundColor: '#2A2A4E',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  stageNameSelected: {
    backgroundColor: '#FF6B35',
  },
  playButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
});
