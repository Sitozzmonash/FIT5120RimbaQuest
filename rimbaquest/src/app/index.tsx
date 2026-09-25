import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../types';
import { API_BASE } from '../constants/config';
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
import { BattleArenaScreen, BattlePreparingModal, BattleSelectScreen } from '../components/screens/battle';
import { AppLoadingModal } from '../components/common/AppLoadingModal';
import { ExitConfirmModal } from '../components/common/ExitConfirmModal';
import { AccountEntryScreen } from '../components/screens/AccountEntryScreen';
import { LoginScreen } from '../components/screens/login';
import { AccountCreationScreen } from '../components/screens/account-creation';
import { ForgotPasswordScreen, ResetPasswordScreen } from '../components/screens/passwordRecovery';
import { ProfileEditScreen, ProfileScreen } from '../components/screens/profile';
import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useSpeciesCatalogStore } from '../store/useSpeciesCatalogStore';
import { useUserStore } from '../store/useUserStore';
import { useBattleStore } from '../store/useBattleStore';
import { useBattleSession } from '../hooks/useBattleSession';
import { useUnlockedBattleSpecies } from '../hooks/useUnlockedBattleSpecies';

const GRADIENT_SCREENS: Screen[] = ['account_entry', 'login', 'create_account', 'forgot_password', 'reset_password', 'collection', 'locations', 'location_detail', 'progress', 'profile_edit'];

export default function RimbaQuest() {
  const screen = useNavigationStore((state) => state.screen);

  const bootstrapped = useUserStore((state) => state.bootstrapped);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const childId = useUserStore((state) => state.currentUser.id);
  const accessToken = useUserStore((state) => state.accessToken);
  const expireSession = useUserStore((state) => state.expire);
  const updateCurrentUser = useUserStore((state) => state.updateCurrentUser);
  const battlePlayerCard = useBattleStore((state) => state.playerCard);
  const battleDifficulty = useBattleStore((state) => state.difficulty);
  const pendingBattle = useBattleStore((state) => state.pendingBattle);
  const unlockedSpecies = useUnlockedBattleSpecies();
  const [cardUnlockSlots, setCardUnlockSlots] = useState<Record<string, number[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  const battleSession = useBattleSession({
    apiBase: API_BASE,
    childId,
    token: accessToken,
    selectedSpecies: battlePlayerCard,
    difficulty: battleDifficulty,
    active: isLoggedIn,
    onSessionExpired: expireSession,
    onXpAwarded: (xp) => updateCurrentUser({ xp }),
  });

  useEffect(() => {
    useBattleStore.getState().reset();
    setCardUnlockSlots({});
  }, [childId, accessToken]);

  useEffect(() => {
    if (!pendingBattle || !isLoggedIn) return;
    // Consume once, including when effects are replayed in development.
    if (useBattleStore.getState().pendingBattle !== pendingBattle) return;
    useBattleStore.getState().clearPendingBattle();
    void battleSession.startBattle(pendingBattle.card, pendingBattle.difficulty);
  }, [pendingBattle, isLoggedIn, battleSession.startBattle]);

  const previousScreen = useRef<Screen>(screen);
  useEffect(() => {
    if (previousScreen.current === 'battle_arena' && screen !== 'battle_arena') {
      battleSession.reset();
      useBattleStore.getState().clearPendingBattle();
    }
    previousScreen.current = screen;
  }, [screen, battleSession.reset]);

  useEffect(() => {
    const speciesId = battlePlayerCard?.id;
    if (screen !== 'battle_select' || !speciesId || !childId || !accessToken) {
      setLoadingSlots(false);
      return;
    }
    const controller = new AbortController();
    setLoadingSlots(true);
    void (async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/children/${childId}/species/${encodeURIComponent(speciesId)}/battle-card`,
          { headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        if (response.status === 401 || response.status === 403) {
          await expireSession();
          return;
        }
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted && Array.isArray(data.card?.unlocked_abilities)) {
          setCardUnlockSlots((current) => ({
            ...current,
            [speciesId]: data.card.unlocked_abilities,
          }));
        }
      } catch {
        // Retain cached unlocks while offline; the server validates battle moves.
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    })();
    return () => controller.abort();
  }, [screen, battlePlayerCard?.id, childId, accessToken, expireSession]);

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

  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBackPress = () => {
      const { screen: currentScreen, history, goBack } = useNavigationStore.getState();
      // The arena confirms surrender before allowing a live battle to close.
      if (currentScreen === 'battle_arena') return false;
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

        {screen === 'battle_select' && (
          <BattleSelectScreen
            unlockedSpecies={unlockedSpecies}
            selectedCard={battlePlayerCard}
            difficulty={battleDifficulty}
            unlockedAbilitiesMap={cardUnlockSlots}
            loadingSlots={loadingSlots}
            onSelectCard={useBattleStore.getState().selectCard}
            onChangeDifficulty={useBattleStore.getState().setDifficulty}
            onStartBattle={() => battlePlayerCard && useBattleStore.getState().startBattle(battlePlayerCard)}
            onStartDiscovery={() => useDiscoveryStore.getState().start()}
            onBack={() => useNavigationStore.getState().goBack()}
          />
        )}

        {screen === 'battle_arena' && battlePlayerCard && (
          <BattleArenaScreen
            card={battlePlayerCard}
            battleState={battleSession.state}
            events={battleSession.events}
            latestEvent={battleSession.latestEvent}
            loading={battleSession.loading}
            rolling={battleSession.rolling}
            actionInProgress={battleSession.actionInProgress}
            error={battleSession.error}
            canRetry={battleSession.canRetry}
            canRefresh={battleSession.canRefresh}
            canRestart={battleSession.canRestart}
            reducedMotion={battleSession.reducedMotion}
            xpAwarded={battleSession.xpAwarded}
            onRollDice={battleSession.rollDice}
            onPerformAction={battleSession.performAction}
            onSurrender={battleSession.surrender}
            onRetry={battleSession.retry}
            onRefresh={battleSession.refreshState}
            onRestart={() => {
              battleSession.reset();
              void battleSession.startBattle(battlePlayerCard, battleDifficulty);
            }}
            onBattleAgain={() => void battleSession.startBattle(battlePlayerCard, battleDifficulty)}
            onSelectAnotherCard={() => useNavigationStore.getState().resetTo('battle_select')}
            onBack={() => useNavigationStore.getState().goBack()}
            onLeave={() => useNavigationStore.getState().resetTo('home')}
          />
        )}

        {screen === 'account_entry' && <AccountEntryScreen />}

        {screen === 'login' && <LoginScreen />}

        {screen === 'create_account' && <AccountCreationScreen />}

        {screen === 'forgot_password' && <ForgotPasswordScreen />}

        {screen === 'reset_password' && <ResetPasswordScreen />}

        {screen === 'profile_edit' && <ProfileEditScreen />}

        {screen === 'progress' && <ProfileScreen />}
      </View>

      <BattlePreparingModal visible={screen === 'battle_arena' && battleSession.loading} />
      <AppLoadingModal />
      <ExitConfirmModal
        visible={exitConfirmVisible}
        onStay={() => setExitConfirmVisible(false)}
        onLeave={() => BackHandler.exitApp()}
      />
    </SafeAreaView>
  );
}
