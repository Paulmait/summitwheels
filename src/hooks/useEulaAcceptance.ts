/**
 * useEulaAcceptance - Hook for managing EULA acceptance state
 * Persists acceptance to AsyncStorage
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EULA_ACCEPTED_KEY = '@summit_wheels_eula_accepted';
const EULA_VERSION = '1.0'; // Increment to require re-acceptance

export type UseEulaAcceptanceReturn = {
  /** Whether EULA has been accepted */
  hasAccepted: boolean;
  /** Whether we're still checking acceptance status */
  isLoading: boolean;
  /** Accept the EULA */
  acceptEula: () => Promise<void>;
  /** Reset EULA acceptance (for testing) */
  resetEula: () => Promise<void>;
};

/**
 * Hook to manage EULA acceptance state
 */
export function useEulaAcceptance(): UseEulaAcceptanceReturn {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check acceptance on mount
  useEffect(() => {
    const checkAcceptance = async () => {
      try {
        const accepted = await AsyncStorage.getItem(EULA_ACCEPTED_KEY);
        setHasAccepted(accepted === EULA_VERSION);
      } catch (error) {
        console.warn('Failed to check EULA acceptance:', error);
        setHasAccepted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAcceptance();
  }, []);

  const acceptEula = useCallback(async () => {
    try {
      await AsyncStorage.setItem(EULA_ACCEPTED_KEY, EULA_VERSION);
      setHasAccepted(true);
    } catch (error) {
      console.warn('Failed to save EULA acceptance:', error);
    }
  }, []);

  const resetEula = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(EULA_ACCEPTED_KEY);
      setHasAccepted(false);
    } catch (error) {
      console.warn('Failed to reset EULA acceptance:', error);
    }
  }, []);

  return {
    hasAccepted,
    isLoading,
    acceptEula,
    resetEula,
  };
}

export default useEulaAcceptance;
