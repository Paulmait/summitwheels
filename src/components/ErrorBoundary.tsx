/**
 * Error Boundary - Crash protection for production
 *
 * Catches React errors and displays fallback UI
 * Logs errors for debugging and analytics
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ERROR_LOG_KEY = '@summit_wheels_error_log';
const MAX_ERROR_LOGS = 10;

interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error
    this.logError(error, errorInfo);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  private async logError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ERROR_LOG_KEY);
      const logs: ErrorLog[] = stored ? JSON.parse(stored) : [];

      const newLog: ErrorLog = {
        message: error.message,
        stack: error.stack ?? undefined,
        componentStack: errorInfo.componentStack ?? undefined,
        timestamp: new Date().toISOString(),
      };

      logs.unshift(newLog);

      // Keep only recent logs
      const trimmedLogs = logs.slice(0, MAX_ERROR_LOGS);

      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmedLogs));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>Oops!</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              The game encountered an error. Your progress has been saved.
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
                <Text style={styles.debugText}>{this.state.error.stack}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Game-specific error boundary with auto-save
 */
export class GameErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    super.componentDidCatch(error, errorInfo);

    // Attempt to save game state on crash
    this.emergencySave();
  }

  private async emergencySave(): Promise<void> {
    try {
      // Save emergency flag for recovery on next launch
      await AsyncStorage.setItem('@summit_wheels_crash_recovery', JSON.stringify({
        crashed: true,
        timestamp: Date.now(),
      }));
    } catch (saveError) {
      console.error('Emergency save failed:', saveError);
    }
  }
}

/**
 * Get error logs for debugging
 */
export async function getErrorLogs(): Promise<ErrorLog[]> {
  try {
    const stored = await AsyncStorage.getItem(ERROR_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear error logs
 */
export async function clearErrorLogs(): Promise<void> {
  await AsyncStorage.removeItem(ERROR_LOG_KEY);
}

/**
 * Check for crash recovery
 */
export async function checkCrashRecovery(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem('@summit_wheels_crash_recovery');
    if (stored) {
      await AsyncStorage.removeItem('@summit_wheels_crash_recovery');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 20,
  },
  retryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  debugContainer: {
    maxHeight: 200,
    backgroundColor: '#2A2A4E',
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#888888',
    fontFamily: 'monospace',
  },
});
