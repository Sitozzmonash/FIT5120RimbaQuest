import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { GalleryItem, LocationItem, LocationMode, RecentCapture, Screen, Species, UserProfile } from '../types';
import { API_BASE } from '../constants/config';
import { CATEGORIES, OFFLINE_LOCATIONS, SEED_SPECIES, locationMatchesCategory, locationMatchesQuery } from '../constants/seed';
import { SPECIES_IMAGES, hasReferenceImage } from '../constants/images';
import { clearSession, loadGallery, loadSession, saveGallery, saveSession } from '../constants/session';
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GUEST_USER: UserProfile = {
  id: 0,
  username: '',
  display_name: 'Explorer',
  avatar: 'tapir',
  age: 10,
  age_band: '8-11',
  xp: 0,
  level: 1,
};
const BATTLE_OPPONENT = {
  name: 'Wild Boar',
  image: SPECIES_IMAGES.sp_wild_boar,
  hp: 110,
  attack: 20,
};

function apiMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object' && detail[0] && 'msg' in detail[0]) {
      return String((detail[0] as { msg: string }).msg);
    }
  }
  return fallback;
}

function isHttpPhotoUrl(url?: string | null): boolean {
  return Boolean(url && /^https?:\/\//i.test(url));
}

async function storedPhotoUrl(uri: string): Promise<string> {
  if (isHttpPhotoUrl(uri) || uri.startsWith('data:') || uri.startsWith('file:') || uri.startsWith('content:')) {
    return uri;
  }
  if (!uri.startsWith('blob:')) return uri;
  try {
    const blob = await fetch(uri).then((response) => response.blob());
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || uri));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return uri;
  }
}

function profileFromAuth(data: Record<string, unknown>): UserProfile {
  return {
    id: Number(data.child_id || data.id || 0),
    username: String(data.username || ''),
    display_name: String(data.display_name || data.username || 'Explorer'),
    avatar: String(data.avatar || 'tapir'),
    age: Number(data.age || 10),
    age_band: '8-11',
    xp: Number(data.xp || 0),
    level: Number(data.level || 1),
  };
}

