/**
 * Lucky Spin Modal - Gacha/wheel spin mechanic
 *
 * Features:
 * - Animated spinning wheel
 * - Weighted prize distribution
 * - Free daily spin + paid spins
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { DailyRewardSystem, SPIN_PRIZES, SpinPrize } from '../systems/DailyRewardSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 80, 300);
const SEGMENT_COUNT = SPIN_PRIZES.length;

type LuckySpinModalProps = {
  visible: boolean;
  onClose: () => void;
  onPrizeWon: (prize: SpinPrize) => void;
  coinBalance: number;
  onBuySpin?: () => void;
};

/**
 * Calculate and display odds for App Store compliance
 * Apple requires odds disclosure before any loot box purchase
 */
function getOddsDisclosure(): string {
  const totalProbability = SPIN_PRIZES.reduce((sum, p) => sum + p.probability, 0);
  const odds = SPIN_PRIZES.map(prize => {
    const percentage = ((prize.probability / totalProbability) * 100).toFixed(1);
    return `${prize.label}: ${percentage}%`;
  }).join(' | ');
  return odds;
}

export function LuckySpinModal({
  visible,
  onClose,
  onPrizeWon,
  coinBalance,
  onBuySpin,
}: LuckySpinModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasFreeSpin, setHasFreeSpin] = useState(true);
  const [currentPrize, setCurrentPrize] = useState<SpinPrize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showOdds, setShowOdds] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      checkFreeSpin();
    }
  }, [visible]);

  const checkFreeSpin = async () => {
    const state = await DailyRewardSystem.load();
    setHasFreeSpin(state.freeSpinsRemaining > 0);
  };

  const handleSpin = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    setCurrentPrize(null);

    // Get the prize
    const prize = await DailyRewardSystem.spin(!hasFreeSpin);

    if (!prize) {
      setIsSpinning(false);
      return;
    }

    setCurrentPrize(prize);

    // Calculate rotation
    const prizeIndex = SPIN_PRIZES.findIndex((p) => p.id === prize.id);
    const segmentAngle = 360 / SEGMENT_COUNT;
    const targetAngle = 360 - prizeIndex * segmentAngle - segmentAngle / 2;
    const fullRotations = 5; // Spin 5 full rotations
    const totalRotation = fullRotations * 360 + targetAngle;

    // Reset and animate
    spinAnim.setValue(0);

    Animated.timing(spinAnim, {
      toValue: totalRotation,
      duration: 4000,
      easing: Easing.bezier(0.2, 0.8, 0.3, 1),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      setHasFreeSpin(false);
      showPrizeResult(prize);
    });
  };

  const showPrizeResult = (prize: SpinPrize) => {
    setShowResult(true);

    Animated.spring(resultScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handleClaimPrize = () => {
    if (currentPrize) {
      onPrizeWon(currentPrize);
      setShowResult(false);
      resultScaleAnim.setValue(0);
    }
  };

  const getTimeUntilFreeSpin = () => {
    const time = DailyRewardSystem.getTimeUntilFreeSpin();
    return `${time.hours}h ${time.minutes}m`;
  };

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.title}>Lucky Spin!</Text>

          {/* Wheel */}
          <View style={styles.wheelContainer}>
            {/* Pointer */}
            <View style={styles.pointer}>
              <Text style={styles.pointerArrow}>V</Text>
            </View>

            {/* Wheel */}
            <Animated.View
              style={[
                styles.wheel,
                { transform: [{ rotate: spinRotation }] },
              ]}
            >
              {SPIN_PRIZES.map((prize, index) => {
                const segmentAngle = 360 / SEGMENT_COUNT;
                const rotation = index * segmentAngle;

                return (
                  <View
                    key={prize.id}
                    style={[
                      styles.segment,
                      {
                        backgroundColor: prize.color,
                        transform: [
                          { rotate: `${rotation}deg` },
                          { translateY: -WHEEL_SIZE / 4 },
                        ],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { transform: [{ rotate: `${segmentAngle / 2}deg` }] },
                      ]}
                    >
                      {prize.label}
                    </Text>
                  </View>
                );
              })}
            </Animated.View>

            {/* Center */}
            <View style={styles.wheelCenter}>
              <Text style={styles.wheelCenterText}>SPIN</Text>
            </View>
          </View>

          {/* Spin Button */}
          <TouchableOpacity
            style={[
              styles.spinButton,
              (!hasFreeSpin && coinBalance < 100) && styles.spinButtonDisabled,
              isSpinning && styles.spinButtonSpinning,
            ]}
            onPress={handleSpin}
            disabled={isSpinning || (!hasFreeSpin && coinBalance < 100)}
          >
            <Text style={styles.spinButtonText}>
              {isSpinning
                ? 'Spinning...'
                : hasFreeSpin
                ? 'FREE SPIN!'
                : 'SPIN (100 coins)'}
            </Text>
          </TouchableOpacity>

          {/* Free spin timer */}
          {!hasFreeSpin && (
            <Text style={styles.timerText}>
              Next free spin in: {getTimeUntilFreeSpin()}
            </Text>
          )}

          {/* ODDS DISCLOSURE - Required by Apple App Store for loot boxes */}
          <TouchableOpacity
            style={styles.oddsButton}
            onPress={() => setShowOdds(!showOdds)}
          >
            <Text style={styles.oddsButtonText}>
              {showOdds ? 'Hide Odds' : 'View Prize Odds'}
            </Text>
          </TouchableOpacity>

          {showOdds && (
            <View style={styles.oddsContainer}>
              <Text style={styles.oddsTitle}>Prize Odds Disclosure</Text>
              {SPIN_PRIZES.map(prize => {
                const totalProb = SPIN_PRIZES.reduce((sum, p) => sum + p.probability, 0);
                const percentage = ((prize.probability / totalProb) * 100).toFixed(1);
                return (
                  <View key={prize.id} style={styles.oddsRow}>
                    <View style={[styles.oddsDot, { backgroundColor: prize.color }]} />
                    <Text style={styles.oddsLabel}>{prize.label}</Text>
                    <Text style={styles.oddsValue}>{percentage}%</Text>
                  </View>
                );
              })}
              <Text style={styles.oddsNote}>
                Results are randomly generated. Past results do not affect future spins.
              </Text>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          {/* Prize Result Overlay */}
          {showResult && currentPrize && (
            <Animated.View
              style={[
                styles.resultOverlay,
                { transform: [{ scale: resultScaleAnim }] },
              ]}
            >
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>
                  {currentPrize.amount > 0 ? 'You Won!' : 'Try Again!'}
                </Text>
                <View
                  style={[styles.prizeDisplay, { backgroundColor: currentPrize.color }]}
                >
                  <Text style={styles.prizeAmount}>{currentPrize.label}</Text>
                  <Text style={styles.prizeType}>
                    {currentPrize.type === 'coins'
                      ? 'Coins'
                      : currentPrize.type === 'boost'
                      ? 'Super Boost'
                      : currentPrize.type === 'fuel_bonus'
                      ? 'Fuel Canister'
                      : 'Prize'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={handleClaimPrize}
                >
                  <Text style={styles.claimButtonText}>Claim!</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pointer: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
  },
  pointerArrow: {
    fontSize: 32,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: '#2A2A4E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFD700',
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    width: 60,
    height: WHEEL_SIZE / 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    transformOrigin: 'center bottom',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  wheelCenter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  wheelCenterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  spinButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 10,
  },
  spinButtonDisabled: {
    backgroundColor: '#555',
  },
  spinButtonSpinning: {
    backgroundColor: '#FF6B35',
  },
  spinButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  timerText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
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
  oddsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  oddsButtonText: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'underline',
  },
  oddsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    width: '100%',
  },
  oddsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  oddsDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  oddsLabel: {
    flex: 1,
    fontSize: 12,
    color: '#CCC',
  },
  oddsValue: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  oddsNote: {
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  prizeDisplay: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  prizeAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  prizeType: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 5,
  },
  claimButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 30,
  },
  claimButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
