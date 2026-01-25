/**
 * HUD Component - Displays game stats during run
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type HudProps = {
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
};

export function Hud({
  distance,
  fuelPercentage,
  isFuelLow,
  coins,
  bestDistance,
  timeElapsed,
}: HudProps) {
  const isNewBest = bestDistance !== undefined && distance > bestDistance;

  return (
    <View style={styles.container}>
      {/* Distance */}
      <View style={styles.distanceContainer}>
        <Text style={styles.distanceValue}>{Math.floor(distance)}</Text>
        <Text style={styles.distanceUnit}>m</Text>
        {isNewBest && <Text style={styles.newBest}>NEW BEST!</Text>}
      </View>

      {/* Fuel bar */}
      <View style={styles.fuelContainer}>
        <Text style={styles.fuelLabel}>FUEL</Text>
        <View style={styles.fuelBarOuter}>
          <View
            style={[
              styles.fuelBarInner,
              {
                width: `${Math.max(0, Math.min(100, fuelPercentage))}%`,
                backgroundColor: isFuelLow ? '#FF4444' : '#4CAF50',
              },
            ]}
          />
        </View>
        {isFuelLow && <Text style={styles.fuelWarning}>LOW!</Text>}
      </View>

      {/* Coins */}
      <View style={styles.coinsContainer}>
        <Text style={styles.coinIcon}>⬤</Text>
        <Text style={styles.coinValue}>{coins}</Text>
      </View>

      {/* Time (optional) */}
      {timeElapsed !== undefined && (
        <View style={styles.timeContainer}>
          <Text style={styles.timeValue}>
            {formatTime(timeElapsed)}
          </Text>
        </View>
      )}
    </View>
  );
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
  fuelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  fuelLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  fuelBarOuter: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  fuelBarInner: {
    height: '100%',
    borderRadius: 8,
  },
  fuelWarning: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4444',
    marginLeft: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
  timeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default Hud;
