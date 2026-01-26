/**
 * TrickPopup - Displays trick notifications during gameplay
 *
 * Shows animated popups like:
 * +500 BACKFLIP!
 * +200 PERFECT LANDING!
 */

import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Trick, getTrickColor, formatTrickDisplay } from '../game/systems/tricks';

export type TrickPopupProps = {
  tricks: Trick[];
};

type AnimatedTrick = Trick & {
  animValue: Animated.Value;
  offsetY: number;
};

export function TrickPopup({ tricks }: TrickPopupProps) {
  const [animatedTricks, setAnimatedTricks] = useState<AnimatedTrick[]>([]);

  useEffect(() => {
    // Add new tricks with animation
    const newTricks = tricks.filter(
      (t) => !animatedTricks.find((at) => at.timestamp === t.timestamp)
    );

    if (newTricks.length > 0) {
      const newAnimated = newTricks.map((trick, index) => ({
        ...trick,
        animValue: new Animated.Value(0),
        offsetY: index * 50,
      }));

      setAnimatedTricks((prev) => [...prev, ...newAnimated]);

      // Animate each new trick
      newAnimated.forEach((trick) => {
        Animated.sequence([
          // Scale up and fade in
          Animated.timing(trick.animValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          // Hold
          Animated.delay(1000),
          // Fade out and float up
          Animated.timing(trick.animValue, {
            toValue: 2,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Remove after animation
          setAnimatedTricks((prev) =>
            prev.filter((t) => t.timestamp !== trick.timestamp)
          );
        });
      });
    }
  }, [tricks, animatedTricks]);

  if (animatedTricks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {animatedTricks.map((trick, index) => {
        const scale = trick.animValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0.5, 1.2, 0.8],
        });

        const translateY = trick.animValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [20, 0, -30],
        });

        const opacity = trick.animValue.interpolate({
          inputRange: [0, 0.5, 1, 1.8, 2],
          outputRange: [0, 1, 1, 1, 0],
        });

        return (
          <Animated.View
            key={`${trick.timestamp}-${trick.type}`}
            style={[
              styles.trickContainer,
              {
                transform: [{ scale }, { translateY }],
                opacity,
                top: index * 60,
              },
            ]}
          >
            <Text style={[styles.trickValue, { color: getTrickColor(trick) }]}>
              +{trick.value}
            </Text>
            <Text style={[styles.trickLabel, { color: getTrickColor(trick) }]}>
              {trick.label}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  trickContainer: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  trickValue: {
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  trickLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
});

export default TrickPopup;
