/**
 * GarageScreen - Vehicle upgrades and progression
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import {
  getProgressionManager,
  ProgressionManager,
  PlayerProgress,
  UpgradeInfo,
} from '../game/progression/upgrades';
import { getUpgradeDisplayName } from '../game/config/vehicleConfig';

type GarageScreenProps = {
  onBack?: () => void;
  onPlay?: () => void;
};

export default function GarageScreen({ onBack, onPlay }: GarageScreenProps) {
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [upgrades, setUpgrades] = useState<UpgradeInfo[]>([]);
  const [manager, setManager] = useState<ProgressionManager | null>(null);

  useEffect(() => {
    const pm = getProgressionManager();
    setManager(pm);

    pm.load().then((p) => {
      setProgress(p);
      setUpgrades(pm.getAllUpgradeInfos());
    });
  }, []);

  const handleUpgrade = async (type: UpgradeInfo['type']) => {
    if (!manager) return;

    const success = await manager.purchaseUpgrade(type);
    if (success) {
      setProgress(manager.getProgress());
      setUpgrades(manager.getAllUpgradeInfos());
    }
  };

  if (!progress) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Garage</Text>
        <View style={styles.coinsContainer}>
          <Text style={styles.coinIcon}>⬤</Text>
          <Text style={styles.coinValue}>{progress.coins}</Text>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Stats</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Best Distance</Text>
          <Text style={styles.statValue}>{Math.floor(progress.bestDistance)}m</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Total Runs</Text>
          <Text style={styles.statValue}>{progress.totalRuns}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Total Coins Earned</Text>
          <Text style={styles.statValue}>{progress.totalCoins}</Text>
        </View>
      </View>

      {/* Upgrades */}
      <ScrollView style={styles.upgradesContainer}>
        <Text style={styles.sectionTitle}>Upgrades</Text>
        {upgrades.map((upgrade) => (
          <View key={upgrade.type} style={styles.upgradeCard}>
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeName}>
                {getUpgradeDisplayName(upgrade.type)}
              </Text>
              <Text style={styles.upgradeLevel}>
                Level {upgrade.currentLevel}/{upgrade.maxLevel}
              </Text>
              <View style={styles.levelBar}>
                <View
                  style={[
                    styles.levelFill,
                    {
                      width: `${
                        (upgrade.currentLevel / upgrade.maxLevel) * 100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.upgradeButton,
                upgrade.isMaxed && styles.upgradeButtonMaxed,
                !upgrade.canAfford && !upgrade.isMaxed && styles.upgradeButtonDisabled,
              ]}
              onPress={() => handleUpgrade(upgrade.type)}
              disabled={upgrade.isMaxed || !upgrade.canAfford}
            >
              {upgrade.isMaxed ? (
                <Text style={styles.upgradeButtonText}>MAX</Text>
              ) : (
                <>
                  <Text style={styles.upgradeButtonText}>Upgrade</Text>
                  <Text style={styles.upgradeCost}>{upgrade.cost} ⬤</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Play Button */}
      {onPlay && (
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Text style={styles.playButtonText}>PLAY</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 20,
    marginTop: 40,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A4E',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinIcon: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 6,
  },
  coinValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statsCard: {
    backgroundColor: '#2A2A4E',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#AAA',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  upgradesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 15,
  },
  upgradeCard: {
    flexDirection: 'row',
    backgroundColor: '#2A2A4E',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  upgradeLevel: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 4,
  },
  levelBar: {
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 3,
  },
  upgradeButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    minWidth: 100,
  },
  upgradeButtonMaxed: {
    backgroundColor: '#4CAF50',
  },
  upgradeButtonDisabled: {
    backgroundColor: '#666',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  upgradeCost: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 15,
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
