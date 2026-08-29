import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AUTH_IMAGES } from '../../constants/images';
import { HOME_IMAGES } from '../../constants/images';
import { Tap } from '../common/Tap';
import { PrimaryButton } from '../common/PrimaryButton';
import { styles } from '../../styles/theme';

export function AccountEntryScreen({
  onLogin,
  onCreateAccount,
}: {
  onLogin: () => void;
  onCreateAccount: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.entryRoot}>
      <LinearGradient
        colors={['#C8F0D8', '#E0F5E9', '#F0FAF4', '#E8F6EE']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.entryBackground}
      />
      <View style={[styles.entryDecoCircle1, { pointerEvents: 'none' }]} />
      <View style={[styles.entryDecoCircle2, { pointerEvents: 'none' }]} />

      <ScrollView
        contentContainerStyle={[styles.entryScroll, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <View style={styles.entryMascotArea}>
          <Image source={HOME_IMAGES.brandLogo} style={styles.entryBrandLogo} resizeMode="contain" />
          <View style={styles.entryMascotBlob}>
            <Image source={AUTH_IMAGES.mascotWelcome} style={styles.entryMascotImage} resizeMode="cover" />
          </View>
        </View>

        <View style={styles.entryContent}>
          <View style={styles.entryTextGroup}>
            <Text style={styles.entryTitle}>Start your wildlife adventure</Text>
            <Text style={styles.entrySubtitle}>
              Log in to continue your journey or create an account to save your discoveries.
            </Text>
          </View>

          <View style={styles.entryButtons}>
            <PrimaryButton label="Log In" onPress={onLogin} />
            <Tap label="Create Account" style={styles.entryCreateBtn} onPress={onCreateAccount}>
              <Text style={styles.entryCreateBtnText}>Create Account</Text>
            </Tap>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
