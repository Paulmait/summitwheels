/**
 * VehicleSelectScreen - Choose vehicle to play with
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getAllVehicles,
  getVehicle,
  isVehicleUnlocked,
  VehicleDefinition,
  VehicleId,
} from '../game/config/vehicles';
import { getProgressionManager } from '../game/progression/upgrades';

export type VehicleSelectScreenProps = {
  onBack: () => void;
  onSelectVehicle: (vehicleId: VehicleId) => void;
  selectedVehicle?: VehicleId;
};

export default function VehicleSelectScreen({
  onBack,
  onSelectVehicle,
  selectedVehicle = 'jeep',
}: VehicleSelectScreenProps) {
  const [coins, setCoins] = useState(0);
  const [unlockedVehicles, setUnlockedVehicles] = useState<VehicleId[]>(['jeep']);
  const [currentSelection, setCurrentSelection] = useState<VehicleId>(selectedVehicle);

  useEffect(() => {
    const manager = getProgressionManager();
    manager.load().then((progress) => {
      setCoins(progress.coins);
      // For now, only jeep is unlocked by default
      setUnlockedVehicles(['jeep']);
    });
  }, []);

  const handleSelectVehicle = (vehicleId: VehicleId) => {
    if (isVehicleUnlocked(vehicleId, unlockedVehicles)) {
      setCurrentSelection(vehicleId);
    }
  };

  const handleUnlockVehicle = async (vehicle: VehicleDefinition) => {
    const manager = getProgressionManager();
    const progress = manager.getProgress();

    if (progress.coins >= vehicle.unlockCost) {
      setUnlockedVehicles([...unlockedVehicles, vehicle.id]);
      setCoins(coins - vehicle.unlockCost);
    }
  };

  const handleSelect = () => {
    onSelectVehicle(currentSelection);
  };

  const vehicles = getAllVehicles();
  const selectedVehicleData = getVehicle(currentSelection);

  const renderStars = (count: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Text
            key={i}
            style={[styles.star, i <= count ? styles.starFilled : styles.starEmpty]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Vehicle</Text>
        <View style={styles.coinsDisplay}>
          <Text style={styles.coinIcon}>⬤</Text>
          <Text style={styles.coinValue}>{coins}</Text>
        </View>
      </View>

      {/* Vehicle preview */}
      <View style={styles.previewContainer}>
        <View style={styles.vehiclePreview}>
          {/* Simple vehicle representation */}
          <View
            style={[
              styles.vehicleBody,
              {
                backgroundColor: selectedVehicleData.visual.bodyColor,
                width: selectedVehicleData.visual.bodyWidth * 1.5,
                height: selectedVehicleData.visual.bodyHeight * 1.5,
              },
            ]}
          />
          <View style={styles.wheelsContainer}>
            <View
              style={[
                styles.wheel,
                {
                  backgroundColor: selectedVehicleData.visual.wheelColor,
                  width: selectedVehicleData.visual.wheelRadius * 2,
                  height: selectedVehicleData.visual.wheelRadius * 2,
                  borderRadius: selectedVehicleData.visual.wheelRadius,
                },
              ]}
            />
            <View
              style={[
                styles.wheel,
                {
                  backgroundColor: selectedVehicleData.visual.wheelColor,
                  width: selectedVehicleData.visual.wheelRadius * 2,
                  height: selectedVehicleData.visual.wheelRadius * 2,
                  borderRadius: selectedVehicleData.visual.wheelRadius,
                },
              ]}
            />
          </View>
        </View>
        <Text style={styles.vehicleName}>{selectedVehicleData.name}</Text>
        <Text style={styles.vehicleDescription}>
          {selectedVehicleData.description}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Speed</Text>
          {renderStars(selectedVehicleData.starRating.speed)}
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Grip</Text>
          {renderStars(selectedVehicleData.starRating.grip)}
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Fuel</Text>
          {renderStars(selectedVehicleData.starRating.fuel)}
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Stability</Text>
          {renderStars(selectedVehicleData.starRating.stability)}
        </View>
      </View>

      {/* Vehicle list */}
      <ScrollView
        style={styles.vehicleList}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vehicleListContent}
      >
        {vehicles.map((vehicle) => {
          const isUnlocked = isVehicleUnlocked(vehicle.id, unlockedVehicles);
          const isSelected = vehicle.id === currentSelection;

          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                isSelected && styles.vehicleCardSelected,
                !isUnlocked && styles.vehicleCardLocked,
              ]}
              onPress={() =>
                isUnlocked
                  ? handleSelectVehicle(vehicle.id)
                  : handleUnlockVehicle(vehicle)
              }
              activeOpacity={0.7}
            >
              <View style={styles.vehicleThumb}>
                <View
                  style={[
                    styles.thumbBody,
                    { backgroundColor: vehicle.visual.bodyColor },
                  ]}
                />
                {!isUnlocked && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.lockCost}>{vehicle.unlockCost} ⬤</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.vehicleCardName,
                  isSelected && styles.vehicleCardNameSelected,
                ]}
              >
                {vehicle.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Select button */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={handleSelect}
        activeOpacity={0.8}
      >
        <Text style={styles.selectButtonText}>SELECT</Text>
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
    alignItems: 'center',
    backgroundColor: '#2A2A4E',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 30,
    borderRadius: 20,
  },
  vehiclePreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  vehicleBody: {
    borderRadius: 10,
    marginBottom: 10,
  },
  wheelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 100,
  },
  wheel: {
    borderWidth: 3,
    borderColor: '#555',
  },
  vehicleName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 5,
  },
  statsContainer: {
    backgroundColor: '#2A2A4E',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#AAA',
    width: 80,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: '#444',
  },
  vehicleList: {
    maxHeight: 140,
    marginBottom: 20,
  },
  vehicleListContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  vehicleCard: {
    width: 100,
    alignItems: 'center',
    borderRadius: 15,
    overflow: 'hidden',
  },
  vehicleCardSelected: {
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  vehicleCardLocked: {
    opacity: 0.7,
  },
  vehicleThumb: {
    width: '100%',
    height: 80,
    backgroundColor: '#3A3A5E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbBody: {
    width: 50,
    height: 20,
    borderRadius: 5,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 24,
  },
  lockCost: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 3,
  },
  vehicleCardName: {
    width: '100%',
    backgroundColor: '#2A2A4E',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  vehicleCardNameSelected: {
    backgroundColor: '#FF6B35',
  },
  selectButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#2196F3',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
});