async function readCurrentLocationLabel(): Promise<string | null> {
  const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
  if (!geo) return null;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      geo.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
    });
    return `Current location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
  } catch {
    return null;
  }
}

export default function RimbaQuest() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [history, setHistory] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [species, setSpecies] = useState<Species[]>(OFFLINE_SPECIES);
  const [selected, setSelected] = useState<Species>(OFFLINE_SPECIES[0]);
  const [category, setCategory] = useState('Mammal');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, GalleryItem[]>>({});
  const [recentCaptures, setRecentCaptures] = useState<RecentCapture[]>([]);
  const [discoveryLocation, setDiscoveryLocation] = useState('');
  const [locationMode, setLocationMode] = useState<LocationMode>('manual');
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [firstDiscovery, setFirstDiscovery] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [locations, setLocations] = useState<LocationItem[]>(OFFLINE_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationCategoryFilter, setLocationCategoryFilter] = useState('All');
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [locationDetailError, setLocationDetailError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_USER);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authAge, setAuthAge] = useState('');
  const [authAvatar, setAuthAvatar] = useState('tapir');
  const [authError, setAuthError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotFieldError, setForgotFieldError] = useState<string | null>(null);
  const [forgotFormError, setForgotFormError] = useState<string | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAvatar, setEditAvatar] = useState('tapir');
  const [editAge, setEditAge] = useState('10');

  const [battlePlayerCard, setBattlePlayerCard] = useState<Species | null>(null);
  const [battlePlayerHp, setBattlePlayerHp] = useState(120);
  const [battlePlayerMaxHp, setBattlePlayerMaxHp] = useState(120);
  const [battleOpponentHp, setBattleOpponentHp] = useState(BATTLE_OPPONENT.hp);
  const [battleOpponentMaxHp, setBattleOpponentMaxHp] = useState(BATTLE_OPPONENT.hp);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleRound, setBattleRound] = useState(1);
  const [battleOutcome, setBattleOutcome] = useState<'playing' | 'win' | 'lose' | null>(null);
  const [battleXpAwarded, setBattleXpAwarded] = useState<number | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const battleRecordedRef = useRef(false);

  const applyUser = (user: UserProfile, nextScreen: Screen = 'home') => {
    setCurrentUser(user);
    setGalleryPhotos(loadGallery(user.id));
    setIsLoggedIn(true);
    saveSession(user);
    setHistory([]);
    setScreen(nextScreen);
  };

  const loadLocations = async () => {
    setLocationsLoading(true);
    setLocationsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/locations`);
      if (!res.ok) throw new Error('Unable to load locations');
      const data = await res.json();
      if (!data.items?.length) {
        setLocations([]);
        setLocationsError("We couldn't load wildlife locations right now. Please try again.");
      } else {
        setLocations(data.items);
      }
    } catch {
      setLocationsError("We couldn't load wildlife locations right now. Please try again.");
      setLocations((current) => (current.length ? current : OFFLINE_LOCATIONS));
    } finally {
      setLocationsLoading(false);
    }
  };

  const refresh = async (childId: number) => {
    try {
      const [speciesRes, collectionRes, profileRes, recentRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/species`),
        fetch(`${API_BASE}/api/v1/children/${childId}/collection`),
        fetch(`${API_BASE}/api/v1/children/${childId}/profile`),
        fetch(`${API_BASE}/api/v1/children/${childId}/recent-captures`),
      ]);

      if (speciesRes.ok) setSpecies(await speciesRes.json());
      if (collectionRes.ok) {
        const data = await collectionRes.json();
        setDiscovered(data.items.filter((item: { discovered: number }) => item.discovered).map((item: { id: string }) => item.id));
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setCurrentUser((prev) => {
          const next = { ...prev, ...data, username: prev.username };
          saveSession(next);
          return next;
        });
      }
      if (recentRes.ok) {
        const data = await recentRes.json();
        setRecentCaptures(data.items);
      }
      await loadLocations();
      setNotice(null);
    } catch {
      setNotice('You are exploring in offline demo mode. Discoveries will sync when the backend connects.');
      setLocations((current) => (current.length ? current : OFFLINE_LOCATIONS));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = loadSession();
    if (saved?.id) {
      setCurrentUser(saved);
      setGalleryPhotos(loadGallery(saved.id));
      setIsLoggedIn(true);
      setScreen('home');
    } else {
      setScreen('auth');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser.id) {
      void refresh(currentUser.id);
    }
  }, [isLoggedIn, currentUser.id]);

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
    return selectedCategorySpecies.filter((item) => item.common_name.toLowerCase().includes(query));
  }, [selectedCategorySpecies, speciesSearch]);

  const filteredLocations = useMemo(() => {
    const query = locationSearch.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchesQuery = locationMatchesQuery(loc, query);
      return matchesQuery && locationMatchesCategory(loc, locationCategoryFilter);
    });
  }, [locations, locationSearch, locationCategoryFilter]);

  const locationsEmptyMessage = locationSearch.trim()
    ? 'No matching locations found.'
    : locationCategoryFilter !== 'All'
      ? 'No locations found for this wildlife category.'
      : null;

  const displayProgress = useMemo(
    () => ({
      found: discovered.filter((id) => supportedSpecies.some((item) => item.id === id)).length,
      total: supportedSpecies.length,
      xp: currentUser.xp,
      level: currentUser.level,
    }),
    [discovered, supportedSpecies, currentUser]
  );

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
      setScreen(prev ?? (isLoggedIn ? 'home' : 'auth'));
      return cur.slice(0, -1);
    });
  };

  const startDiscovery = (presetLocation?: string) => {
    if (presetLocation) {
      setDiscoveryLocation(presetLocation);
      setLocationMode('manual');
    }
    setPhotoUri(null);
    setPhotoError(null);
    setSaveError(null);
    setLocationNotice(null);
    resetTo('photo');
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setPhotoError(null);
    setScreen('photo');
  };

  const acceptPhoto = (uri: string) => {
    setPhotoUri(uri);
    setPhotoError(null);
    open('category');
  };

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) acceptPhoto(photo.uri);
    } catch {
      setPhotoError("Your photo couldn't be uploaded. Please try again.");
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) acceptPhoto(result.assets[0].uri);
    } catch {
      setPhotoError("Your photo couldn't be uploaded. Please try again.");
    }
  };

  const recordDiscoveryWithLocation = async (locationLabel: string) => {
    if (saving) return;
    if (!photoUri) return;
    if (!locationLabel) {
      setSaveError('Please choose or enter a discovery location.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const storedPhoto = await storedPhotoUrl(photoUri);
      const response = await fetch(`${API_BASE}/api/v1/children/${currentUser.id}/discoveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species_id: selected.id,
          location_label: locationLabel,
          ...(isHttpPhotoUrl(storedPhoto) ? { photo_url: storedPhoto } : {}),
        }),
      });
      if (!response.ok) throw new Error('Unable to save');
      const result = (await response.json()) as { first_discovery?: boolean; total_xp?: number };
      setFirstDiscovery(Boolean(result.first_discovery));
      if (result.first_discovery && !discovered.includes(selected.id)) {
        setDiscovered((current) => [...current, selected.id]);
        setCurrentUser((prev) => ({ ...prev, xp: result.total_xp ?? prev.xp }));
      }
      setGalleryPhotos((current) => {
        const next = {
          ...current,
          [selected.id]: [{ photo_url: storedPhoto, location_label: locationLabel }, ...(current[selected.id] ?? [])],
        };
        saveGallery(currentUser.id, next);
        return next;
      });
      await refresh(currentUser.id);
      open('success');
    } catch {
      setSaveError("Your discovery wasn't saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const recordDiscovery = async () => {
    if (saving) return;
    if (locationMode === 'auto') {
      const label = await readCurrentLocationLabel();
      if (!label) {
        setLocationNotice('Your current location cannot be accessed. You can enter or select the location manually.');
        setLocationMode('manual');
        return;
      }
      setDiscoveryLocation(label);
      await recordDiscoveryWithLocation(label);
      return;
    }
    await recordDiscoveryWithLocation(discoveryLocation.trim());
  };

  const handleRegister = async () => {
    if (authSubmitting) return;
    setAuthError(null);
    const errors: Record<string, string> = {};
    const username = authUsername.trim();
    if (!username) errors.username = 'Please enter a username.';
    else if (username.length < 3 || username.length > 20) errors.username = 'Username must be between 3 and 20 characters.';
    if (!authAge.trim()) errors.age = 'Please enter your age.';
    if (!authEmail.trim()) errors.email = 'Please enter an email address.';
    else if (!EMAIL_RE.test(authEmail.trim())) errors.email = 'Please enter a valid email address.';
    if (!authPassword) errors.password = 'Please create a password.';
    if (!authConfirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (authPassword !== authConfirmPassword) errors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setAuthSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          age: parseInt(authAge, 10) || 10,
          email: authEmail.trim(),
          password: authPassword,
          avatar: authAvatar,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = apiMessage(data, 'Registration was unsuccessful. Please try again.');
        if (/already taken/i.test(message)) setFieldErrors({ username: 'That username is already taken. Try another one.' });
        else setAuthError(message);
        return;
      }
      applyUser(profileFromAuth(data));
    } catch {
      setAuthError('Registration was unsuccessful. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (authSubmitting) return;
    setAuthError(null);
    const errors: Record<string, string> = {};
    if (!authUsername.trim()) errors.username = 'Please enter your username or email.';
    if (!authPassword) errors.password = 'Please enter your password.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setAuthSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: authUsername.trim(), password: authPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status >= 500) setAuthError("We couldn't reach RimbaQuest right now. Please try again.");
        else setAuthError(apiMessage(data, 'Invalid username or password. Please try again.'));
        return;
      }
      applyUser(profileFromAuth(data));
    } catch {
      setAuthError("We couldn't reach RimbaQuest right now. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForgotRequest = async () => {
    if (forgotSubmitting) return;
    setForgotFormError(null);
    if (!forgotEmail.trim()) {
      setForgotFieldError('Please enter an email.');
      return;
    }
    if (!EMAIL_RE.test(forgotEmail.trim())) {
      setForgotFieldError('Please enter a valid email address.');
      return;
    }
    setForgotFieldError(null);
    setForgotSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForgotFieldError(apiMessage(data, 'No RimbaQuest account was found for this email.'));
        return;
      }
      setForgotToken(String(data.simulated_token || ''));
      setForgotStep(2);
    } catch {
      setForgotFormError("We couldn't reach RimbaQuest right now. Please try again.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (forgotSubmitting) return;
    if (!forgotToken.trim()) {
      setForgotFieldError('Please enter your recovery code.');
      return;
    }
    if (!forgotNewPassword) {
      setForgotFormError('Please create a password.');
      return;
    }
    setForgotSubmitting(true);
    setForgotFormError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          recovery_token: forgotToken.trim(),
          new_password: forgotNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = apiMessage(data, 'Invalid or expired recovery code.');
        if (/expired/i.test(message)) {
          setForgotFormError(message);
          setForgotFieldError(message);
        } else {
          setForgotFieldError(message);
        }
        return;
      }
      Alert.alert('Success', 'Password successfully updated!');
      setForgotStep(1);
      setForgotToken('');
      setForgotNewPassword('');
      setScreen('auth');
    } catch {
      setForgotFormError("We couldn't reach RimbaQuest right now. Please try again.");
    } finally {
      setForgotSubmitting(false);
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
        setCurrentUser((prev) => {
          const next = { ...prev, ...data };
          saveSession(next);
          return next;
        });
      }
    } catch {
      setCurrentUser((prev) => {
        const next = {
          ...prev,
          display_name: editDisplayName.trim() || prev.display_name,
          avatar: editAvatar,
          age: parseInt(editAge, 10) || prev.age,
        };
        saveSession(next);
        return next;
      });
    }
    goBack();
  };

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setCurrentUser(GUEST_USER);
    setDiscovered([]);
    setRecentCaptures([]);
    setGalleryPhotos({});
    setNotice(null);
    setAuthPassword('');
    setAuthConfirmPassword('');
    setFieldErrors({});
    setAuthError(null);
    resetTo('auth');
  };

  const loadLocationDetail = async (loc: LocationItem) => {
    setSelectedLocation(loc);
    setLocationDetailError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/locations/${loc.id}`);
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      setSelectedLocation({
        ...loc,
        ...data,
        facilities: Array.isArray(data.facilities) ? data.facilities : loc.facilities,
      });
    } catch {
      if (!loc.description) {
        setLocationDetailError("We couldn't load this location. Please try again.");
      }
    }
  };

  const loadSpeciesGallery = async (speciesId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/children/${currentUser.id}/species/${speciesId}/gallery`);
      if (!res.ok) return;
      const data = await res.json();
      const remote = ((data.items || []) as GalleryItem[]).filter((item) => isHttpPhotoUrl(item.photo_url));
      if (!remote.length) return;
      setGalleryPhotos((current) => {
        const local = current[speciesId] ?? [];
        const seen = new Set(local.map((item) => `${item.photo_url}|${item.location_label}`));
        const merged = [...local];
        for (const item of remote) {
          const key = `${item.photo_url}|${item.location_label}`;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(item);
        }
        const next = { ...current, [speciesId]: merged };
        saveGallery(currentUser.id, next);
        return next;
      });
    } catch {
      // keep local gallery
    }
  };

  const initBattle = (card: Species) => {
    battleRecordedRef.current = false;
    setBattleXpAwarded(null);
    setBattlePlayerCard(card);
    const hp = card.hp || 120;
    setBattlePlayerHp(hp);
    setBattlePlayerMaxHp(hp);
    setBattleOpponentHp(BATTLE_OPPONENT.hp);
    setBattleOpponentMaxHp(BATTLE_OPPONENT.hp);
    setBattleLog([
      `A wild ${BATTLE_OPPONENT.name} appeared!`,
      `You sent out ${card.common_name}.`,
    ]);
    setBattleRound(1);
    setBattleOutcome('playing');
    open('battle_arena');
  };

  const recordBattleResult = async (won: boolean, rounds: number) => {
    if (battleRecordedRef.current || !currentUser.id) return;
    battleRecordedRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/api/v1/children/${currentUser.id}/battle/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          won,
          opponent_name: BATTLE_OPPONENT.name,
          rounds,
        }),
      });
      if (!res.ok) {
        battleRecordedRef.current = false;
        return;
      }
      const data = (await res.json()) as { xp_awarded?: number; total_xp?: number };
      if (typeof data.xp_awarded === 'number') setBattleXpAwarded(data.xp_awarded);
      if (typeof data.total_xp === 'number') {
        setCurrentUser((prev) => {
          const next = { ...prev, xp: data.total_xp as number };
          saveSession(next);
          return next;
        });
      }
    } catch {
      battleRecordedRef.current = false;
    }
  };

  const performAttack = () => {
    if (!battlePlayerCard || isAttacking || battleOutcome !== 'playing') return;
    setIsAttacking(true);
    const playerDmg = battlePlayerCard.base_attack || 25;
    const nextOpponentHp = Math.max(0, battleOpponentHp - playerDmg);
    const newLogs = [...battleLog, `${battlePlayerCard.common_name} used Basic Attack for ${playerDmg} damage.`];
    if (nextOpponentHp <= 0) {
      setBattleOpponentHp(0);
      newLogs.push(`${BATTLE_OPPONENT.name} fainted. You won!`);
      setBattleLog(newLogs);
      setBattleOutcome('win');
      setIsAttacking(false);
      void recordBattleResult(true, battleRound);
      return;
    }
    setBattleOpponentHp(nextOpponentHp);
    setTimeout(() => {
      const nextPlayerHp = Math.max(0, battlePlayerHp - BATTLE_OPPONENT.attack);
      newLogs.push(`${BATTLE_OPPONENT.name} attacked for ${BATTLE_OPPONENT.attack} damage.`);
      if (nextPlayerHp <= 0) {
        setBattlePlayerHp(0);
        newLogs.push(`${battlePlayerCard.common_name} is too tired to continue.`);
        setBattleOutcome('lose');
        void recordBattleResult(false, battleRound);
      } else {
        setBattlePlayerHp(nextPlayerHp);
      }
      setBattleLog(newLogs);
      setBattleRound((r) => r + 1);
      setIsAttacking(false);
    }, 500);
  };

  const discoveryPhoto = photoUri ? { uri: photoUri } : null;
  const profileDirty =
    editDisplayName !== currentUser.display_name ||
    editAvatar !== currentUser.avatar ||
    editAge !== String(currentUser.age);

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
        {screen === 'home' && isLoggedIn && (
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
            loading={locationsLoading}
            error={locationsError}
            emptyMessage={locationsEmptyMessage}
            onRetry={() => void loadLocations()}
            onSelectLocation={(loc) => {
              open('location_detail');
              void loadLocationDetail(loc);
            }}
          />
        )}

        {screen === 'location_detail' && selectedLocation && (
          <LocationDetailScreen
            location={selectedLocation}
            error={locationDetailError}
            onRetry={() => void loadLocationDetail(selectedLocation)}
            onBack={goBack}
            onRecordHere={(locName) => startDiscovery(locName)}
          />
        )}

        {screen === 'photo' && (
          <CameraScreen
            cameraRef={cameraRef}
            cameraPermission={cameraPermission}
            photoError={photoError}
            onRequestPermission={requestCameraPermission}
            onTakePhoto={() => void takePhoto()}
            onPickFromGallery={() => void pickFromGallery()}
            onBack={goBack}
          />
        )}

        {screen === 'category' && discoveryPhoto && (
          <CategoryScreen
            photo={discoveryPhoto}
            categories={CATEGORIES}
            onSelectCategory={(cat) => {
              setCategory(cat);
              setSpeciesSearch('');
              open('species');
            }}
            onRetake={retakePhoto}
            onBack={goBack}
          />
        )}

        {screen === 'species' && discoveryPhoto && (
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

        {screen === 'confirm' && discoveryPhoto && (
          <ConfirmScreen
            photo={discoveryPhoto}
            selected={selected}
            discoveryLocation={discoveryLocation}
            setDiscoveryLocation={setDiscoveryLocation}
            locationMode={locationMode}
            setLocationMode={(mode) => {
              setLocationMode(mode);
              setLocationNotice(null);
            }}
            locationOptions={locations}
            locationNotice={locationNotice}
            saveError={saveError}
            saving={saving}
            onConfirm={() => void recordDiscovery()}
            onChangeSpecies={() => open('species')}
            onRetake={retakePhoto}
            onBack={goBack}
          />
        )}

        {screen === 'success' && (
          <SuccessScreen
            selected={selected}
            discoveryLocation={discoveryLocation}
            firstDiscovery={firstDiscovery}
            onViewCard={() => open('about')}
            onEnterBattle={() => initBattle(selected)}
            onViewCollection={() => resetTo('collection')}
            onRecordAnother={() => startDiscovery()}
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
              void loadSpeciesGallery(item.id);
              open('about');
            }}
            onSelectLocked={(item) => {
              setSelected(item);
              open('locked');
            }}
          />
        )}

        {(screen === 'about' || screen === 'battle_stats' || screen === 'facts' || screen === 'gallery') && (
          <SpeciesDetailScreen
            species={selected}
            screen={screen}
            photos={galleryPhotos[selected.id] ?? []}
            onTabChange={(tab) => open(tab)}
            onStartBattle={() => initBattle(selected)}
            onBack={goBack}
          />
        )}

        {screen === 'locked' && (
          <LockedScreen
            species={selected}
            onStartDiscovery={() => startDiscovery()}
            onBack={goBack}
          />
        )}

        {screen === 'battle_select' && (
          <BattleSelectScreen
            unlockedSpecies={unlockedSpeciesList}
            selectedCard={battlePlayerCard}
            onSelectCard={setBattlePlayerCard}
            onStartBattle={() => battlePlayerCard && initBattle(battlePlayerCard)}
            onStartDiscovery={() => startDiscovery()}
          />
        )}

        {screen === 'battle_arena' && battlePlayerCard && (
          <BattleArenaScreen
            card={battlePlayerCard}
            opponentName={BATTLE_OPPONENT.name}
            opponentImage={BATTLE_OPPONENT.image}
            playerHp={battlePlayerHp}
            playerMaxHp={battlePlayerMaxHp}
            opponentHp={battleOpponentHp}
            opponentMaxHp={battleOpponentMaxHp}
            battleLog={battleLog}
            battleRound={battleRound}
            battleOutcome={battleOutcome}
            xpAwarded={battleXpAwarded}
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
            setAuthMode={(mode) => {
              setAuthMode(mode);
              setAuthError(null);
              setFieldErrors({});
            }}
            authError={authError}
            fieldErrors={fieldErrors}
            submitting={authSubmitting}
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
            onLogin={() => void handleLogin()}
            onRegister={() => void handleRegister()}
            onForgotPassword={() => {
              setForgotStep(1);
              setForgotFieldError(null);
              setForgotFormError(null);
              open('forgot_password');
            }}
            onBlurUsername={() => {
              const name = authUsername.trim();
              if (!name) return;
              if (name.length < 3 || name.length > 20) {
                setFieldErrors((cur) => ({ ...cur, username: 'Username must be between 3 and 20 characters.' }));
              } else {
                setFieldErrors((cur) => {
                  const next = { ...cur };
                  delete next.username;
                  return next;
                });
              }
            }}
            onBlurEmail={() => {
              const email = authEmail.trim();
              if (!email) return;
              if (!EMAIL_RE.test(email)) {
                setFieldErrors((cur) => ({ ...cur, email: 'Please enter a valid email address.' }));
              } else {
                setFieldErrors((cur) => {
                  const next = { ...cur };
                  delete next.email;
                  return next;
                });
              }
            }}
            showBack={isLoggedIn}
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
            fieldError={forgotFieldError}
            formError={forgotFormError}
            submitting={forgotSubmitting}
            onRequestCode={() => void handleForgotRequest()}
            onResetPassword={() => void handleResetPassword()}
            onRequestNewCode={() => {
              setForgotStep(1);
              setForgotFieldError(null);
              setForgotFormError(null);
              setForgotToken('');
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
            onSave={() => void handleSaveProfile()}
            onBack={goBack}
            isDirty={profileDirty}
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
            onLogout={handleLogout}
          />
        )}
      </View>

      {isLoggedIn && ['home', 'locations', 'collection', 'battle_select', 'progress'].includes(screen) && (
        <BottomNav screen={screen} onNavigate={(s) => resetTo(s)} onStartDiscovery={() => startDiscovery()} />
      )}
    </SafeAreaView>
  );
}
