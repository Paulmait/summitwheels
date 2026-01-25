/**
 * RunEndModal - Displays run results and options
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type RunEndModalProps = {
  /** Distance traveled in meters */
  distance: number;
  /** Coins collected this run */
  coins: number;
  /** Best distance ever achieved */
  bestDistance: number;
  /** Is this a new best */
  isNewBest: boolean;
  /** Time elapsed in seconds */
  timeElapsed: number;
  /** Reason for run end */
  endReason: 'crash' | 'outOfFuel' | 'manual' | undefined;
  /** Callback for restart button */
  onRestart: () => void;
  /** Callback for home button */
  onHome?: () => void;
  /** Callback for double coins (ad) */
  onDoubleCoins?: () => void;
  /** Callback for revive (ad) */
  onRevive?: () => void;
  /** Whether revive is available */
  canRevive?: boolean;
};

export function RunEndModal({
  distance,
  coins,
  bestDistance,
  isNewBest,
  timeElapsed,
  endReason,
  onRestart,
  onHome,
  onDoubleCoins,
  onRevive,
  canRevive = false,
}: RunEndModalProps) {
  const getTitle = (): string => {
    switch (endReason) {
      case 'crash':
        return 'CRASHED!';
      case 'outOfFuel':
        return 'OUT OF FUEL!';
      default:
        return 'RUN OVER';
    }
  };

  const getTitleColor = (): string => {
    switch (endReason) {
      case 'crash':
        return '#FF4444';
      case 'outOfFuel':
        return '#FF8800';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        {/* Title */}
        <Text style={[styles.title, { color: getTitleColor() }]}>
          {getTitle()}
        </Text>

        {/* New best banner */}
        {isNewBest && (
          <View style={styles.newBestBanner}>
            <Text style={styles.newBestText}>NEW BEST!</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>
              {Math.floor(distance)}m
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>
              {Math.floor(Math.max(distance, bestDistance))}m
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Coins</Text>
            <Text style={[styles.statValue, styles.coinValue]}>
              +{coins}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>
              {formatTime(timeElapsed)}
            </Text>
          </View>
        </View>

        {/* Revive button (if available) */}
        {canRevive && onRevive && (
          <TouchableOpacity
            style={[styles.button, styles.reviveButton]}
            onPress={onRevive}
          >
            <Text style={styles.buttonText}>REVIVE</Text>
            <Text style={styles.adLabel}>Watch Ad</Text>
          </TouchableOpacity>
        )}

        {/* Double coins button */}
        {onDoubleCoins && coins > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.doubleButton]}
            onPress={onDoubleCoins}
          >
            <Text style={styles.buttonText}>DOUBLE COINS</Text>
            <Text style={styles.adLabel}>Watch Ad</Text>
          </TouchableOpacity>
        )}

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          {onHome && (
            <TouchableOpacity
              style={[styles.button, styles.homeButton]}
              onPress={onHome}
            >
              <Text style={styles.buttonText}>HOME</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.restartButton]}
            onPress={onRestart}
          >
            <Text style={styles.buttonText}>PLAY AGAIN</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  newBestBanner: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 15,
  },
  newBestText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 18,
    color: '#AAA',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  coinValue: {
    color: '#FFD700',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  reviveButton: {
    backgroundColor: '#4CAF50',
  },
  doubleButton: {
    backgroundColor: '#9C27B0',
  },
  homeButton: {
    flex: 1,
    backgroundColor: '#666',
    marginRight: 10,
  },
  restartButton: {
    flex: 2,
    backgroundColor: '#FF6B35',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  adLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 10,
  },
});

export default RunEndModal;
