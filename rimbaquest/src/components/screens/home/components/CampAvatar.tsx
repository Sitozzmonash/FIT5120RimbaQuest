import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../../../../constants/fonts';
import { HOME_COLORS } from '../homeTheme';

const SIZE = 60;

// Gold-ringed explorer portrait with the level coin in its corner.
export function CampAvatar({ image, level }: { image: ImageSourcePropType; level: number }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.ring, styles.drop]} />
      <View style={[styles.ring, styles.outerRing]} />
      <View style={[styles.ring, styles.goldRing]} />
      <View style={styles.face}>
        <Image source={image} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.levelCoin}>
        <Text style={styles.levelText}>{level}</Text>
      </View>
    </View>
  );
}

const ring = (size: number, offset: number) => ({
  width: size,
  height: size,
  left: offset,
  top: offset,
});

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 56, top: 22, width: SIZE, height: SIZE },
  ring: { position: 'absolute', borderRadius: 999 },
  drop: { ...ring(SIZE + 4, -2), top: 6, backgroundColor: HOME_COLORS.ink },
  outerRing: { ...ring(SIZE + 14, -7), backgroundColor: HOME_COLORS.ink },
  goldRing: { ...ring(SIZE + 8, -4), backgroundColor: HOME_COLORS.gold },
  face: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
    borderColor: HOME_COLORS.ink,
    backgroundColor: '#D8ECCE',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  levelCoin: {
    position: 'absolute',
    right: -8,
    bottom: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: HOME_COLORS.ink,
    backgroundColor: HOME_COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { fontFamily: FONTS.display, color: '#4A2A05', fontSize: 13, textAlign: 'center' },
});
