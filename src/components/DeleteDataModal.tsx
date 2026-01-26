/**
 * DeleteDataModal - GDPR/CCPA compliant data deletion UI
 *
 * Required by Apple App Store, GDPR, and CCPA
 * Must be easily accessible and not require email-only flow
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  deleteAllLocalData,
  getDataSummary,
  DeleteDataResult,
} from '../services/DataManager';

export type DeleteDataModalProps = {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback after data is deleted */
  onDataDeleted?: () => void;
};

type ModalState = 'info' | 'confirm' | 'deleting' | 'success' | 'error';

export function DeleteDataModal({
  visible,
  onClose,
  onDataDeleted,
}: DeleteDataModalProps) {
  const [state, setState] = useState<ModalState>('info');
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [result, setResult] = useState<DeleteDataResult | null>(null);

  // Load data summary when modal opens
  useEffect(() => {
    if (visible) {
      loadDataSummary();
      setState('info');
    }
  }, [visible]);

  const loadDataSummary = async () => {
    const summary = await getDataSummary();
    setDataTypes(summary.dataTypes);
  };

  const handleDelete = useCallback(async () => {
    setState('deleting');

    try {
      const deleteResult = await deleteAllLocalData();
      setResult(deleteResult);

      if (deleteResult.success) {
        setState('success');
        onDataDeleted?.();
      } else {
        setState('error');
      }
    } catch (error) {
      setResult({
        success: false,
        deletedKeys: [],
        errors: [`${error}`],
      });
      setState('error');
    }
  }, [onDataDeleted]);

  const handleConfirmDelete = () => {
    Alert.alert(
      'Final Confirmation',
      'This will permanently delete ALL your data including:\n\n• Game progress\n• Upgrades purchased\n• Statistics\n• Settings\n\nThis action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: handleDelete,
        },
      ]
    );
  };

  const renderContent = () => {
    switch (state) {
      case 'info':
        return (
          <>
            <Text style={styles.title}>Delete My Data</Text>
            <Text style={styles.subtitle}>
              Remove all your personal data from this app
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>What will be deleted:</Text>
              {dataTypes.length > 0 ? (
                dataTypes.map((type, index) => (
                  <Text key={index} style={styles.infoItem}>
                    • {type}
                  </Text>
                ))
              ) : (
                <Text style={styles.infoItem}>• No data found</Text>
              )}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>This includes:</Text>
              <Text style={styles.infoItem}>• Account records</Text>
              <Text style={styles.infoItem}>• Game progress</Text>
              <Text style={styles.infoItem}>• Stored runs and settings</Text>
              <Text style={styles.infoItem}>• Upgrade purchases</Text>
              <Text style={styles.infoItem}>• Leaderboard entries</Text>
            </View>

            <Text style={styles.warning}>
              This action is permanent and cannot be undone.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => setState('confirm')}
              >
                <Text style={styles.deleteButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'confirm':
        return (
          <>
            <Text style={styles.title}>Are you sure?</Text>
            <Text style={styles.confirmText}>
              You are about to permanently delete all your Summit Wheels data.
              {'\n\n'}
              Your progress, upgrades, coins, and statistics will be removed.
              {'\n\n'}
              You will need to start fresh if you continue playing.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setState('info')}
              >
                <Text style={styles.cancelButtonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete Data</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'deleting':
        return (
          <>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.deletingText}>Deleting your data...</Text>
            <Text style={styles.deletingSubtext}>Please wait</Text>
          </>
        );

      case 'success':
        return (
          <>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.title}>Data Deleted</Text>
            <Text style={styles.successText}>
              All your personal data has been successfully removed from this
              device.
              {'\n\n'}
              {result?.deletedKeys.length} items deleted.
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </>
        );

      case 'error':
        return (
          <>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.title}>Error</Text>
            <Text style={styles.errorText}>
              Some data could not be deleted:
              {'\n\n'}
              {result?.errors.join('\n')}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
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
    borderColor: '#FF4444',
  },
  scrollContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 22,
  },
  warning: {
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  confirmText: {
    fontSize: 15,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  closeButton: {
    backgroundColor: '#FF6B35',
    width: '100%',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#AAA',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  deletingText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 20,
  },
  deletingSubtext: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 8,
  },
  successIcon: {
    fontSize: 48,
    color: '#4CAF50',
    marginBottom: 16,
  },
  successText: {
    fontSize: 15,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 48,
    color: '#FF4444',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});

export default DeleteDataModal;
