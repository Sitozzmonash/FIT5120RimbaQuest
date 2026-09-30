import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FONTS } from '../../../../constants/fonts';
import { HOME_COLORS } from '../homeTheme';

// Green pill pinned to the top-right corner of a map node.
export function MapBadge({ label, style }: { label: string; style?: ViewStyle }) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -19,
    backgroundColor: HOME_COLORS.badgeGreen,
    borderColor: HOME_COLORS.ink,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  text: {
    fontFamily: FONTS.display,
    color: HOME_COLORS.paper,
    fontSize: 14,
    textAlign: 'center',
  },
});
