import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { LocationItem, QuizQuestion, RecentCapture, Screen, Species, UserProfile } from '../types';
import { API_BASE } from '../constants/config';
import { CATEGORIES, OFFLINE_LOCATIONS, SEED_SPECIES } from '../constants/seed';
import { IMAGES, hasReferenceImage } from '../constants/images';
import { styles } from '../styles/theme';

import { BottomNav } from '../components/common/BottomNav';
import { HomeScreen } from '../components/screens/HomeScreen';
import { LocationDetailScreen, LocationsScreen } from '../components/screens/LocationsScreen';
import {
  CameraScreen,
  CategoryScreen,
  ConfirmScreen,
  SpeciesScreen,
  SuccessScreen,
} from '../components/screens/DiscoveryScreens';
import { CollectionScreen, LockedScreen, SpeciesDetailScreen } from '../components/screens/CollectionScreens';
import { BattleArenaScreen, BattleSelectScreen } from '../components/screens/BattleScreens';
import {
  AuthScreen,
  ForgotPasswordScreen,
  ProfileEditScreen,
  ProfileScreen,
} from '../components/screens/AuthScreens';

const OFFLINE_SPECIES = Array.from(new Map(SEED_SPECIES.map((item) => [item.id, item])).values());

export default function RimbaQuest() {
  // Navigation & Core State
  const [screen, setScreen] = useState<Screen>('home');
  const [history, setHistory] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // Data Catalog
  const [species, setSpecies] = useState<Species[]>(OFFLINE_SPECIES);
  const [selected, setSelected] = useState<Species>(OFFLINE_SPECIES[0]);
  const [category, setCategory] = useState('Mammal');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [discovered, setDiscovered] = useState<string[]>(['sp_common_mormon', 'sp_oriental_pied_hornbill']);
  const [filter, setFilter] = useState('All');

  // Discovery Flow
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, string[]>>({});
  const [recentCaptures, setRecentCaptures] = useState<RecentCapture[]>([]);
  const [discoveryLocation, setDiscoveryLocation] = useState('Bukit Gasing Forest Reserve');
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Locations Flow
  const [locations, setLocations] = useState<LocationItem[]>(OFFLINE_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationCategoryFilter, setLocationCategoryFilter] = useState('All');

  // User & Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 1,
    username: 'aisyah',
    display_name: 'Aisyah',
    avatar: 'tapir',
    age: 10,
    age_band: '8-11',
    xp: 200,
    level: 1,
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authAge, setAuthAge] = useState('10');
  const [authAvatar, setAuthAvatar] = useState('tapir');
  const [authError, setAuthError] = useState<string | null>(null);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  const [editDisplayName, setEditDisplayName] = useState('Aisyah');
  const [editAvatar, setEditAvatar] = useState('tapir');
  const [editAge, setEditAge] = useState('10');

  // Quiz State
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);

  // Battle State
  const [battlePlayerCard, setBattlePlayerCard] = useState<Species | null>(null);
  const [battlePlayerHp, setBattlePlayerHp] = useState(120);
  const [battlePlayerMaxHp, setBattlePlayerMaxHp] = useState(120);
  const [battleOpponentHp, setBattleOpponentHp] = useState(100);
  const [battleOpponentMaxHp, setBattleOpponentMaxHp] = useState(100);
  const [battleOpponentName, setBattleOpponentName] = useState('Wild Forest Boar');
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleRound, setBattleRound] = useState(1);
  const [battleOutcome, setBattleOutcome] = useState<'playing' | 'win' | 'lose' | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);

  // Synchronize Backend Data
  const refresh = async () => {
    try {
      const childId = currentUser.id || 1;
      const [speciesRes, collectionRes, profileRes, recentRes, locationsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/species`),
        fetch(`${API_BASE}/api/v1/children/${childId}/collection`),
        fetch(`${API_BASE}/api/v1/children/${childId}/profile`),
        fetch(`${API_BASE}/api/v1/children/${childId}/recent-captures`),
        fetch(`${API_BASE}/api/v1/locations`),
      ]);

      if (speciesRes.ok) setSpecies(await speciesRes.json());
      if (collectionRes.ok) {
        const data = await collectionRes.json();
        setDiscovered(data.items.filter((item: { discovered: number }) => item.discovered).map((item: { id: string }) => item.id));
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setCurrentUser((prev) => ({ ...prev, ...data }));
      }
      if (recentRes.ok) {
        const data = await recentRes.json();
        setRecentCaptures(data.items);
      }
      if (locationsRes.ok) {
        const data = await locationsRes.json();
        if (data.items?.length) setLocations(data.items);
      }
    } catch {
      setNotice('You are exploring in offline demo mode. Discoveries will sync when the backend connects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [currentUser.id]);

  // Derived Views
  const supportedSpecies = useMemo(() => species.filter(hasReferenceImage), [species]);
  const visibleSpecies = useMemo(
    () =>
      supportedSpecies
        .filter((item) => filter === 'All' || item.category === filter)
        .sort((left, right) => {
          const unlockOrder = Number(discovered.includes(right.id)) - Number(discovered.includes(left.id));
          return unlockOrder || left.common_name.localeCompare(right.common_name);
        }),
    [discovered, filter, supportedSpecies]
  );
  const unlockedSpeciesList = useMemo(
    () => supportedSpecies.filter((item) => discovered.includes(item.id)),
    [discovered, supportedSpecies]
  );
  const selectedCategorySpecies = useMemo(
    () => supportedSpecies.filter((item) => item.category === category),
    [category, supportedSpecies]
  );
  const filteredCategorySpecies = useMemo(() => {
    const query = speciesSearch.trim().toLowerCase();
    if (!query) return selectedCategorySpecies;
    return selectedCategorySpecies.filter(
      (item) => item.common_name.toLowerCase().includes(query) || item.scientific_name.toLowerCase().includes(query)
    );
  }, [selectedCategorySpecies, speciesSearch]);

  const filteredLocations = useMemo(() => {
    const query = locationSearch.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchesQuery =
        !query ||
        loc.name.toLowerCase().includes(query) ||
        loc.area.toLowerCase().includes(query) ||
        loc.description.toLowerCase().includes(query);
      const matchesCategory =
        locationCategoryFilter === 'All' ||
        loc.typical_wildlife?.toLowerCase().includes(locationCategoryFilter.toLowerCase().slice(0, 4));
      return matchesQuery && matchesCategory;
    });
  }, [locations, locationSearch, locationCategoryFilter]);

  const displayProgress = useMemo(
    () => ({
      found: discovered.filter((id) => supportedSpecies.some((item) => item.id === id)).length,
      total: supportedSpecies.length,
      xp: currentUser.xp,
      level: currentUser.level,
    }),
    [discovered, supportedSpecies, currentUser]
  );

  // Router Functions
  const open = (next: Screen) => {
    setHistory((cur) => [...cur, screen]);
    setScreen(next);
  };
  const resetTo = (next: Screen) => {
    setHistory([]);
    setScreen(next);
  };
  const goBack = () => {
    setHistory((cur) => {
      const prev = cur[cur.length - 1];
      setScreen(prev ?? 'home');
      return cur.slice(0, -1);
    });
  };

  // Discovery Actions
  const startDiscovery = (presetLocation?: string) => {
    if (presetLocation) setDiscoveryLocation(presetLocation);
    setPhotoUri(null);
    resetTo('photo');
  };

  const takePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) {
      setPhotoUri(photo.uri);
      open('category');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        open('category');
      }
    } catch {
      setPhotoUri(null);
      open('category');
    }
  };

  const recordDiscovery = async () => {
    const savePersonalPhoto = () => {
      if (!photoUri) return;
      setGalleryPhotos((current) => ({
        ...current,
        [selected.id]: [photoUri, ...(current[selected.id] ?? [])],
      }));
    };
    try {
      const response = await fetch(`${API_BASE}/api/v1/children/${currentUser.id}/discoveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species_id: selected.id, location_label: discoveryLocation }),
      });
      if (!response.ok) throw new Error('Unable to save');
      const result = (await response.json()) as { first_discovery?: boolean; total_xp?: number };
      if (result.first_discovery && !discovered.includes(selected.id)) {
        setDiscovered((current) => [...current, selected.id]);
        setCurrentUser((prev) => ({ ...prev, xp: result.total_xp ?? prev.xp + 100 }));
      }
      savePersonalPhoto();
      await refresh();
      open('success');
    } catch {
      if (!discovered.includes(selected.id)) {
        setDiscovered((current) => [...current, selected.id]);
        setCurrentUser((prev) => ({ ...prev, xp: prev.xp + 100 }));
      }
      savePersonalPhoto();
      open('success');
    }
  };

  // Auth Operations
  const handleRegister = async () => {
    setAuthError(null);
    if (!authUsername.trim()) return setAuthError('Please enter a username.');
    if (authUsername.length < 3 || authUsername.length > 20) return setAuthError('Username must be between 3 and 20 characters.');
    if (authUsername.includes(' ')) return setAuthError('Username cannot contain spaces.');
    if (!authEmail.trim() || !authEmail.includes('@') || !authEmail.includes('.')) return setAuthError('Please enter a valid email address.');
    if (!authPassword) return setAuthError('Please create a password.');
    if (authPassword.length < 6) return setAuthError('Password must be at least 6 characters.');
    if (authPassword !== authConfirmPassword) return setAuthError('Passwords do not match. Please confirm your password.');

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername.trim(),
          age: parseInt(authAge, 10) || 10,
          email: authEmail.trim(),
          password: authPassword,
          avatar: authAvatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setAuthError(data.detail || 'Registration failed.');
      setCurrentUser({
        id: data.child_id,
        username: data.username,
        display_name: data.display_name,
        avatar: data.avatar,
        age: data.age,
        age_band: '8-11',
        xp: data.xp,
        level: data.level,
      });
      resetTo('home');
    } catch {
      setCurrentUser({
        id: 2,
        username: authUsername.trim(),
        display_name: authUsername.trim(),
        avatar: authAvatar,
        age: parseInt(authAge, 10) || 10,
        age_band: '8-11',
        xp: 0,
        level: 1,
      });
      resetTo('home');
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    if (!authUsername.trim()) return setAuthError('Please enter your username or email.');
    if (!authPassword) return setAuthError('Please enter your password.');

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: authUsername.trim(), password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setAuthError(data.detail || 'Invalid username or password.');
      setCurrentUser({
        id: data.child_id,
        username: data.username,
        display_name: data.display_name,
        avatar: data.avatar,
        age: data.age,
        age_band: '8-11',
        xp: data.xp,
        level: data.level,
      });
      resetTo('home');
    } catch {
      setAuthError('Unable to connect to login server.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/children/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editDisplayName.trim() || currentUser.display_name,
          avatar: editAvatar,
          age: parseInt(editAge, 10) || currentUser.age,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser((prev) => ({ ...prev, ...data }));
      }
    } catch {
      setCurrentUser((prev) => ({
        ...prev,
        display_name: editDisplayName.trim() || prev.display_name,
        avatar: editAvatar,
        age: parseInt(editAge, 10) || prev.age,
      }));
    }
    goBack();
  };

  // Battle Logic
  const initBattle = (card: Species) => {
    setBattlePlayerCard(card);
    const hp = card.hp || 120;
    setBattlePlayerHp(hp);
    setBattlePlayerMaxHp(hp);
    const opponentHp = 100 + Math.floor(Math.random() * 20);
    setBattleOpponentHp(opponentHp);
    setBattleOpponentMaxHp(opponentHp);
    setBattleOpponentName('Wild Forest Boar');
    setBattleLog([
      '🌲 A wild opponent (Wild Forest Boar) appeared!',
      `🐾 You sent out ${card.common_name} (HP: ${hp}, ATK: ${card.base_attack || 25})!`,
    ]);
    setBattleRound(1);
    setBattleOutcome('playing');
    open('battle_arena');
  };

  const performAttack = () => {
    if (!battlePlayerCard || isAttacking || battleOutcome !== 'playing') return;
    setIsAttacking(true);

    const playerAtk = battlePlayerCard.base_attack || 25;
    const playerDmg = playerAtk + Math.floor(Math.random() * 8) - 3;
    const nextOpponentHp = Math.max(0, battleOpponentHp - playerDmg);
    const newLogs = [...battleLog, `⚔️ ${battlePlayerCard.common_name} used Basic Strike for ${playerDmg} DMG!`];

    if (nextOpponentHp <= 0) {
      setBattleOpponentHp(0);
      newLogs.push('🏆 Wild Forest Boar fainted! You won the battle!');
      setBattleLog(newLogs);
      setBattleOutcome('win');
      setIsAttacking(false);
      fetch(`${API_BASE}/api/v1/children/${currentUser.id}/battle/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ won: true, opponent_name: battleOpponentName, rounds: battleRound }),
      }).then(() => refresh()).catch(() => {});
      return;
    }

    setBattleOpponentHp(nextOpponentHp);
    setTimeout(() => {
      const oppDmg = 18 + Math.floor(Math.random() * 10);
      const nextPlayerHp = Math.max(0, battlePlayerHp - oppDmg);
      newLogs.push(`💥 ${battleOpponentName} counter-attacked for ${oppDmg} DMG!`);
      if (nextPlayerHp <= 0) {
        setBattlePlayerHp(0);
        newLogs.push(`💔 ${battlePlayerCard.common_name} is exhausted! Try another round!`);
        setBattleOutcome('lose');
      } else {
        setBattlePlayerHp(nextPlayerHp);
      }
      setBattleLog(newLogs);
      setBattleRound((r) => r + 1);
      setIsAttacking(false);
    }, 600);
  };

  const openQuiz = async () => {
    const fallback: QuizQuestion = {
      question: `Which statement about ${selected.common_name} is true?`,
      options: [selected.fun_fact, 'Wild animals are safest when we touch and feed them.', 'Every Malaysian animal lives in the ocean.'],
      correct_index: 0,
      explanation: selected.fun_fact,
    };
    setQuizAnswer(null);
    setQuizQuestion(fallback);
    open('quiz');
    try {
      const res = await fetch(`${API_BASE}/api/v1/species/${selected.id}/quiz`);
      if (res.ok) {
        const data = await res.json();
        const questions = typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions;
        if (questions[0]) setQuizQuestion(questions[0]);
      }
    } catch {}
  };

  const discoveryPhoto = photoUri ? { uri: photoUri } : IMAGES.marmoset;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color="#0BA84A" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.page}>
        {screen === 'home' && (
          <HomeScreen
            currentUser={currentUser}
            displayProgress={displayProgress}
            recentCaptures={recentCaptures}
            notice={notice}
            onOpenProfile={() => open('progress')}
            onOpenLocations={() => resetTo('locations')}
            onStartDiscovery={() => startDiscovery()}
            onOpenBattle={() => resetTo('battle_select')}
          />
        )}

        {screen === 'locations' && (
          <LocationsScreen
            locations={filteredLocations}
            search={locationSearch}
            setSearch={setLocationSearch}
            categoryFilter={locationCategoryFilter}
            setCategoryFilter={setLocationCategoryFilter}
            onSelectLocation={(loc) => {
              setSelectedLocation(loc);
              open('location_detail');
            }}
          />
        )}

        {screen === 'location_detail' && selectedLocation && (
          <LocationDetailScreen
            location={selectedLocation}
            onBack={goBack}
            onRecordHere={(locName) => startDiscovery(locName)}
          />
        )}

        {screen === 'photo' && (
          <CameraScreen
            cameraRef={cameraRef}
            cameraPermission={cameraPermission}
            onRequestPermission={requestCameraPermission}
            onTakePhoto={takePhoto}
            onPickFromGallery={pickFromGallery}
            onUseSamplePhoto={() => {
              setPhotoUri(null);
              open('category');
            }}
            onBack={goBack}
          />
        )}

        {screen === 'category' && (
          <CategoryScreen
            photo={discoveryPhoto}
            categories={CATEGORIES}
            onSelectCategory={(cat) => {
              setCategory(cat);
              setSpeciesSearch('');
              open('species');
            }}
            onBack={goBack}
          />
        )}

        {screen === 'species' && (
          <SpeciesScreen
            photo={discoveryPhoto}
            category={category}
            speciesList={filteredCategorySpecies}
            search={speciesSearch}
            setSearch={setSpeciesSearch}
            onChooseSpecies={(item) => {
              setSelected(item);
              open('confirm');
            }}
            onBack={goBack}
          />
        )}

        {screen === 'confirm' && (
          <ConfirmScreen
            photo={discoveryPhoto}
            selected={selected}
            discoveryLocation={discoveryLocation}
            setDiscoveryLocation={setDiscoveryLocation}
            onConfirm={recordDiscovery}
            onChangeSpecies={() => open('species')}
            onBack={goBack}
          />
        )}

        {screen === 'success' && (
          <SuccessScreen
            selected={selected}
            discoveryLocation={discoveryLocation}
            onViewCard={() => open('about')}
            onEnterBattle={() => initBattle(selected)}
            onViewCollection={() => resetTo('collection')}
            onRecordAnother={() => resetTo('category')}
            onBack={goBack}
          />
        )}

        {screen === 'collection' && (
          <CollectionScreen
            speciesList={visibleSpecies}
            discoveredIds={discovered}
            filter={filter}
            setFilter={setFilter}
            displayProgress={displayProgress}
            onSelectSpecies={(item) => {
              setSelected(item);
              open('about');
            }}
            onSelectLocked={(item) => {
              setSelected(item);
              open('locked');
            }}
          />
        )}

        {(screen === 'about' || screen === 'battle_stats' || screen === 'facts' || screen === 'gallery' || screen === 'quiz') && (
          <SpeciesDetailScreen
            species={selected}
            screen={screen}
            photos={galleryPhotos[selected.id] ?? []}
            quizQuestion={quizQuestion}
            quizAnswer={quizAnswer}
            onTabChange={(tab) => open(tab)}
            onStartBattle={() => initBattle(selected)}
            onOpenQuiz={() => void openQuiz()}
            onAnswerQuiz={setQuizAnswer}
            onFinishQuiz={() => open('facts')}
            onBack={goBack}
          />
        )}

        {screen === 'locked' && (
          <LockedScreen
            species={selected}
            onStartDiscovery={() => {
              setSelected(selected);
              startDiscovery();
            }}
            onBack={goBack}
          />
        )}

        {screen === 'battle_select' && (
          <BattleSelectScreen
            unlockedSpecies={unlockedSpeciesList}
            battleCard={battlePlayerCard}
            onSelectCard={(card) => initBattle(card)}
            onStartDiscovery={() => startDiscovery()}
          />
        )}

        {screen === 'battle_arena' && battlePlayerCard && (
          <BattleArenaScreen
            card={battlePlayerCard}
            opponentName={battleOpponentName}
            playerHp={battlePlayerHp}
            playerMaxHp={battlePlayerMaxHp}
            opponentHp={battleOpponentHp}
            opponentMaxHp={battleOpponentMaxHp}
            battleLog={battleLog}
            battleRound={battleRound}
            battleOutcome={battleOutcome}
            isAttacking={isAttacking}
            onAttack={performAttack}
            onBattleAgain={() => initBattle(battlePlayerCard)}
            onSelectAnotherCard={() => resetTo('battle_select')}
            onBack={goBack}
          />
        )}

        {screen === 'auth' && (
          <AuthScreen
            authMode={authMode}
            setAuthMode={setAuthMode}
            authError={authError}
            username={authUsername}
            setUsername={setAuthUsername}
            email={authEmail}
            setEmail={setAuthEmail}
            password={authPassword}
            setPassword={setAuthPassword}
            confirmPassword={authConfirmPassword}
            setConfirmPassword={setAuthConfirmPassword}
            age={authAge}
            setAge={setAuthAge}
            avatar={authAvatar}
            setAvatar={setAuthAvatar}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onForgotPassword={() => {
              setForgotStep(1);
              open('forgot_password');
            }}
            onBack={goBack}
          />
        )}

        {screen === 'forgot_password' && (
          <ForgotPasswordScreen
            step={forgotStep}
            email={forgotEmail}
            setEmail={setForgotEmail}
            token={forgotToken}
            setToken={setForgotToken}
            newPassword={forgotNewPassword}
            setNewPassword={setForgotNewPassword}
            onRequestCode={() => {
              setForgotToken('RESET-2026');
              setForgotStep(2);
            }}
            onResetPassword={() => {
              Alert.alert('Success', 'Password successfully updated!');
              open('auth');
            }}
            onBack={goBack}
          />
        )}

        {screen === 'profile_edit' && (
          <ProfileEditScreen
            displayName={editDisplayName}
            setDisplayName={setEditDisplayName}
            age={editAge}
            setAge={setEditAge}
            avatar={editAvatar}
            setAvatar={setEditAvatar}
            onSave={handleSaveProfile}
            onBack={goBack}
          />
        )}

        {screen === 'progress' && (
          <ProfileScreen
            currentUser={currentUser}
            displayProgress={displayProgress}
            discoveredSpeciesCount={(cat) => {
              const items = supportedSpecies.filter((item) => item.category === cat);
              const found = items.filter((item) => discovered.includes(item.id)).length;
              return { found, total: items.length };
            }}
            onOpenEdit={() => {
              setEditDisplayName(currentUser.display_name);
              setEditAvatar(currentUser.avatar);
              setEditAge(String(currentUser.age));
              open('profile_edit');
            }}
            onSwitchAccount={() => open('auth')}
          />
        )}
      </View>

      {['home', 'locations', 'collection', 'battle_select', 'progress'].includes(screen) && (
        <BottomNav screen={screen} onNavigate={(s) => resetTo(s)} onStartDiscovery={() => startDiscovery()} />
      )}
    </SafeAreaView>
  );
}
