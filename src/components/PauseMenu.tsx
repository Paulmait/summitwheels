/**
 * PauseMenu - In-game pause overlay
 *
 * Displays when player pauses the game during a run
 */

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAudioManager } from '../audio/AudioManager';
import { SFX_KEYS } from '../audio/audioKeys';

interface PauseMenuProps {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  distance: number;
  coins: number;
  timeElapsed: number;
}

export function PauseMenu({
  visible,
  onResume,
  onRestart,
  onQuit,
  distance,
  coins,
  timeElapsed,
}: PauseMenuProps) {
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleButtonPress = (action: () => void) => {
    const audioManager = getAudioManager();
    audioManager.playSfx(SFX_KEYS.UI_CLICK);
    action();
  };

  const handleQuitPress = () => {
    const audioManager = getAudioManager();
    audioManager.playSfx(SFX_KEYS.UI_CLICK);
    setShowQuitConfirm(true);
  };

  const handleQuitConfirm = () => {
    setShowQuitConfirm(false);
    onQuit();
  };

  const handleQuitCancel = () => {
    const audioManager = getAudioManager();
    audioManager.playSfx(SFX_KEYS.UI_CLICK);
    setShowQuitConfirm(false);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Title */}
          <Text style={styles.title}>PAUSED</Text>

          {/* Current Run Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{Math.floor(distance)}m</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Coins</Text>
              <Text style={[styles.statValue, styles.coinsValue]}>{coins}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
            </View>
          </View>

          {/* Quit Confirmation */}
          {showQuitConfirm ? (
            <View style={styles.confirmContainer}>
              <Text style={styles.confirmText}>
                Quit this run?{'\n'}Progress will be lost!
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleQuitCancel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.quitConfirmButton]}
                  onPress={handleQuitConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>QUIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Menu Buttons */
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.resumeButton]}
                onPress={() => handleButtonPress(onResume)}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>RESUME</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.restartButton]}
                onPress={() => handleButtonPress(onRestart)}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>RESTART</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.quitButton]}
                onPress={handleQuitPress}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>QUIT TO MENU</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#2C3E50',
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
    color: '#FF6B35',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#BDC3C7',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  coinsValue: {
    color: '#FFD700',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  resumeButton: {
    backgroundColor: '#27AE60',
  },
  restartButton: {
    backgroundColor: '#3498DB',
  },
  quitButton: {
    backgroundColor: '#7F8C8D',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  confirmContainer: {
    alignItems: 'center',
    width: '100%',
  },
  confirmText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    backgroundColor: '#7F8C8D',
    flex: 1,
  },
  quitConfirmButton: {
    backgroundColor: '#E74C3C',
    flex: 1,
  },
});
