/**
 * Leaderboard System - Competitive engagement
 *
 * Features:
 * - Personal best records per stage/vehicle combination
 * - Local leaderboards with filtering
 * - Weekly/All-time rankings
 * - Structure ready for online leaderboards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VehicleId } from '../game/config/vehicles';
import type { StageId } from '../game/config/stages';

const LEADERBOARD_KEY = '@summit_wheels_leaderboard';
const MAX_ENTRIES_PER_CATEGORY = 100;

export type LeaderboardEntry = {
  id: string;
  playerName: string;
  vehicleId: VehicleId;
  stageId: StageId;
  distance: number;
  coins: number;
  trickPoints: number;
  maxCombo: number;
  timeElapsed: number;
  date: string;
  isPersonalBest: boolean;
};

export type LeaderboardFilter = {
  stageId?: StageId;
  vehicleId?: VehicleId;
  timeframe?: 'daily' | 'weekly' | 'all-time';
};

export type LeaderboardCategory = 'distance' | 'coins' | 'tricks' | 'combo';

export type LeaderboardState = {
  entries: LeaderboardEntry[];
  personalBests: Record<string, LeaderboardEntry>; // key = `${stageId}_${vehicleId}`
  playerName: string;
  totalRuns: number;
  lastUpdated: string;
};

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get key for personal best lookup
 */
function getPBKey(stageId: StageId, vehicleId: VehicleId): string {
  return `${stageId}_${vehicleId}`;
}

/**
 * Check if date is within timeframe
 */
