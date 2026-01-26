/**
 * DataManager - Handles user data operations including GDPR/CCPA deletion
 *
 * Required by:
 * - Apple App Store
 * - GDPR (EU)
 * - CCPA (California)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// All AsyncStorage keys used by the app
export const STORAGE_KEYS = {
  PROGRESS: '@summit_wheels_progress',
  AUDIO_SETTINGS: '@summit_wheels_audio_settings',
  EULA_ACCEPTED: '@summit_wheels_eula_accepted',
  BEST_DISTANCE: '@summit_wheels_best_distance',
  TOTAL_COINS: '@summit_wheels_total_coins',
  TOTAL_RUNS: '@summit_wheels_total_runs',
  UPGRADES: '@summit_wheels_upgrades',
  GHOST_DATA: '@summit_wheels_ghost',
  DAILY_CHALLENGE: '@summit_wheels_daily',
  ACHIEVEMENTS: '@summit_wheels_achievements',
} as const;

export type DeleteDataResult = {
  success: boolean;
  deletedKeys: string[];
  errors: string[];
};

/**
 * Delete all user data from local storage
 * This is the local-only version for apps without backend
 */
export async function deleteAllLocalData(): Promise<DeleteDataResult> {
  const deletedKeys: string[] = [];
  const errors: string[] = [];

  // Get all keys to delete
  const keysToDelete = Object.values(STORAGE_KEYS);

  for (const key of keysToDelete) {
    try {
      await AsyncStorage.removeItem(key);
      deletedKeys.push(key);
    } catch (error) {
      errors.push(`Failed to delete ${key}: ${error}`);
    }
  }

  // Also clear any other keys that might exist
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const summitWheelsKeys = allKeys.filter((key) =>
      key.startsWith('@summit_wheels')
    );

    for (const key of summitWheelsKeys) {
      if (!deletedKeys.includes(key)) {
        try {
          await AsyncStorage.removeItem(key);
          deletedKeys.push(key);
        } catch (error) {
          errors.push(`Failed to delete ${key}: ${error}`);
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to enumerate keys: ${error}`);
  }

  return {
    success: errors.length === 0,
    deletedKeys,
    errors,
  };
}

/**
 * Firebase Cloud Function compatible data deletion
 * Call this when Firebase is integrated
 *
 * Deletes:
 * - users/{uid}
 * - runs where uid == user
 * - ghosts/{uid}
 * - leaderboard entries where uid == user
 * - Revokes auth account
 */
export async function deleteUserDataFromFirebase(
  uid: string
): Promise<DeleteDataResult> {
  const deletedKeys: string[] = [];
  const errors: string[] = [];

  try {
    // This is a placeholder for Firebase integration
    // When Firebase is added, implement:
    //
    // 1. Delete user document
    // await firestore.doc(`users/${uid}`).delete();
    // deletedKeys.push(`users/${uid}`);
    //
    // 2. Delete all runs
    // const runs = await firestore.collection("runs").where("uid", "==", uid).get();
    // for (const doc of runs.docs) {
    //   await doc.ref.delete();
    //   deletedKeys.push(`runs/${doc.id}`);
    // }
    //
    // 3. Delete ghost data
    // await firestore.doc(`ghosts/${uid}`).delete();
    // deletedKeys.push(`ghosts/${uid}`);
    //
    // 4. Delete leaderboard entries
    // const leaderboardDocs = await firestore.collectionGroup("entries")
    //   .where("uid", "==", uid).get();
    // for (const doc of leaderboardDocs.docs) {
    //   await doc.ref.delete();
    //   deletedKeys.push(doc.ref.path);
    // }
    //
    // 5. Delete auth account
    // await auth.deleteUser(uid);
    // deletedKeys.push(`auth/${uid}`);

    // For now, just delete local data
    const localResult = await deleteAllLocalData();
    deletedKeys.push(...localResult.deletedKeys);
    errors.push(...localResult.errors);
  } catch (error) {
    errors.push(`Firebase deletion failed: ${error}`);
  }

  return {
    success: errors.length === 0,
    deletedKeys,
    errors,
  };
}

/**
 * Get summary of data that will be deleted
 */
export async function getDataSummary(): Promise<{
  hasData: boolean;
  dataTypes: string[];
}> {
  const dataTypes: string[] = [];

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const summitWheelsKeys = allKeys.filter((key) =>
      key.startsWith('@summit_wheels')
    );

    if (summitWheelsKeys.includes(STORAGE_KEYS.PROGRESS)) {
      dataTypes.push('Game Progress');
    }
    if (summitWheelsKeys.includes(STORAGE_KEYS.UPGRADES)) {
      dataTypes.push('Upgrades');
    }
    if (summitWheelsKeys.includes(STORAGE_KEYS.AUDIO_SETTINGS)) {
      dataTypes.push('Settings');
    }
    if (summitWheelsKeys.includes(STORAGE_KEYS.GHOST_DATA)) {
      dataTypes.push('Ghost Runs');
    }
    if (summitWheelsKeys.includes(STORAGE_KEYS.ACHIEVEMENTS)) {
      dataTypes.push('Achievements');
    }
    if (
      summitWheelsKeys.includes(STORAGE_KEYS.BEST_DISTANCE) ||
      summitWheelsKeys.includes(STORAGE_KEYS.TOTAL_COINS) ||
      summitWheelsKeys.includes(STORAGE_KEYS.TOTAL_RUNS)
    ) {
      dataTypes.push('Statistics');
    }
  } catch (error) {
    console.warn('Failed to get data summary:', error);
  }

  return {
    hasData: dataTypes.length > 0,
    dataTypes,
  };
}

export default {
  deleteAllLocalData,
  deleteUserDataFromFirebase,
  getDataSummary,
  STORAGE_KEYS,
};
