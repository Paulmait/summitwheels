/**
 * Leaderboard Screen - Display personal records and rankings
 *
 * Features:
 * - Personal best records per stage
 * - Recent runs history
 * - Stats overview
 * - Filter by stage/vehicle/timeframe
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import {
  LeaderboardSystem,
  LeaderboardEntry,
  LeaderboardCategory,
} from '../systems/LeaderboardSystem';
import { STAGES, StageId } from '../game/config/stages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LeaderboardScreenProps = {
  onBack: () => void;
};

type Tab = 'records' | 'recent' | 'stats';
type TimeFilter = 'daily' | 'weekly' | 'all-time';

export default function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('records');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time');
  const [selectedStage, setSelectedStage] = useState<StageId | 'all'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [personalBests, setPersonalBests] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof LeaderboardSystem.getStats> | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, timeFilter, selectedStage]);

  const loadData = async () => {
    await LeaderboardSystem.load();

    // Load personal bests
    const bests = LeaderboardSystem.getAllPersonalBests();
    setPersonalBests(bests);

    // Load entries based on filters
    const filter: { stageId?: StageId; timeframe?: TimeFilter } = {};
    if (selectedStage !== 'all') filter.stageId = selectedStage;
    if (timeFilter !== 'all-time') filter.timeframe = timeFilter;

    if (activeTab === 'recent') {
      setEntries(LeaderboardSystem.getRecentRuns(20));
    } else {
      setEntries(LeaderboardSystem.getLeaderboard('distance', filter));
    }

    setStats(LeaderboardSystem.getStats());
  };

  const formatDistance = (distance: number): string => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${Math.floor(distance)}m`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const stageName = STAGES[item.stageId]?.name ?? item.stageId;

    return (
      <View style={[styles.entryItem, item.isPersonalBest && styles.entryItemBest]}>
        <View style={styles.entryRank}>
          <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>
            #{index + 1}
          </Text>
        </View>
        <View style={styles.entryInfo}>
          <View style={styles.entryRow}>
            <Text style={styles.entryDistance}>{formatDistance(item.distance)}</Text>
            {item.isPersonalBest && (
              <View style={styles.pbBadge}>
                <Text style={styles.pbText}>PB</Text>
              </View>
            )}
          </View>
          <View style={styles.entryDetails}>
            <Text style={styles.detailText}>{stageName}</Text>
            <Text style={styles.detailDot}>-</Text>
            <Text style={styles.detailText}>{item.coins} coins</Text>
            <Text style={styles.detailDot}>-</Text>
            <Text style={styles.detailText}>{item.maxCombo}x combo</Text>
          </View>
          <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRuns}</Text>
            <Text style={styles.statLabel}>Total Runs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDistance(stats.bestDistance)}</Text>
            <Text style={styles.statLabel}>Best Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCoins}</Text>
            <Text style={styles.statLabel}>Total Coins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.bestCombo}x</Text>
            <Text style={styles.statLabel}>Best Combo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDistance(stats.averageDistance)}</Text>
            <Text style={styles.statLabel}>Avg Distance</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['records', 'recent', 'stats'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters */}
      {activeTab !== 'stats' && (
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            {(['daily', 'weekly', 'all-time'] as TimeFilter[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterButton, timeFilter === filter && styles.filterButtonActive]}
                onPress={() => setTimeFilter(filter)}
              >
                <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Content */}
      {activeTab === 'stats' ? (
        renderStats()
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No records yet!</Text>
          <Text style={styles.emptySubtext}>Play some runs to see your stats here.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  placeholder: {
    width: 44,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#2A2A4E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#FFF',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A4E',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  filterTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  entryItem: {
    flexDirection: 'row',
    backgroundColor: '#2A2A4E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  entryItemBest: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  entryRank: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
  },
  rankTextTop: {
    color: '#FFD700',
  },
  entryInfo: {
    flex: 1,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryDistance: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  pbBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  pbText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  entryDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#AAA',
  },
  detailDot: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 6,
  },
  entryDate: {
    fontSize: 11,
    color: '#666',
  },
  statsContainer: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    width: (SCREEN_WIDTH - 55) / 2,
    backgroundColor: '#2A2A4E',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
