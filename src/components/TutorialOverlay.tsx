/**
 * TutorialOverlay - First-run onboarding tutorial
 *
 * Step-by-step guide teaching game mechanics:
 * - Controls (Gas/Brake)
 * - Tricks and flips
 * - Combo system
 * - Boost mechanic
 * - Fuel management
 */

import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAudioManager } from '../audio/AudioManager';
import { SFX_KEYS } from '../audio/audioKeys';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TUTORIAL_COMPLETE_KEY = '@summit_wheels_tutorial_complete';

type TutorialStep = {
  title: string;
  description: string;
  icon: string;
  highlight?: 'gas' | 'brake' | 'boost' | 'fuel' | 'hud';
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Summit Wheels!',
    description:
      'Race as far as you can while collecting coins and performing tricks. Let\'s learn the basics!',
    icon: '🚗',
  },
  {
    title: 'Gas Pedal',
    description:
      'Hold the GAS button (right side) to accelerate. Release to coast downhill and save fuel.',
    icon: '⛽',
    highlight: 'gas',
  },
  {
    title: 'Brake',
    description:
      'Hold the BRAKE button (left side) to slow down or control your descent on steep hills.',
    icon: '🛑',
    highlight: 'brake',
  },
  {
    title: 'Tricks & Flips',
    description:
      'Launch off hills to get airtime! Your car will flip automatically - land safely to earn trick points!',
    icon: '🔄',
  },
  {
    title: 'Combo System',
    description:
      'Chain multiple tricks together without crashing to build combos. Higher combos = more points!',
    icon: '🔥',
  },
  {
    title: 'Boost Power',
    description:
      'Performing tricks charges your BOOST meter. When ready, tap the BOOST button for a speed burst!',
    icon: '💨',
    highlight: 'boost',
  },
  {
    title: 'Fuel Management',
    description:
      'Watch your fuel gauge! Collect green fuel canisters to keep going. Run out of fuel and your run ends.',
    icon: '🛢️',
    highlight: 'fuel',
  },
  {
    title: 'Collect Coins',
    description:
      'Grab gold coins to spend on vehicles, upgrades, and new stages. Coins are pulled toward you automatically!',
    icon: '🪙',
  },
  {
    title: 'Ready to Roll!',
    description:
      'That\'s everything! Drive far, do tricks, and have fun. Good luck climbing those hills!',
    icon: '🏆',
  },
];

type TutorialOverlayProps = {
  visible: boolean;
  onComplete: () => void;
};

export function TutorialOverlay({ visible, onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    const audioManager = getAudioManager();
    audioManager.playSfx(SFX_KEYS.UI_CLICK);

    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Mark tutorial as complete
      AsyncStorage.setItem(TUTORIAL_COMPLETE_KEY, 'true').catch(() => {});
      audioManager.playSfx(SFX_KEYS.UPGRADE);
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handleSkip = useCallback(() => {
    const audioManager = getAudioManager();
    audioManager.playSfx(SFX_KEYS.UI_CLICK);
    // Mark tutorial as complete
    AsyncStorage.setItem(TUTORIAL_COMPLETE_KEY, 'true').catch(() => {});
    onComplete();
  }, [onComplete]);

  const handleBack = useCallback(() => {
    const audioManager = getAudioManager();
    audioManager.playSfx(SFX_KEYS.UI_CLICK);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  if (!visible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Highlight areas based on step */}
        {step.highlight === 'gas' && <View style={styles.highlightGas} />}
        {step.highlight === 'brake' && <View style={styles.highlightBrake} />}
        {step.highlight === 'boost' && <View style={styles.highlightBoost} />}
        {step.highlight === 'fuel' && <View style={styles.highlightFuel} />}

        {/* Content Card */}
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{step.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{step.description}</Text>

          {/* Progress Dots */}
          <View style={styles.progressDots}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                  index < currentStep && styles.dotComplete,
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {!isFirstStep && (
              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>
                {isLastStep ? "Let's Go!" : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Skip button */}
          {!isLastStep && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip Tutorial</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Check if tutorial has been completed
 */
export async function isTutorialComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(TUTORIAL_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Reset tutorial (for testing)
 */
export async function resetTutorial(): Promise<void> {
  await AsyncStorage.removeItem(TUTORIAL_COMPLETE_KEY);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#2C3E50',
    borderRadius: 25,
    padding: 30,
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#ECF0F1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: '#FF6B35',
    width: 25,
  },
  dotComplete: {
    backgroundColor: '#27AE60',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#7F8C8D',
  },
  nextButton: {
    backgroundColor: '#FF6B35',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 20,
    padding: 10,
  },
  skipText: {
    color: '#7F8C8D',
    fontSize: 14,
  },
  // Highlight styles for control areas
  highlightGas: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    width: 110,
    height: 80,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#27AE60',
    backgroundColor: 'rgba(39, 174, 96, 0.3)',
  },
  highlightBrake: {
    position: 'absolute',
    bottom: 50,
    left: 30,
    width: 110,
    height: 80,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#E74C3C',
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
  },
  highlightBoost: {
    position: 'absolute',
    bottom: 50,
    left: SCREEN_WIDTH / 2 - 45,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#3498DB',
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
  },
  highlightFuel: {
    position: 'absolute',
    top: 100,
    left: 20,
    width: 120,
    height: 30,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: '#F39C12',
    backgroundColor: 'rgba(243, 156, 18, 0.3)',
  },
});
