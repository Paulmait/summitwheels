/**
 * ShopScreen - Unified shop for all purchasable items
 *
 * Tabs:
 * - Vehicles: Unlock new vehicles with coins
 * - Stages: Unlock new stages with coins
 * - Upgrades: Upgrade current vehicle
 * - Coins: Purchase coin packs with real money
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
import { getProgressionManager, PlayerProgress, UpgradeLevels } from '../game/progression/upgrades';
import { VEHICLES, VehicleDefinition } from '../game/config/vehicles';
import { STAGES, StageDefinition } from '../game/config/stages';
import { useUISound } from '../hooks/useUISound';
import {
  CONSUMABLE_PRODUCTS,
  COIN_PACK_VALUES,
  DISPLAY_PRICES,
} from '../iap/iapKeys';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ShopScreenProps = {
  onBack: () => void;
  onPurchaseCoins?: (productId: string) => void;
};

type ShopTab = 'vehicles' | 'stages' | 'upgrades' | 'coins';

const TABS: { key: ShopTab; label: string; icon: string }[] = [
  { key: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { key: 'stages', label: 'Stages', icon: '🏔️' },
  { key: 'upgrades', label: 'Upgrades', icon: '🔧' },
  { key: 'coins', label: 'Coins', icon: '🪙' },
];

type UpgradeKey = 'engine' | 'tires' | 'suspension' | 'fuelTank';

const UPGRADE_TYPES: { key: UpgradeKey; label: string; icon: string; description: string }[] = [
  { key: 'engine', label: 'Engine', icon: '🔥', description: 'More power' },
  { key: 'tires', label: 'Tires', icon: '⚫', description: 'Better grip' },
  { key: 'suspension', label: 'Suspension', icon: '🔩', description: 'Smoother ride' },
  { key: 'fuelTank', label: 'Fuel Tank', icon: '⛽', description: 'More fuel' },
];

export default function ShopScreen({ onBack, onPurchaseCoins }: ShopScreenProps) {
  const [selectedTab, setSelectedTab] = useState<ShopTab>('vehicles');
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const { playClick, playConfirm, playError } = useUISound();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const manager = getProgressionManager();
    const p = await manager.load();
    setProgress(p);
  };

  const handleTabSelect = useCallback(
    (tab: ShopTab) => {
      playClick();
      setSelectedTab(tab);
    },
    [playClick]
  );

  const handleBack = useCallback(() => {
    playClick();
    onBack();
  }, [playClick, onBack]);

  const handleUnlockVehicle = useCallback(
    async (vehicle: VehicleDefinition) => {
      if (!progress || progress.coins < vehicle.unlockCost) {
        playError();
        return;
      }

      playConfirm();
      const manager = getProgressionManager();
      manager.addCoins(-vehicle.unlockCost);
      // TODO: Actually unlock the vehicle
      await loadProgress();
    },
    [progress, playConfirm, playError]
  );

  const handleUnlockStage = useCallback(
    async (stage: StageDefinition) => {
      if (!progress || progress.coins < stage.unlockCost) {
        playError();
        return;
      }

      playConfirm();
      const manager = getProgressionManager();
      manager.addCoins(-stage.unlockCost);
      // TODO: Actually unlock the stage
      await loadProgress();
    },
    [progress, playConfirm, playError]
  );

  const handleUpgrade = useCallback(
    async (upgradeType: UpgradeKey) => {
      if (!progress) return;

      const vehicleUpgrades = progress.vehicleUpgrades[progress.selectedVehicle] as UpgradeLevels | undefined;
      const currentLevel = vehicleUpgrades?.[upgradeType] ?? 0;
      const cost = Math.floor(100 * Math.pow(1.5, currentLevel));

      if (progress.coins < cost) {
        playError();
        return;
      }

      playConfirm();
      const manager = getProgressionManager();
      manager.addCoins(-cost);
      // TODO: Actually apply upgrade
      await loadProgress();
    },
    [progress, playConfirm, playError]
  );

  const handlePurchaseCoinPack = useCallback(
    (productId: string) => {
      playClick();
      onPurchaseCoins?.(productId);
    },
    [playClick, onPurchaseCoins]
  );

  const renderVehiclesTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentContainer}
    >
      {Object.values(VEHICLES).map((vehicle) => {
        const isUnlocked =
          vehicle.id === 'jeep' ||
          progress?.unlockedVehicles?.includes(vehicle.id);
        const canAfford = (progress?.coins ?? 0) >= vehicle.unlockCost;

        return (
          <View key={vehicle.id} style={styles.itemCard}>
            <View style={styles.itemPreview}>
              <View
                style={[styles.vehicleBody, { backgroundColor: vehicle.visual.bodyColor }]}
              />
              <View style={styles.vehicleWheels}>
                <View style={styles.wheel} />
                <View style={styles.wheel} />
              </View>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{vehicle.name}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>
                {vehicle.description}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.statText}>Speed: {'★'.repeat(vehicle.starRating.speed)}</Text>
                <Text style={styles.statText}>Grip: {'★'.repeat(vehicle.starRating.grip)}</Text>
              </View>
            </View>
            <View style={styles.itemAction}>
              {isUnlocked ? (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedText}>OWNED</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.buyButton,
                    !canAfford && styles.buyButtonDisabled,
                  ]}
                  onPress={() => handleUnlockVehicle(vehicle)}
                  disabled={!canAfford}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buyButtonText}>
                    {vehicle.unlockCost} 🪙
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderStagesTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentContainer}
    >
      {Object.values(STAGES).map((stage) => {
        const isUnlocked =
          stage.id === 'countryside' ||
          progress?.unlockedStages?.includes(stage.id);
        const canAfford = (progress?.coins ?? 0) >= stage.unlockCost;

        return (
          <View key={stage.id} style={styles.itemCard}>
            <View
              style={[
                styles.stagePreview,
                { backgroundColor: stage.visual.skyColorTop },
              ]}
            >
              <View
                style={[
                  styles.stageGround,
                  { backgroundColor: stage.visual.groundColor },
                ]}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{stage.name}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>
                {stage.description}
              </Text>
              <View style={styles.modifiersRow}>
                <Text style={styles.modifierText}>
                  Gravity: {Math.round(stage.physics.gravityMultiplier * 100)}%
                </Text>
                <Text style={styles.modifierText}>
                  Coins: {stage.pickups.coinRateMultiplier}x
                </Text>
              </View>
            </View>
            <View style={styles.itemAction}>
              {isUnlocked ? (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedText}>OWNED</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.buyButton,
                    !canAfford && styles.buyButtonDisabled,
                  ]}
                  onPress={() => handleUnlockStage(stage)}
                  disabled={!canAfford}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buyButtonText}>
                    {stage.unlockCost} 🪙
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderUpgradesTab = () => {
    const vehicleUpgrades = (
      progress?.vehicleUpgrades[progress.selectedVehicle] ?? { engine: 0, tires: 0, suspension: 0, fuelTank: 0 }
    ) as UpgradeLevels;

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentContainer}
      >
        <Text style={styles.upgradeHeader}>
          Upgrading: {progress?.selectedVehicle ?? 'Jeep'}
        </Text>
        {UPGRADE_TYPES.map((upgrade) => {
          const level = vehicleUpgrades[upgrade.key] ?? 0;
          const maxLevel = 10;
          const isMaxed = level >= maxLevel;
          const cost = Math.floor(100 * Math.pow(1.5, level));
          const canAfford = (progress?.coins ?? 0) >= cost;

          return (
            <View key={upgrade.key} style={styles.upgradeCard}>
              <View style={styles.upgradeIcon}>
                <Text style={styles.upgradeIconText}>{upgrade.icon}</Text>
              </View>
              <View style={styles.upgradeInfo}>
                <Text style={styles.upgradeName}>{upgrade.label}</Text>
                <Text style={styles.upgradeDesc}>{upgrade.description}</Text>
                <View style={styles.levelBar}>
                  {Array.from({ length: maxLevel }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.levelSegment,
                        i < level && styles.levelSegmentFilled,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.levelText}>
                  Level {level}/{maxLevel}
                </Text>
              </View>
              <View style={styles.upgradeAction}>
                {isMaxed ? (
                  <View style={styles.maxedBadge}>
                    <Text style={styles.maxedText}>MAX</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.upgradeButton,
                      !canAfford && styles.upgradeButtonDisabled,
                    ]}
                    onPress={() => handleUpgrade(upgrade.key)}
                    disabled={!canAfford}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.upgradeButtonText}>{cost} 🪙</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderCoinsTab = () => {
    const coinPacks = [
      {
        id: CONSUMABLE_PRODUCTS.COINS_SMALL,
        coins: COIN_PACK_VALUES[CONSUMABLE_PRODUCTS.COINS_SMALL],
        price: DISPLAY_PRICES[CONSUMABLE_PRODUCTS.COINS_SMALL],
        label: 'Small Pack',
        icon: '🪙',
      },
      {
        id: CONSUMABLE_PRODUCTS.COINS_MEDIUM,
        coins: COIN_PACK_VALUES[CONSUMABLE_PRODUCTS.COINS_MEDIUM],
        price: DISPLAY_PRICES[CONSUMABLE_PRODUCTS.COINS_MEDIUM],
        label: 'Medium Pack',
        icon: '💰',
        popular: true,
      },
      {
        id: CONSUMABLE_PRODUCTS.COINS_LARGE,
        coins: COIN_PACK_VALUES[CONSUMABLE_PRODUCTS.COINS_LARGE],
        price: DISPLAY_PRICES[CONSUMABLE_PRODUCTS.COINS_LARGE],
        label: 'Large Pack',
        icon: '💎',
        bestValue: true,
      },
    ];

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentContainer}
      >
        <Text style={styles.coinPackHeader}>Get More Coins!</Text>
        {coinPacks.map((pack) => (
          <View
            key={pack.id}
            style={[
              styles.coinPackCard,
              pack.popular && styles.coinPackPopular,
              pack.bestValue && styles.coinPackBestValue,
            ]}
          >
            {pack.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}
            {pack.bestValue && (
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
            )}
            <Text style={styles.coinPackIcon}>{pack.icon}</Text>
            <Text style={styles.coinPackLabel}>{pack.label}</Text>
            <Text style={styles.coinPackAmount}>
              {pack.coins.toLocaleString()} Coins
            </Text>
            <TouchableOpacity
              style={styles.coinPackButton}
              onPress={() => handlePurchaseCoinPack(pack.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.coinPackButtonText}>{pack.price}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
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
        <Text style={styles.title}>Shop</Text>
        <View style={styles.coinDisplay}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinValue}>{progress?.coins ?? 0}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.tabSelected,
            ]}
            onPress={() => handleTabSelect(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                selectedTab === tab.key && styles.tabLabelSelected,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {selectedTab === 'vehicles' && renderVehiclesTab()}
      {selectedTab === 'stages' && renderStagesTab()}
      {selectedTab === 'upgrades' && renderUpgradesTab()}
      {selectedTab === 'coins' && renderCoinsTab()}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  coinIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  coinValue: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#16213E',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabSelected: {
    backgroundColor: '#FF6B35',
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    color: '#BDC3C7',
    fontSize: 11,
    marginTop: 2,
  },
  tabLabelSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#2C3E50',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  itemPreview: {
    width: 70,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleBody: {
    width: 50,
    height: 25,
    borderRadius: 5,
  },
  vehicleWheels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 50,
    marginTop: -5,
  },
  wheel: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#333',
  },
  stagePreview: {
    width: 70,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  stageGround: {
    height: 20,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  itemDesc: {
    fontSize: 12,
    color: '#BDC3C7',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 10,
  },
  statText: {
    fontSize: 11,
    color: '#F39C12',
  },
  modifiersRow: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 10,
  },
  modifierText: {
    fontSize: 11,
    color: '#3498DB',
  },
  itemAction: {
    marginLeft: 10,
  },
  buyButton: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyButtonDisabled: {
    backgroundColor: '#7F8C8D',
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ownedBadge: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ownedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  upgradeHeader: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  upgradeCard: {
    flexDirection: 'row',
    backgroundColor: '#2C3E50',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  upgradeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeIconText: {
    fontSize: 28,
  },
  upgradeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  upgradeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  upgradeDesc: {
    fontSize: 12,
    color: '#BDC3C7',
  },
  levelBar: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 3,
  },
  levelSegment: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  levelSegmentFilled: {
    backgroundColor: '#27AE60',
  },
  levelText: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 4,
  },
  upgradeAction: {
    marginLeft: 10,
  },
  upgradeButton: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  upgradeButtonDisabled: {
    backgroundColor: '#7F8C8D',
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  maxedBadge: {
    backgroundColor: '#9B59B6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  maxedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  coinPackHeader: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  coinPackCard: {
    backgroundColor: '#2C3E50',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coinPackPopular: {
    borderColor: '#3498DB',
    backgroundColor: '#1E3A4F',
  },
  coinPackBestValue: {
    borderColor: '#FFD700',
    backgroundColor: '#3D3314',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#3498DB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bestValueText: {
    color: '#1A1A2E',
    fontSize: 11,
    fontWeight: 'bold',
  },
  coinPackIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  coinPackLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  coinPackAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginVertical: 10,
  },
  coinPackButton: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  coinPackButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