function isWithinTimeframe(dateStr: string, timeframe: 'daily' | 'weekly' | 'all-time'): boolean {
  if (timeframe === 'all-time') return true;

  const entryDate = new Date(dateStr);
  const now = new Date();

  if (timeframe === 'daily') {
    return entryDate.toDateString() === now.toDateString();
  }

  if (timeframe === 'weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  }

  return true;
}

/**
 * Leaderboard System singleton
 */
class LeaderboardSystemClass {
  private _state: LeaderboardState | null = null;
  private _isLoaded = false;

  /**
   * Load state from storage
   */
  async load(): Promise<LeaderboardState> {
    try {
      const stored = await AsyncStorage.getItem(LEADERBOARD_KEY);
      if (stored) {
        this._state = JSON.parse(stored);
      } else {
        this._state = this._createInitialState();
        await this._save();
      }

      this._isLoaded = true;
      return this._state!;
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this._state = this._createInitialState();
      this._isLoaded = true;
      return this._state;
    }
  }

  /**
   * Create initial state
   */
  private _createInitialState(): LeaderboardState {
    return {
      entries: [],
      personalBests: {},
      playerName: 'Player',
      totalRuns: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Save state
   */
  private async _save(): Promise<void> {
    if (this._state) {
      this._state.lastUpdated = new Date().toISOString();
      await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this._state));
    }
  }

  /**
   * Set player name
   */
  async setPlayerName(name: string): Promise<void> {
    if (this._state) {
      this._state.playerName = name.trim() || 'Player';

      // Update all entries with new name
      this._state.entries.forEach((entry) => {
        entry.playerName = this._state!.playerName;
      });

      Object.values(this._state.personalBests).forEach((entry) => {
        entry.playerName = this._state!.playerName;
      });

      await this._save();
    }
  }

  /**
   * Submit a run result
   */
  async submitRun(result: {
    vehicleId: VehicleId;
    stageId: StageId;
    distance: number;
    coins: number;
    trickPoints: number;
    maxCombo: number;
    timeElapsed: number;
  }): Promise<{
    entry: LeaderboardEntry;
    isNewPersonalBest: boolean;
    previousBest: LeaderboardEntry | null;
    rank: number;
  }> {
    if (!this._state) {
      await this.load();
    }

    const pbKey = getPBKey(result.stageId, result.vehicleId);
    const previousBest = this._state!.personalBests[pbKey] || null;

    const isNewPersonalBest = !previousBest || result.distance > previousBest.distance;

    const entry: LeaderboardEntry = {
      id: generateId(),
      playerName: this._state!.playerName,
      vehicleId: result.vehicleId,
      stageId: result.stageId,
      distance: Math.round(result.distance),
      coins: result.coins,
      trickPoints: result.trickPoints,
      maxCombo: result.maxCombo,
      timeElapsed: result.timeElapsed,
      date: new Date().toISOString(),
      isPersonalBest: isNewPersonalBest,
    };

    // Add to entries
    this._state!.entries.push(entry);
    this._state!.totalRuns++;

    // Update personal best
    if (isNewPersonalBest) {
      // Clear old PB flag
      if (previousBest) {
        const oldEntry = this._state!.entries.find((e) => e.id === previousBest.id);
        if (oldEntry) {
          oldEntry.isPersonalBest = false;
        }
      }

      this._state!.personalBests[pbKey] = entry;
    }

    // Clean up old entries (keep top 100 per category)
    this._pruneEntries();

    await this._save();

    // Calculate rank
    const rank = this.getRankForDistance(result.stageId, result.distance);

    return {
      entry,
      isNewPersonalBest,
      previousBest,
      rank,
    };
  }

  /**
   * Prune old entries to keep storage manageable
   */
  private _pruneEntries(): void {
    if (!this._state) return;

    // Sort by distance descending and keep top entries
    this._state.entries.sort((a, b) => b.distance - a.distance);

    if (this._state.entries.length > MAX_ENTRIES_PER_CATEGORY * 6) {
      // Keep all personal bests
      const pbIds = new Set(Object.values(this._state.personalBests).map((e) => e.id));

      // Keep top entries plus all personal bests
      const keepEntries = this._state.entries.filter(
        (entry, index) => index < MAX_ENTRIES_PER_CATEGORY * 6 || pbIds.has(entry.id)
      );

      this._state.entries = keepEntries;
    }
  }

  /**
   * Get leaderboard with optional filters
   */
  getLeaderboard(
    category: LeaderboardCategory = 'distance',
    filter: LeaderboardFilter = {}
  ): LeaderboardEntry[] {
    if (!this._state) return [];

    let entries = [...this._state.entries];

    // Apply filters
    if (filter.stageId) {
      entries = entries.filter((e) => e.stageId === filter.stageId);
    }

    if (filter.vehicleId) {
      entries = entries.filter((e) => e.vehicleId === filter.vehicleId);
    }

    if (filter.timeframe) {
      entries = entries.filter((e) => isWithinTimeframe(e.date, filter.timeframe!));
    }

    // Sort by category
    switch (category) {
      case 'distance':
        entries.sort((a, b) => b.distance - a.distance);
        break;
      case 'coins':
        entries.sort((a, b) => b.coins - a.coins);
        break;
      case 'tricks':
        entries.sort((a, b) => b.trickPoints - a.trickPoints);
        break;
      case 'combo':
        entries.sort((a, b) => b.maxCombo - a.maxCombo);
        break;
    }

    return entries;
  }

  /**
   * Get personal best for stage/vehicle combination
   */
  getPersonalBest(stageId: StageId, vehicleId: VehicleId): LeaderboardEntry | null {
    if (!this._state) return null;
    return this._state.personalBests[getPBKey(stageId, vehicleId)] || null;
  }

  /**
   * Get all personal bests
   */
  getAllPersonalBests(): LeaderboardEntry[] {
    if (!this._state) return [];
    return Object.values(this._state.personalBests);
  }

  /**
   * Get rank for a distance on a stage
   */
  getRankForDistance(stageId: StageId, distance: number): number {
    const leaderboard = this.getLeaderboard('distance', { stageId });
    const rank = leaderboard.findIndex((e) => e.distance <= distance);
    return rank === -1 ? leaderboard.length + 1 : rank + 1;
  }

  /**
   * Get player stats
   */
  getStats(): {
    totalRuns: number;
    totalDistance: number;
    totalCoins: number;
    totalTricks: number;
    bestDistance: number;
    bestCombo: number;
    averageDistance: number;
  } {
    if (!this._state || this._state.entries.length === 0) {
      return {
        totalRuns: 0,
        totalDistance: 0,
        totalCoins: 0,
        totalTricks: 0,
        bestDistance: 0,
        bestCombo: 0,
        averageDistance: 0,
      };
    }

    const entries = this._state.entries;

    return {
      totalRuns: this._state.totalRuns,
      totalDistance: entries.reduce((sum, e) => sum + e.distance, 0),
      totalCoins: entries.reduce((sum, e) => sum + e.coins, 0),
      totalTricks: entries.reduce((sum, e) => sum + e.trickPoints, 0),
      bestDistance: Math.max(...entries.map((e) => e.distance)),
      bestCombo: Math.max(...entries.map((e) => e.maxCombo)),
      averageDistance: Math.round(entries.reduce((sum, e) => sum + e.distance, 0) / entries.length),
    };
  }

  /**
   * Get recent runs
   */
  getRecentRuns(limit: number = 10): LeaderboardEntry[] {
    if (!this._state) return [];

    return [...this._state.entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  /**
   * Get today's best run
   */
  getTodaysBest(): LeaderboardEntry | null {
    const todayRuns = this.getLeaderboard('distance', { timeframe: 'daily' });
    return todayRuns.length > 0 ? todayRuns[0] : null;
  }

  /**
   * Reset for GDPR deletion
   */
  async reset(): Promise<void> {
    this._state = this._createInitialState();
    await AsyncStorage.removeItem(LEADERBOARD_KEY);
  }
}

export const LeaderboardSystem = new LeaderboardSystemClass();
export { LeaderboardSystemClass };
