import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { BattleEvent } from '../../../../types/battle';

const palette: Record<string, string> = {
  leaves: '#68D391',
  stars: '#F6E05E',
  water: '#63B3ED',
  wind: '#B2F5EA',
  light: '#FAF089',
  shield: '#90CDF4',
  heal: '#9AE6B4',
  power: '#FC8181',
  fang: '#FEB2B2',
  roar: '#FBD38D',
};

export interface BattleEffectLayerProps {
  activeEvent: BattleEvent | null;
  targetSide?: 'player' | 'opponent';
  reducedMotion?: boolean;
}

export function BattleEffectLayer({
  activeEvent,
  targetSide = 'opponent',
  reducedMotion = false,
}: BattleEffectLayerProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    if (!activeEvent || reducedMotion) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [activeEvent, progress, reducedMotion]);

  if (
    !activeEvent ||
    !['damage', 'heal', 'shield', 'guard', 'boost', 'weaken', 'passive', 'outcome'].includes(
      activeEvent.type
    )
  ) {
    return null;
  }

  const vfxKey = (activeEvent.vfx || '').toLowerCase();
  const color = palette[vfxKey] || palette.light;
  const target = activeEvent.target || targetSide;
  const value =
    activeEvent.value != null
      ? activeEvent.type === 'heal'
        ? `+${activeEvent.value}`
        : activeEvent.type === 'damage'
        ? `-${activeEvent.value}`
        : activeEvent.type === 'shield'
        ? `🛡+${activeEvent.value}`
        : ''
      : '';

  const animatedStyle = reducedMotion
    ? { opacity: 0.95 }
    : {
        opacity: progress.interpolate({
          inputRange: [0, 0.2, 0.85, 1],
          outputRange: [0, 1, 0.9, 0],
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [10, -32],
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0.6, 1.1, 0.95],
            }),
          },
        ],
      };

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.effect, target === 'player' ? styles.player : styles.opponent, animatedStyle]}
    >
      <View style={[styles.spark, { backgroundColor: color }]} />
      {Boolean(value) && <Text style={[styles.value, { color }]}>{value}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  effect: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
    gap: 3,
  },
  player: {
    left: '26%',
    bottom: 72,
  },
  opponent: {
    right: '26%',
    top: 76,
  },
  spark: {
    width: 24,
    height: 24,
    borderWidth: 2.5,
    borderColor: '#FFFDF0',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  value: {
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: '#1A2E26',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
});
