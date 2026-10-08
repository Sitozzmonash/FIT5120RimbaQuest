import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tap } from '../../../common/Tap';
import { HOME_MAP_IMAGES } from '../../../../constants/images';
import { isAudioMuted, setAudioMuted } from '../../../../utils/sounds';
import { HOME_COLORS } from '../homeTheme';

export function HomeHeader({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [muted, setMuted] = useState(isAudioMuted);

  const toggleMute = () => {
    const next = !muted;
    setAudioMuted(next);
    setMuted(next);
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top, height: 76 + insets.top }]}>
      <View style={styles.row}>
        <Tap
          onPress={onRefresh}
          disabled={refreshing}
          label={refreshing ? 'Refreshing home' : 'Refresh home'}
          style={styles.iconButton}
        >
          <MaterialIcons name="refresh" size={27} color={HOME_COLORS.ink} />
        </Tap>
        <Image
          source={HOME_MAP_IMAGES.brandLogo}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="RimbaQuest – Explore. Learn. Protect."
        />
        <Tap
          onPress={toggleMute}
          label={muted ? 'Unmute sound' : 'Mute sound'}
          style={styles.iconButton}
        >
          <MaterialIcons
            name={muted ? 'volume-off' : 'volume-up'}
            size={25}
            color={HOME_COLORS.ink}
          />
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#D8ECCE',
    borderBottomWidth: 3,
    borderBottomColor: HOME_COLORS.ink,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: HOME_COLORS.ink,
    borderRadius: 22,
    backgroundColor: HOME_COLORS.paper,
  },
  logo: { width: 176, height: 48.69 },
});
