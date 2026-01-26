/**
 * GameHud - Enhanced HUD with all game systems
 *
 * Displays:
 * - Distance and coins
 * - Fuel bar
 * - Boost bar
 * - Combo counter and multiplier
 * - Tier labels
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ComboState, ComboTier, getComboTierColor } from '../game/systems/combo';
import { BoostState, getBoostBarColor } from '../game/systems/boost';

export type GameHudProps = {
  /** Distance traveled in meters */
  distance: number;
  /** Current fuel percentage (0-100) */
  fuelPercentage: number;
  /** Is fuel at low warning level */
  isFuelLow: boolean;
  /** Coins collected */
  coins: number;
  /** Best distance achieved (for comparison) */
  bestDistance?: number;
  /** Time elapsed in seconds */
  timeElapsed?: number;
  /** Combo state */
  comboState?: ComboState;
  /** Boost state */
  boostState?: BoostState;
  /** Total trick points */
  trickPoints?: number;
};

export function GameHud({
  distance,
  fuelPercentage,
  isFuelLow,
  coins,
  bestDistance,
  timeElapsed,
  comboState,
  boostState,
  trickPoints = 0,
}: GameHudProps) {
  const isNewBest = bestDistance !== undefined && distance > bestDistance;

  return (
    <View style={styles.container}>
      {/* Top Row: Distance and Time */}
      <View style={styles.topRow}>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceValue}>{Math.floor(distance)}</Text>
          <Text style={styles.distanceUnit}>m</Text>
          {isNewBest && <Text style={styles.newBest}>NEW BEST!</Text>}
        </View>
        {timeElapsed !== undefined && (
          <Text style={styles.timeValue}>{formatTime(timeElapsed)}</Text>
        )}
      </View>

      {/* Fuel bar */}
      <View style={styles.barContainer}>
        <Text style={styles.barLabel}>FUEL</Text>
        <View style={styles.barOuter}>
          <View
            style={[
              styles.barInner,
              {
                width: `${Math.max(0, Math.min(100, fuelPercentage))}%`,
                backgroundColor: isFuelLow ? '#FF4444' : '#4CAF50',
              },
            ]}
          />
        </View>
        {isFuelLow && <Text style={styles.warning}>LOW!</Text>}
      </View>

      {/* Boost bar */}
      {boostState && (
        <View style={styles.barContainer}>
          <Text style={styles.barLabel}>BOOST</Text>
          <View style={styles.barOuter}>
            <View
              style={[
                styles.barInner,
                {
                  width: `${(boostState.amount / boostState.maxAmount) * 100}%`,
                  backgroundColor: getBoostBarColor(boostState),
                },
              ]}
            />
          </View>
          {boostState.isBoosting && (
            <Text style={styles.boostActive}>ACTIVE!</Text>
          )}
        </View>
      )}

      {/* Coins and Trick Points Row */}
      <View style={styles.statsRow}>
        <View style={styles.coinsContainer}>
          <Text style={styles.coinIcon}>&#9679;</Text>
          <Text style={styles.coinValue}>{coins}</Text>
        </View>
        {trickPoints > 0 && (
          <View style={styles.trickPointsContainer}>
            <Text style={styles.trickPointsLabel}>TRICKS</Text>
            <Text style={styles.trickPointsValue}>{trickPoints}</Text>
          </View>
        )}
      </View>

      {/* Combo Display (when active) */}
      {comboState && comboState.isActive && (
        <ComboDisplay comboState={comboState} />
      )}
    </View>
  );
}

/**
 * Combo Display Component
 */
function ComboDisplay({ comboState }: { comboState: ComboState }) {
  const tierColor = getComboTierColor(comboState.tier);
  const tierLabel = getTierLabel(comboState.tier);
  const timerPercentage = (comboState.timeRemaining / 3000) * 100;

  return (
    <View style={styles.comboContainer}>
      {/* Combo counter */}
      <View style={styles.comboCounter}>
        <Text style={[styles.comboCount, { color: tierColor }]}>
          {comboState.count}x
        </Text>
        <Text style={styles.comboMultiplier}>
          {comboState.multiplier.toFixed(1)}x
        </Text>
      </View>

      {/* Tier label */}
      {tierLabel && (
        <Text style={[styles.tierLabel, { color: tierColor }]}>
          {tierLabel}
        </Text>
      )}

      {/* Combo timer bar */}
      <View style={styles.comboTimerOuter}>
        <View
          style={[
            styles.comboTimerInner,
            {
              width: `${timerPercentage}%`,
              backgroundColor: tierColor,
            },
          ]}
        />
      </View>

      {/* Combo points */}
      <Text style={styles.comboPoints}>{comboState.comboPoints} pts</Text>
    </View>
  );
}

function getTierLabel(tier: ComboTier): string {
  switch (tier) {
    case 'nice':
      return 'NICE!';
    case 'great':
      return 'GREAT!';
    case 'awesome':
      return 'AWESOME!';
    case 'legendary':
      return 'LEGENDARY!';
    default:
      return '';
  }
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  distanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  distanceUnit: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  newBest: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    width: 45,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  barOuter: {
    flex: 1,
    height: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  barInner: {
    height: '100%',
    borderRadius: 6,
  },
  warning: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF4444',
    marginLeft: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  boostActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: 20,
    color: '#FFD700',
    marginRight: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  coinValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trickPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trickPointsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 6,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  trickPointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Combo styles
  comboContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    alignItems: 'flex-end',
    marginTop: 30,
  },
  comboCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  comboCount: {
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  comboMultiplier: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tierLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    marginTop: 2,
  },
  comboTimerOuter: {
    width: 100,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  comboTimerInner: {
    height: '100%',
    borderRadius: 3,
  },
  comboPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});

export default GameHud;
