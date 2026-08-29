import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { GalleryItem, LocationItem, LocationMode, RecentCapture, Screen, Species, UserProfile } from '../types';
import { API_BASE } from '../constants/config';
import { CATEGORIES, OFFLINE_LOCATIONS, SEED_SPECIES, locationMatchesCategory, locationMatchesQuery } from '../constants/seed';
import { SPECIES_IMAGES, hasReferenceImage } from '../constants/images';
import { clearSession, loadSession, saveSession } from '../constants/session';
import { levelForFound } from '../constants/progression';
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
import { CollectionScreen, LockedScreen, SpeciesDetailScreen } from '../components/screens/collection';
import { BattleArenaScreen, BattleSelectScreen } from '../components/screens/battle';
import { AccountEntryScreen } from '../components/screens/AccountEntryScreen';
import { LoginScreen } from '../components/screens/LoginScreen';
import { AccountCreationScreen } from '../components/screens/account-creation';
import { ForgotPasswordScreen } from '../components/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../components/screens/ResetPasswordScreen';
import { ProfileEditScreen, ProfileScreen } from '../components/screens/profile';
import { DEFAULT_AVATAR } from '../constants/images';

const OFFLINE_SPECIES = Array.from(new Map(SEED_SPECIES.map((item) => [item.id, item])).values());

