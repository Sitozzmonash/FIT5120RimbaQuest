import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HOME_MAP_IMAGES } from '../../../../constants/images';
import { HOME_COLORS } from '../homeTheme';

export function HomeHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top, height: 76 + insets.top }]}>
      <Image
        source={HOME_MAP_IMAGES.brandLogo}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="RimbaQuest – Explore. Learn. Protect."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: HOME_COLORS.paper,
    backgroundColor: "#D8ECCE",
    borderBottomWidth: 3,
    borderBottomColor: HOME_COLORS.ink,
  },
  logo: { width: 176, height: 48.69 },
});
