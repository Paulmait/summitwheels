/**
 * EulaModal - In-App EULA acceptance modal
 * Apple App Store compliant short-form EULA
 */

import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type EulaModalProps = {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when user accepts EULA */
  onAccept: () => void;
  /** Optional callback when user declines (closes app) */
  onDecline?: () => void;
};

/**
 * Short-form EULA modal for Apple App Store compliance
 */
export function EulaModal({ visible, onAccept, onDecline }: EulaModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <Text style={styles.title}>Summit Wheels</Text>
          <Text style={styles.subtitle}>End User License Agreement</Text>

          {/* EULA Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator>
            <Text style={styles.intro}>
              By using Summit Wheels, you agree to the following:
            </Text>

            <View style={styles.bulletList}>
              <Text style={styles.bullet}>
                • This app is licensed, not sold, to you.
              </Text>
              <Text style={styles.bullet}>
                • This license is non-transferable and limited to personal use.
              </Text>
              <Text style={styles.bullet}>
                • You may not copy, modify, or reverse engineer the app.
              </Text>
              <Text style={styles.bullet}>
                • The app is provided "as is" without warranties.
              </Text>
              <Text style={styles.bullet}>
                • Cien Rios LLC is not responsible for any damages arising from
                use of the app.
              </Text>
              <Text style={styles.bullet}>
                • This agreement is governed by the laws of the State of
                Florida, USA.
              </Text>
            </View>

            {/* Developer Info */}
            <View style={styles.developerInfo}>
              <Text style={styles.developerLabel}>Developer:</Text>
              <Text style={styles.developerText}>Cien Rios LLC</Text>
              <Text style={styles.developerText}>17113 Miramar Parkway</Text>
              <Text style={styles.developerText}>Miramar, FL 33027</Text>
              <Text style={styles.developerText}>United States</Text>
              <Text style={styles.developerText}>Phone: (754) 254-7141</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onDecline && (
              <TouchableOpacity
                style={[styles.button, styles.declineButton]}
                onPress={onDecline}
                activeOpacity={0.7}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
              activeOpacity={0.7}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.tapHint}>Tap Accept to continue.</Text>
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
    padding: 20,
  },
  modal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  intro: {
    fontSize: 15,
    color: '#FFF',
    marginBottom: 16,
    lineHeight: 22,
  },
  bulletList: {
    marginBottom: 20,
  },
  bullet: {
    fontSize: 14,
    color: '#DDD',
    marginBottom: 10,
    lineHeight: 20,
    paddingLeft: 4,
  },
  developerInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 16,
    marginTop: 10,
  },
  developerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  developerText: {
    fontSize: 13,
    color: '#AAA',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#444',
  },
  acceptButton: {
    backgroundColor: '#FF6B35',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#AAA',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tapHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default EulaModal;
