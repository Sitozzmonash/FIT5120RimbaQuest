import React, { useEffect, useState } from 'react';
import { BackHandler, Platform, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../types';
import { styles } from '../styles/theme';

import { HomeScreen } from '../components/screens/home';
import { LocationDetailScreen, LocationsScreen } from '../components/screens/locations';
import {
  CameraScreen,
  PhotoPreviewScreen,
  ConfirmScreen,
  SpeciesScreen,
  SuccessScreen,
} from '../components/screens/discovery';
import { AbilityQuizScreen, CollectionScreen, LockedScreen, SpeciesDetailScreen } from '../components/screens/collection';
import { GlobalInvitePopup, WildlifeBattleExperience } from '../components/screens/wildlifeBattle';
import { AppLoadingModal } from '../components/common/AppLoadingModal';
import { AppLoadingScreen } from '../components/common/AppLoadingScreen';
import { ExitConfirmModal } from '../components/common/ExitConfirmModal';
import { ScreenGuideModal } from '../components/common/game/ScreenGuideModal';
import { PhotoSourceSheet } from '../components/screens/discovery/components/PhotoSourceSheet';
import { AccountEntryScreen } from '../components/screens/AccountEntryScreen';
import { LoginScreen } from '../components/screens/login';
import { AccountCreationScreen } from '../components/screens/account-creation';
import { ForgotPasswordScreen, ResetPasswordScreen } from '../components/screens/passwordRecovery';
import { ProfileEditScreen, ProfileScreen } from '../components/screens/profile';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useWebPageColors } from '../hooks/useWebPageColors';
import { useBattleInviteStore } from '../store/useBattleInviteStore';
import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { useLocationsStore } from '../store/useLocationsStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useSpeciesCatalogStore } from '../store/useSpeciesCatalogStore';
import { useUserStore } from '../store/useUserStore';

const GRADIENT_SCREENS: Screen[] = ['account_entry', 'login', 'create_account', 'forgot_password', 'reset_password', 'collection', 'locations', 'location_detail', 'progress', 'profile_edit', 'locked', 'about', 'facts', 'battle_stats', 'gallery', 'quiz', 'species', 'confirm', 'success', 'battle_select'];

export default function RimbaQuest() {
  const screen = useNavigationStore((state) => state.screen);
  useWebPageColors(screen);

  const bootstrapped = useUserStore((state) => state.bootstrapped);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  useBackgroundMusic(screen, isLoggedIn);

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

  useEffect(() => {
    if (!isLoggedIn) {
      useBattleInviteStore.getState().reset();
      useLocationsStore.getState().stopLocationUpdates();
      useLocationsStore.setState({ sessionConsent: false });
    }
  }, [isLoggedIn]);

  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBackPress = () => {
      const { screen: currentScreen, history, goBack } = useNavigationStore.getState();
      // The battle flow confirms a forfeit before leaving an active match.
      if (currentScreen === 'battle_select') return false;
      if (history.length > 0) {
        goBack();
        return true;
      }

      setExitConfirmVisible(true);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => subscription.remove();
  }, []);

  const discoveryPhotoUri = useDiscoveryStore((state) => state.photoUri);

  if (!bootstrapped) {
    return <AppLoadingScreen />;
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

        {screen === 'species' && discoveryPhotoUri && <SpeciesScreen />}

        {screen === 'confirm' && discoveryPhotoUri && <ConfirmScreen />}

        {screen === 'success' && <SuccessScreen />}

        {screen === 'collection' && <CollectionScreen />}

        {(screen === 'about' || screen === 'battle_stats' || screen === 'facts' || screen === 'gallery') && (
          <SpeciesDetailScreen />
        )}

        {screen === 'quiz' && <AbilityQuizScreen />}

        {screen === 'locked' && <LockedScreen />}

        {screen === 'battle_select' && (
          <WildlifeBattleExperience onBack={() => useNavigationStore.getState().goBack()} />
        )}

        {screen === 'account_entry' && <AccountEntryScreen />}

        {screen === 'login' && <LoginScreen />}

        {screen === 'create_account' && <AccountCreationScreen />}

        {screen === 'forgot_password' && <ForgotPasswordScreen />}

        {screen === 'reset_password' && <ResetPasswordScreen />}

        {screen === 'profile_edit' && <ProfileEditScreen />}

        {screen === 'progress' && <ProfileScreen />}
      </View>

      {isLoggedIn && screen !== 'battle_select' && <GlobalInvitePopup />}
      <ScreenGuideModal />
      {Platform.OS === 'web' && <PhotoSourceSheet />}
      <AppLoadingModal />
      <ExitConfirmModal
        visible={exitConfirmVisible}
        onStay={() => setExitConfirmVisible(false)}
        onLeave={() => BackHandler.exitApp()}
      />
    </SafeAreaView>
  );
}