const GRADIENT_SCREENS: Screen[] = ['account_entry', 'login', 'create_account', 'forgot_password', 'reset_password', 'collection', 'locations', 'location_detail', 'progress', 'profile_edit'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_EXPIRED_ERROR = 'RIMBAQUEST_SESSION_EXPIRED';
const GUEST_USER: UserProfile = {
  id: 0,
  username: '',
  email: '',
  display_name: 'Explorer',
  avatar: DEFAULT_AVATAR,
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

function profileFromAuth(data: Record<string, unknown>): UserProfile {
  return {
    id: Number(data.child_id || data.id || 0),
    username: String(data.username || ''),
    email: String(data.email || ''),
    display_name: String(data.display_name || data.username || 'Explorer'),
    avatar: String(data.avatar || DEFAULT_AVATAR),
    age: Number(data.age || 10),
    age_band: '8-11',
    xp: Number(data.xp || 0),
    level: Number(data.level || 1),
  };
}

async function readCurrentLocationLabel(): Promise<string | null> {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) return null;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ]);

    const { latitude, longitude } = position.coords;
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const label = [place?.city || place?.subregion, place?.region || place?.country]
        .filter(Boolean)
        .join(', ');
      if (label) return label;
    } catch {
      // Reverse geocoding can fail independently of the GPS fix (e.g. offline);
      // fall back to coordinates rather than failing the whole lookup.
    }

    return `Current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  } catch {
    return null;
  }
}

export default function RimbaQuest() {
  const [screen, setScreen] = useState<Screen>('account_entry');
  const [history, setHistory] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  const [species, setSpecies] = useState<Species[]>(OFFLINE_SPECIES);
  const [selected, setSelected] = useState<Species>(OFFLINE_SPECIES[0]);
  const [chosenSpeciesId, setChosenSpeciesId] = useState<string | null>(null);
  const [category, setCategory] = useState('Mammal');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, GalleryItem[]>>({});
  const [recentCaptures, setRecentCaptures] = useState<RecentCapture[]>([]);
  const [discoveryLocation, setDiscoveryLocation] = useState('');
  const [locationMode, setLocationMode] = useState<LocationMode>('manual');
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [firstDiscovery, setFirstDiscovery] = useState(true);
  const [discoveryXpAwarded, setDiscoveryXpAwarded] = useState(0);
  const [discoveryRecordedAt, setDiscoveryRecordedAt] = useState<string | null>(null);
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
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authAge, setAuthAge] = useState('10');
  const [authAvatar, setAuthAvatar] = useState('hornbill');
  const [authError, setAuthError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotFieldError, setForgotFieldError] = useState<string | null>(null);
  const [forgotFormError, setForgotFormError] = useState<string | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAvatar, setEditAvatar] = useState(DEFAULT_AVATAR);
  const [editAge, setEditAge] = useState('10');
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

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

  const resetAuthForm = () => {
    setAuthUsername('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    setAuthAge('10');
    setAuthAvatar('hornbill');
    setFieldErrors({});
    setAuthError(null);
  };

  const applyUser = (user: UserProfile, token: string, nextScreen: Screen = 'home') => {
    setCurrentUser(user);
    setAccessToken(token);
    setGalleryPhotos({});
    setIsLoggedIn(true);
    void saveSession({ user, accessToken: token });
    resetAuthForm();
    setHistory([]);
    setScreen(nextScreen);
  };

  const authenticatedHeaders = (token = accessToken): Record<string, string> =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const expireSession = async () => {
    await clearSession();
    setAccessToken('');
    setIsLoggedIn(false);
    setCurrentUser(GUEST_USER);
    setDiscovered([]);
    setRecentCaptures([]);
    setGalleryPhotos({});
    resetAuthForm();
    setAuthError('Your session is no longer valid. Please sign in again.');
    setHistory([]);
    setScreen('login');
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

  const refresh = async (childId: number, token = accessToken) => {
    try {
      const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [speciesRes, collectionRes, profileRes, recentRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/species`),
        fetch(`${API_BASE}/api/v1/children/${childId}/collection`, { headers: auth }),
        fetch(`${API_BASE}/api/v1/children/${childId}/profile`, { headers: auth }),
        fetch(`${API_BASE}/api/v1/children/${childId}/recent-captures`, { headers: auth }),
      ]);

      if (profileRes.status === 401 || profileRes.status === 403) {
        await expireSession();
        setLoading(false);
        return;
      }

      if (speciesRes.ok) setSpecies(await speciesRes.json());
      if (collectionRes.ok) {
        const data = await collectionRes.json();
        setDiscovered(data.items.filter((item: { discovered: number }) => item.discovered).map((item: { id: string }) => item.id));
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setCurrentUser((prev) => {
          const next = { ...prev, ...data, username: String(data.username || prev.username) };
          void saveSession({ user: next, accessToken: token });
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
    void (async () => {
      const saved = await loadSession();
      if (saved?.user?.id && saved.accessToken) {
        setCurrentUser(saved.user);
        setAccessToken(saved.accessToken);
        setGalleryPhotos({});
        setIsLoggedIn(true);
        setScreen('home');
      } else {
        setScreen('account_entry');
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser.id && accessToken) {
      void refresh(currentUser.id, accessToken);
    }
  }, [isLoggedIn, currentUser.id, accessToken]);

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

  const displayProgress = useMemo(() => {
    const found = discovered.filter((id) => supportedSpecies.some((item) => item.id === id)).length;
    return {
      found,
      total: supportedSpecies.length,
      xp: currentUser.xp,
      level: levelForFound(found),
    };
  }, [discovered, supportedSpecies, currentUser]);

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
      setScreen(prev ?? (isLoggedIn ? 'home' : 'account_entry'));
      return cur.slice(0, -1);
    });
  };

  const resetDiscoverySelections = () => {
    setCategory('Mammal');
    setSpeciesSearch('');
    setSelected(OFFLINE_SPECIES[0]);
    setChosenSpeciesId(null);
    setDiscoveryLocation('');
    setLocationMode('manual');
  };

  const startDiscovery = (presetLocation?: string) => {
    resetDiscoverySelections();
    if (presetLocation) {
      setDiscoveryLocation(presetLocation);
      setLocationMode('manual');
    }
    setPhotoUri(null);
    setPhotoMimeType('image/jpeg');
    setPhotoError(null);
    setSaveError(null);
    setLocationNotice(null);
    resetTo('photo');
  };

  const acceptPhoto = (uri: string, mimeType = 'image/jpeg') => {
    setPhotoUri(uri);
    setPhotoMimeType(mimeType);
    setPhotoError(null);
    open('photo_preview');
  };

  // Confirmed from the discard-photo dialog: abandon the in-progress
  // discovery entirely and land back on Home, rather than stepping back
  // one screen at a time.
  const discardDiscovery = () => {
    setPhotoUri(null);
    setPhotoError(null);
    setSaveError(null);
    setLocationNotice(null);
    resetDiscoverySelections();
    resetTo('home');
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setPhotoError(null);
    setScreen('photo');
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
      if (!result.canceled && result.assets[0]?.uri) {
        acceptPhoto(result.assets[0].uri, result.assets[0].mimeType || 'image/jpeg');
      }
    } catch {
      setPhotoError("Your photo couldn't be uploaded. Please try again.");
    }
  };

  const uploadDiscoveryPhoto = async (uri: string): Promise<{ photo_path: string; photo_url?: string | null }> => {
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await fetch(uri).then((response) => response.blob());
      form.append('photo', blob, `discovery.${photoMimeType === 'image/png' ? 'png' : photoMimeType === 'image/webp' ? 'webp' : 'jpg'}`);
    } else {
      form.append('photo', {
        uri,
        name: `discovery.${photoMimeType === 'image/png' ? 'png' : photoMimeType === 'image/webp' ? 'webp' : 'jpg'}`,
        type: photoMimeType,
      } as unknown as Blob);
    }
    const response = await fetch(`${API_BASE}/api/v1/children/${currentUser.id}/photos`, {
      method: 'POST',
      headers: authenticatedHeaders(),
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      await expireSession();
      throw new Error(SESSION_EXPIRED_ERROR);
    }
    if (!response.ok) throw new Error(apiMessage(data, "Your photo couldn't be uploaded. Please try again."));
    return data as { photo_path: string; photo_url?: string | null };
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
      const storedPhoto = await uploadDiscoveryPhoto(photoUri);
      const response = await fetch(`${API_BASE}/api/v1/children/${currentUser.id}/discoveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authenticatedHeaders() },
        body: JSON.stringify({
          species_id: selected.id,
          location_label: locationLabel,
          photo_path: storedPhoto.photo_path,
        }),
      });
      const responseData = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await expireSession();
        throw new Error(SESSION_EXPIRED_ERROR);
      }
      if (!response.ok) throw new Error(apiMessage(responseData, 'Unable to save'));
      const result = responseData as {
        first_discovery?: boolean;
        total_xp?: number;
        xp_awarded?: number;
        recorded_at?: string;
        photo_url?: string | null;
      };
      setFirstDiscovery(Boolean(result.first_discovery));
      setDiscoveryXpAwarded(Number(result.xp_awarded ?? 0));
      setDiscoveryRecordedAt(result.recorded_at ?? new Date().toISOString());
      if (result.first_discovery && !discovered.includes(selected.id)) {
        setDiscovered((current) => [...current, selected.id]);
        setCurrentUser((prev) => ({ ...prev, xp: result.total_xp ?? prev.xp }));
      }
      setGalleryPhotos((current) => ({
        ...current,
        [selected.id]: [
          { photo_url: result.photo_url || storedPhoto.photo_url || photoUri, location_label: locationLabel },
          ...(current[selected.id] ?? []),
        ],
      }));
      await refresh(currentUser.id, accessToken);
      open('success');
    } catch (error) {
      if (error instanceof Error && error.message === SESSION_EXPIRED_ERROR) return;
      setSaveError(error instanceof Error ? error.message : "Your discovery wasn't saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const useAutomaticLocation = async () => {
    setLocationMode('auto');
    setLocationNotice(null);
    setResolvingLocation(true);
    try {
      const label = await readCurrentLocationLabel();
      if (!label) {
        setLocationNotice('Your current location cannot be accessed. You can enter or select the location manually.');
        setLocationMode('manual');
        return;
      }
      setDiscoveryLocation(label);
    } finally {
      setResolvingLocation(false);
    }
  };

  const recordDiscovery = async () => {
    if (saving) return;
    if (locationMode === 'auto') {
      const label = discoveryLocation.trim() || (await readCurrentLocationLabel());
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
      const token = String(data.access_token || '');
      if (!token) throw new Error('Registration did not return an access token.');
      applyUser(profileFromAuth(data), token);
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
      const token = String(data.access_token || '');
      if (!token) throw new Error('Login did not return an access token.');
      applyUser(profileFromAuth(data), token);
    } catch {
      setAuthError("We couldn't reach RimbaQuest right now. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const validateUsernameBlur = () => {
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
  };

  const validateEmailBlur = () => {
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
  };

  // Gates step 1 -> 2 of the Create Account wizard: unlike the blur handlers
  // above, this checks both fields synchronously (e.g. a field the user never
  // focused) and reports whether it's safe to advance.
  const validateStep1 = (): boolean => {
    const name = authUsername.trim();
    const email = authEmail.trim();
    const errors: { username?: string; email?: string; password?: string; confirmPassword?: string } = {};
    if (!name) errors.username = 'Please enter a username.';
    else if (name.length < 3 || name.length > 20) errors.username = 'Username must be between 3 and 20 characters.';
    if (!email) errors.email = 'Please enter an email address.';
    else if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
    if (!authPassword) errors.password = 'Please create a password.';
    if (!authConfirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (authPassword !== authConfirmPassword) errors.confirmPassword = 'Passwords do not match.';

    setFieldErrors((cur) => {
      const next = { ...cur };
      if (errors.username) next.username = errors.username;
      else delete next.username;
      if (errors.email) next.email = errors.email;
      else delete next.email;
      if (errors.password) next.password = errors.password;
      else delete next.password;
      if (errors.confirmPassword) next.confirmPassword = errors.confirmPassword;
      else delete next.confirmPassword;
      return next;
    });
    return !errors.username && !errors.email && !errors.password && !errors.confirmPassword;
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
      open('reset_password');
    } catch {
      setForgotFormError("We couldn't reach RimbaQuest right now. Please try again.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (forgotSubmitting) return;
    setForgotFieldError(null);
    if (!forgotNewPassword) {
      setForgotFormError('Please create a password.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotFieldError('Passwords do not match.');
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
        setForgotFormError(/expired/i.test(message) ? `${message} Please request a new code.` : message);
        return;
      }
      Alert.alert('Success', 'Password successfully updated!');
      setForgotToken('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      resetTo('login');
    } catch {
      setForgotFormError("We couldn't reach RimbaQuest right now. Please try again.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    const username = editDisplayName.trim() || currentUser.username;
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      setProfileSaveError('Username must be 3–20 letters, numbers, hyphens, or underscores, with no spaces.');
      return;
    }
    setProfileSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/children/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authenticatedHeaders() },
        body: JSON.stringify({
          username,
          avatar: editAvatar,
          age: parseInt(editAge, 10) || currentUser.age,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileSaveError(apiMessage(data, 'We could not save your profile changes.'));
        return;
      }
      setCurrentUser((prev) => {
        const updatedUsername = String(data.username || username || prev.username);
        const next = { ...prev, ...data, username: updatedUsername, display_name: String(data.display_name || updatedUsername) };
        void saveSession({ user: next, accessToken });
        return next;
      });
    } catch {
      setProfileSaveError("We couldn't reach RimbaQuest. Your profile was not changed.");
      return;
    }
    goBack();
  };

  const handleLogout = () => {
    void clearSession();
    setAccessToken('');
    setIsLoggedIn(false);
    setCurrentUser(GUEST_USER);
    setDiscovered([]);
    setRecentCaptures([]);
    setGalleryPhotos({});
    setNotice(null);
    resetAuthForm();
    resetTo('account_entry');
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
      const res = await fetch(`${API_BASE}/api/v1/children/${currentUser.id}/species/${speciesId}/gallery`, {
        headers: authenticatedHeaders(),
      });
      if (res.status === 401 || res.status === 403) {
        await expireSession();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      const remote = ((data.items || []) as GalleryItem[]).filter((item) => isHttpPhotoUrl(item.photo_url));
      setGalleryPhotos((current) => ({ ...current, [speciesId]: remote }));
    } catch {
      // Keep the current in-memory gallery if the remote request is temporarily unavailable.
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
        headers: { 'Content-Type': 'application/json', ...authenticatedHeaders() },
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
          void saveSession({ user: next, accessToken });
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
    editDisplayName !== currentUser.username ||
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

  const fullBleed = (screen === 'home' && isLoggedIn) || GRADIENT_SCREENS.includes(screen);

  return (
    <SafeAreaView
      style={[styles.safe, fullBleed && styles.safeTransparent]}
      edges={fullBleed ? [] : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.page, fullBleed && styles.pageTransparent]}>
        {screen === 'home' && isLoggedIn && (
          <HomeScreen
            currentUser={currentUser}
            displayProgress={displayProgress}
            recentCaptures={recentCaptures}
            notice={notice}
            onOpenProfile={() => open('progress')}
            onOpenCollection={() => open('collection')}
            onOpenLocations={() => open('locations')}
            onStartDiscovery={() => startDiscovery()}
            onOpenBattle={() => open('battle_select')}
          />
        )}

        {screen === 'locations' && (
          <LocationsScreen
            locations={filteredLocations}
            hasLocations={locations.length > 0}
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
            onBack={goBack}
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
            lastCaptureUri={recentCaptures[0]?.photo_url ?? null}
            onRequestPermission={requestCameraPermission}
            onTakePhoto={() => void takePhoto()}
            onPickFromGallery={() => void pickFromGallery()}
            onBack={goBack}
          />
        )}

        {screen === 'photo_preview' && discoveryPhoto && (
          <PhotoPreviewScreen photo={discoveryPhoto} onRetake={retakePhoto} onUpload={() => open('category')} />
        )}

        {screen === 'category' && discoveryPhoto && (
          <CategoryScreen
            photo={discoveryPhoto}
            categories={CATEGORIES}
            category={category}
            onSelectCategory={(cat) => {
              setCategory(cat);
              setSpeciesSearch('');
              open('species');
            }}
            onBack={goBack}
            onDiscard={discardDiscovery}
          />
        )}

        {screen === 'species' && discoveryPhoto && (
          <SpeciesScreen
            photo={discoveryPhoto}
            category={category}
            speciesList={filteredCategorySpecies}
            search={speciesSearch}
            setSearch={setSpeciesSearch}
            selectedId={chosenSpeciesId}
            onChooseSpecies={(item) => {
              setSelected(item);
              setChosenSpeciesId(item.id);
              open('confirm');
            }}
            onBack={goBack}
            onDiscard={discardDiscovery}
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
              if (mode === 'auto') {
                void useAutomaticLocation();
                return;
              }
              setLocationMode(mode);
              setLocationNotice(null);
            }}
            resolvingLocation={resolvingLocation}
            locationOptions={locations}
            locationNotice={locationNotice}
            saveError={saveError}
            saving={saving}
            onConfirm={() => void recordDiscovery()}
            onBack={goBack}
            onDiscard={discardDiscovery}
          />
        )}

        {screen === 'success' && (
          <SuccessScreen
            selected={selected}
            discoveryLocation={discoveryLocation}
            firstDiscovery={firstDiscovery}
            xpAwarded={discoveryXpAwarded}
            recordedAt={discoveryRecordedAt}
            onViewCard={() => open('about')}
            onRecordAnother={() => startDiscovery()}
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
            onStartDiscovery={() => {
              resetDiscoverySelections();
              setPhotoUri(null);
              setPhotoError(null);
              setSaveError(null);
              setLocationNotice(null);
              open('photo');
            }}
            onBack={goBack}
          />
        )}

        {(screen === 'about' || screen === 'battle_stats' || screen === 'facts' || screen === 'gallery') && (
          <SpeciesDetailScreen
            species={selected}
            screen={screen}
            photos={galleryPhotos[selected.id] ?? []}
            onTabChange={(tab) => open(tab)}
            onStartBattle={() => initBattle(selected)}
            onBack={() => resetTo('collection')}
          />
        )}

        {screen === 'locked' && (
          <LockedScreen
            species={selected}
            onBack={() => resetTo('collection')}
          />
        )}

        {screen === 'battle_select' && (
          <BattleSelectScreen
            unlockedSpecies={unlockedSpeciesList}
            selectedCard={battlePlayerCard}
            onSelectCard={setBattlePlayerCard}
            onStartBattle={() => battlePlayerCard && initBattle(battlePlayerCard)}
            onStartDiscovery={() => startDiscovery()}
            onBack={goBack}
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

        {screen === 'account_entry' && (
          <AccountEntryScreen
            onLogin={() => {
              resetAuthForm();
              open('login');
            }}
            onCreateAccount={() => {
              resetAuthForm();
              open('create_account');
            }}
          />
        )}

        {screen === 'login' && (
          <LoginScreen
            username={authUsername}
            setUsername={setAuthUsername}
            password={authPassword}
            setPassword={setAuthPassword}
            fieldErrors={fieldErrors}
            authError={authError}
            submitting={authSubmitting}
            onLogin={() => void handleLogin()}
            onForgotPassword={() => {
              setForgotFieldError(null);
              setForgotFormError(null);
              open('forgot_password');
            }}
            onCreateAccount={() => {
              resetAuthForm();
              open('create_account');
            }}
          />
        )}

        {screen === 'create_account' && (
          <AccountCreationScreen
            username={authUsername}
            setUsername={setAuthUsername}
            age={authAge}
            setAge={setAuthAge}
            email={authEmail}
            setEmail={setAuthEmail}
            password={authPassword}
            setPassword={setAuthPassword}
            confirmPassword={authConfirmPassword}
            setConfirmPassword={setAuthConfirmPassword}
            avatar={authAvatar}
            setAvatar={setAuthAvatar}
            fieldErrors={fieldErrors}
            authError={authError}
            submitting={authSubmitting}
            onRegister={() => void handleRegister()}
            onLogin={() => {
              resetAuthForm();
              open('login');
            }}
            onBack={goBack}
            onValidateStep1={validateStep1}
            onBlurUsername={validateUsernameBlur}
            onBlurEmail={validateEmailBlur}
          />
        )}

        {screen === 'forgot_password' && (
          <ForgotPasswordScreen
            email={forgotEmail}
            setEmail={setForgotEmail}
            fieldError={forgotFieldError}
            formError={forgotFormError}
            submitting={forgotSubmitting}
            onSendRecoveryLink={() => void handleForgotRequest()}
            onBackToLogin={() => resetTo('login')}
          />
        )}

        {screen === 'reset_password' && (
          <ResetPasswordScreen
            newPassword={forgotNewPassword}
            setNewPassword={setForgotNewPassword}
            confirmPassword={forgotConfirmPassword}
            setConfirmPassword={setForgotConfirmPassword}
            fieldError={forgotFieldError}
            formError={forgotFormError}
            submitting={forgotSubmitting}
            onResetPassword={() => void handleResetPassword()}
            onBackToLogin={() => resetTo('login')}
          />
        )}

        {screen === 'profile_edit' && (
          <ProfileEditScreen
            displayName={editDisplayName}
            setDisplayName={setEditDisplayName}
            email={currentUser.email}
            age={editAge}
            setAge={setEditAge}
            avatar={editAvatar}
            setAvatar={setEditAvatar}
            onSave={() => void handleSaveProfile()}
            onBack={goBack}
            isDirty={profileDirty}
            error={profileSaveError}
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
            setEditDisplayName(currentUser.username);
            setEditAvatar(currentUser.avatar);
            setEditAge(String(currentUser.age));
            setProfileSaveError(null);
              open('profile_edit');
            }}
            onLogout={handleLogout}
            onBack={goBack}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
