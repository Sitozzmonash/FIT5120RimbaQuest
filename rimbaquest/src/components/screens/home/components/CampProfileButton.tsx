import React from 'react';
import { ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { ScaleTap } from '../../../common/ScaleTap';
import { HOME_COLORS, signTextStyle } from '../homeTheme';
import { CampAvatar } from './CampAvatar';
import { CampTent } from './CampTent';
import { WoodenSign } from './WoodenSign';

const CAMP_SIGN_LINES: [number, number][] = [
  [20.101, 25.126],
  [45.226, 50.251],
  [70.352, 75.377],
  [95.477, 100],
];

// "My Camp": tent, avatar and name sign that opens the explorer profile.
export function CampProfileButton({
  name,
  level,
  avatar,
  left,
  top,
  onPress,
}: {
  name: string;
  level: number;
  avatar: ImageSourcePropType;
  left: number;
  top: number;
  onPress: () => void;
}) {
  return (
    <ScaleTap
      label={`Open my profile, ${name}, level ${level}`}
      style={[styles.camp, { left, top }]}
      onPress={onPress}
    >
      <CampTent />
      <CampAvatar image={avatar} level={level} />
      <View style={styles.signPost} />
      <WoodenSign lines={CAMP_SIGN_LINES} shadowOffset={4} style={styles.sign}>
        <Text style={styles.caption}>MY CAMP</Text>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </WoodenSign>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  camp: { position: 'absolute', width: 262, height: 90 },
  signPost: {
    position: 'absolute',
    left: 190,
    top: 44,
    width: 14,
    height: 42,
    backgroundColor: '#8A5220',
    borderWidth: 3,
    borderColor: HOME_COLORS.ink,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  sign: {
    position: 'absolute',
    left: 128,
    top: 16,
    width: 134,
    paddingTop: 5,
    paddingBottom: 6,
    paddingHorizontal: 8,
  },
  caption: { color: '#FFE7A8', fontSize: 9.8, fontWeight: '900', letterSpacing: 1 },
  name: { ...signTextStyle, fontSize: 16, lineHeight: 16.8, paddingBottom: 0.8 },
});
