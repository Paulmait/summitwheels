/**
 * ReplayScreen - Watch recorded ghost replays
 *
 * Features:
 * - List saved replays
 * - Playback with pause/play controls
 * - Speed controls (0.5x, 1x, 2x)
 * - Timeline scrubber
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GhostRun,
  GhostFrame,
  decompressGhostRun,
  formatTimeDelta,
} from '../game/systems/ghost';
import { useUISound } from '../hooks/useUISound';
import { VEHICLES } from '../game/config/vehicles';
import { STAGES } from '../game/config/stages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const REPLAYS_STORAGE_KEY = '@summit_wheels_replays';

type ReplayScreenProps = {
  onBack: () => void;
};

type PlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  currentFrame: GhostFrame | null;
};

export default function ReplayScreen({ onBack }: ReplayScreenProps) {
  const [replays, setReplays] = useState<GhostRun[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<GhostRun | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    speed: 1,
    currentFrame: null,
  });
  const { playClick, playConfirm } = useUISound();
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    loadReplays();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const loadReplays = async () => {
    try {
      const data = await AsyncStorage.getItem(REPLAYS_STORAGE_KEY);
      if (data) {
        const compressed = JSON.parse(data) as string[];
        const decompressed = compressed.map(decompressGhostRun);
        setReplays(decompressed);
      }
    } catch (error) {
      console.error('Failed to load replays:', error);
    }
  };

  const handleBack = useCallback(() => {
    playClick();
    if (selectedReplay) {
      setSelectedReplay(null);
      setPlaybackState({
        isPlaying: false,
        currentTime: 0,
        speed: 1,
        currentFrame: null,
      });
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      onBack();
    }
  }, [playClick, onBack, selectedReplay]);

  const handleSelectReplay = useCallback(
    (replay: GhostRun) => {
      playClick();
      setSelectedReplay(replay);
      setPlaybackState({
        isPlaying: false,
        currentTime: 0,
        speed: 1,
        currentFrame: replay.frames[0] || null,
      });
    },
    [playClick]
  );

  const handlePlayPause = useCallback(() => {
    playClick();
    setPlaybackState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, [playClick]);

  const handleSpeedChange = useCallback(
    (speed: number) => {
      playClick();
      setPlaybackState((prev) => ({
        ...prev,
        speed,
      }));
    },
    [playClick]
  );

  const handleSeek = useCallback((time: number) => {
    if (!selectedReplay) return;

    const frame = selectedReplay.frames.find((f) => f.time >= time);
    setPlaybackState((prev) => ({
      ...prev,
      currentTime: time,
      currentFrame: frame || prev.currentFrame,
    }));
  }, [selectedReplay]);

  // Playback loop
  useEffect(() => {
    if (!playbackState.isPlaying || !selectedReplay) return;

    const animate = (timestamp: number) => {
      if (!lastUpdateRef.current) {
        lastUpdateRef.current = timestamp;
      }

      const delta = (timestamp - lastUpdateRef.current) * playbackState.speed;
      lastUpdateRef.current = timestamp;

      setPlaybackState((prev) => {
        const newTime = prev.currentTime + delta;
        const maxTime =
          selectedReplay.frames[selectedReplay.frames.length - 1]?.time || 0;

        if (newTime >= maxTime) {
          return {
            ...prev,
            isPlaying: false,
            currentTime: maxTime,
            currentFrame:
              selectedReplay.frames[selectedReplay.frames.length - 1],
          };
        }

        const frame = selectedReplay.frames.find((f) => f.time >= newTime);
        return {
          ...prev,
          currentTime: newTime,
          currentFrame: frame || prev.currentFrame,
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    lastUpdateRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playbackState.isPlaying, playbackState.speed, selectedReplay]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVehicleName = (id: string) =>
    Object.values(VEHICLES).find((v) => v.id === id)?.name || id;
  const getStageName = (id: string) =>
    Object.values(STAGES).find((s) => s.id === id)?.name || id;

  const renderReplayList = () => (
    <ScrollView
      style={styles.replayList}
      contentContainerStyle={styles.replayListContent}
    >
      {replays.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎬</Text>
          <Text style={styles.emptyTitle}>No Replays Yet</Text>
          <Text style={styles.emptyText}>
            Complete runs to save replays and watch them here!
          </Text>
        </View>
      ) : (
        replays.map((replay, index) => (
          <TouchableOpacity
            key={replay.id}
            style={styles.replayCard}
            onPress={() => handleSelectReplay(replay)}
            activeOpacity={0.7}
          >
            <View style={styles.replayRank}>
              <Text style={styles.replayRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.replayInfo}>
              <Text style={styles.replayDistance}>
                {Math.floor(replay.distance)}m
              </Text>
              <Text style={styles.replayDetails}>
                {getVehicleName(replay.vehicleId)} on{' '}
                {getStageName(replay.stageId)}
              </Text>
              <Text style={styles.replayDate}>
                {new Date(replay.recordedAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.replayStats}>
              <Text style={styles.replayCoins}>{replay.coins} 🪙</Text>
              <Text style={styles.replayDuration}>
                {formatTime(replay.frames[replay.frames.length - 1]?.time || 0)}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderPlaybackView = () => {
    if (!selectedReplay) return null;

    const maxTime =
      selectedReplay.frames[selectedReplay.frames.length - 1]?.time || 1;
    const progress = (playbackState.currentTime / maxTime) * 100;

    return (
      <View style={styles.playbackContainer}>
        {/* Replay visualization */}
        <View style={styles.replayView}>
          {/* Sky */}
          <View style={styles.sky} />

          {/* Ground */}
          <View style={styles.ground} />

          {/* Ghost car */}
          {playbackState.currentFrame && (
            <View
              style={[
                styles.ghostCar,
                {
                  left:
                    (playbackState.currentFrame.x % SCREEN_WIDTH) +
                    SCREEN_WIDTH * 0.2,
                  top: SCREEN_HEIGHT * 0.4,
                  transform: [
                    { rotate: `${playbackState.currentFrame.angle}rad` },
                  ],
                },
              ]}
            >
              <View style={styles.carBody} />
              <View style={styles.carWheels}>
                <View style={styles.carWheel} />
                <View style={styles.carWheel} />
              </View>
              {playbackState.currentFrame.isBoosting && (
                <View style={styles.boostFlame} />
              )}
            </View>
          )}

          {/* Stats overlay */}
          <View style={styles.statsOverlay}>
            <Text style={styles.statDisplay}>
              Distance: {Math.floor(playbackState.currentFrame?.x || 0)}m
            </Text>
            <Text style={styles.statDisplay}>
              Time: {formatTime(playbackState.currentTime)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Timeline */}
          <View style={styles.timeline}>
            <Text style={styles.timeText}>
              {formatTime(playbackState.currentTime)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
              <TouchableOpacity
                style={[styles.scrubber, { left: `${progress}%` }]}
                onPress={() => {}}
              />
            </View>
            <Text style={styles.timeText}>{formatTime(maxTime)}</Text>
          </View>

          {/* Playback buttons */}
          <View style={styles.playbackButtons}>
            {/* Speed controls */}
            <View style={styles.speedControls}>
              {[0.5, 1, 2].map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedButton,
                    playbackState.speed === speed && styles.speedButtonActive,
                  ]}
                  onPress={() => handleSpeedChange(speed)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.speedText,
                      playbackState.speed === speed && styles.speedTextActive,
                    ]}
                  >
                    {speed}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Play/Pause */}
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              activeOpacity={0.7}
            >
              <Text style={styles.playButtonText}>
                {playbackState.isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>

            {/* Restart */}
            <TouchableOpacity
              style={styles.restartButton}
              onPress={() => handleSeek(0)}
              activeOpacity={0.7}
            >
              <Text style={styles.restartText}>⏮</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>
            {'<'} {selectedReplay ? 'Replays' : 'Back'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedReplay ? 'Watching Replay' : 'Replays'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {selectedReplay ? renderPlaybackView() : renderReplayList()}
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
    backgroundColor: '#16213E',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  placeholder: {
    width: 60,
  },
  replayList: {
    flex: 1,
  },
  replayListContent: {
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  replayCard: {
    flexDirection: 'row',
    backgroundColor: '#2C3E50',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  replayRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replayRankText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  replayInfo: {
    flex: 1,
    marginLeft: 15,
  },
  replayDistance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  replayDetails: {
    fontSize: 13,
    color: '#BDC3C7',
    marginTop: 2,
  },
  replayDate: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 4,
  },
  replayStats: {
    alignItems: 'flex-end',
  },
  replayCoins: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  replayDuration: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  playbackContainer: {
    flex: 1,
  },
  replayView: {
    flex: 1,
    overflow: 'hidden',
  },
  sky: {
    flex: 3,
    backgroundColor: '#87CEEB',
  },
  ground: {
    flex: 1,
    backgroundColor: '#8B4513',
  },
  ghostCar: {
    position: 'absolute',
    opacity: 0.8,
  },
  carBody: {
    width: 60,
    height: 30,
    backgroundColor: '#E74C3C',
    borderRadius: 5,
  },
  carWheels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60,
    marginTop: -10,
  },
  carWheel: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#333',
  },
  boostFlame: {
    position: 'absolute',
    left: -20,
    top: 10,
    width: 20,
    height: 10,
    backgroundColor: '#F39C12',
    borderRadius: 5,
  },
  statsOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  statDisplay: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    backgroundColor: '#16213E',
    padding: 20,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeText: {
    color: '#7F8C8D',
    fontSize: 12,
    width: 50,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  scrubber: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    marginLeft: -10,
  },
  playbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  speedControls: {
    flexDirection: 'row',
    gap: 5,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedButtonActive: {
    backgroundColor: '#3498DB',
  },
  speedText: {
    color: '#7F8C8D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  speedTextActive: {
    color: '#FFF',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 24,
    color: '#FFF',
  },
  restartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restartText: {
    fontSize: 18,
    color: '#FFF',
  },
});
