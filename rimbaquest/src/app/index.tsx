import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../types';
import { styles } from '../styles/theme';

import { HomeScreen } from '../components/screens/HomeScreen';
import { LocationDetailScreen, LocationsScreen } from '../components/screens/locations';
import {
  CameraScreen,
  PhotoPreviewScreen,
  CategoryScreen,
  ConfirmScreen,
  SpeciesScreen,
  SuccessScreen,
} from '../components/screens/discovery';
import { AbilityQuizScreen, CollectionScreen, LockedScreen, SpeciesDetailScreen } from '../components/screens/collection';
import { BattleArenaScreen, BattleSelectScreen } from '../components/screens/battle';
import { AccountEntryScreen } from '../components/screens/AccountEntryScreen';
import { LoginScreen } from '../components/screens/login';
import { AccountCreationScreen } from '../components/screens/account-creation';
import { ForgotPasswordScreen, ResetPasswordScreen } from '../components/screens/passwordRecovery';
import { ProfileEditScreen, ProfileScreen } from '../components/screens/profile';
import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useSpeciesCatalogStore } from '../store/useSpeciesCatalogStore';
import { useUserStore } from '../store/useUserStore';

const GRADIENT_SCREENS: Screen[] = ['account_entry', 'login', 'create_account', 'forgot_password', 'reset_password', 'collection', 'locations', 'location_detail', 'progress', 'profile_edit'];

export default function RimbaQuest() {
  const screen = useNavigationStore((state) => state.screen);

  const bootstrapped = useUserStore((state) => state.bootstrapped);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  useEffect(() => {
    void useUserStore.getState().restoreSession();
  }, []);

  useEffect(() => {
    void useSpeciesCatalogStore.getState().loadSpecies();
  }, []);

  // goBack() lands here once its history stack is empty.
  useEffect(() => {
    useNavigationStore.getState().setFallbackScreen(isLoggedIn ? 'home' : 'account_entry');
  }, [isLoggedIn]);

  const discoveryPhotoUri = useDiscoveryStore((state) => state.photoUri);

  if (!bootstrapped) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color="#0BA84A" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const fullBleed = (screen === 'home' && isLoggedIn) || GRADIENT_SCREENS.includes(screen);

  return (
    <SafeAreaView
      style={[styles.safe, fullBleed && styles.safeTransparent]}
      edges={fullBleed ? [] : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.page, fullBleed && styles.pageTransparent]}>
        {screen === 'home' && isLoggedIn && <HomeScreen />}

        {screen === 'locations' && <LocationsScreen />}

        {screen === 'location_detail' && <LocationDetailScreen />}

        {screen === 'photo' && <CameraScreen />}

        {screen === 'photo_preview' && discoveryPhotoUri && <PhotoPreviewScreen />}

        {screen === 'category' && discoveryPhotoUri && <CategoryScreen />}

        {screen === 'species' && discoveryPhotoUri && <SpeciesScreen />}

        {screen === 'confirm' && discoveryPhotoUri && <ConfirmScreen />}

        {screen === 'success' && <SuccessScreen />}

        {screen === 'collection' && <CollectionScreen />}

        {(screen === 'about' || screen === 'battle_stats' || screen === 'facts' || screen === 'gallery') && (
          <SpeciesDetailScreen />
        )}

        {screen === 'quiz' && <AbilityQuizScreen />}

        {screen === 'locked' && <LockedScreen />}

        {screen === 'battle_select' && <BattleSelectScreen />}

        {screen === 'battle_arena' && <BattleArenaScreen />}

        {screen === 'account_entry' && <AccountEntryScreen />}

        {screen === 'login' && <LoginScreen />}

        {screen === 'create_account' && <AccountCreationScreen />}

        {screen === 'forgot_password' && <ForgotPasswordScreen />}

        {screen === 'reset_password' && <ResetPasswordScreen />}

        {screen === 'profile_edit' && <ProfileEditScreen />}

        {screen === 'progress' && <ProfileScreen />}
      </View>
    </SafeAreaView>
  );
}
