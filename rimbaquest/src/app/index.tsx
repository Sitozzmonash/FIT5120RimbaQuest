import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DiscoverySession,
  GalleryItem,
  RecentCapture,
  Screen,
  Species,
  SpeciesChatResponse,
  UserProfile,
} from '../types';
import { API_BASE } from '../constants/config';
import { CATEGORIES, SEED_SPECIES } from '../constants/seed';
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
import { BattleAbilityItem } from '../components/screens/battle/components/BattleActionBar';
import { AccountEntryScreen } from '../components/screens/AccountEntryScreen';
import { LoginScreen } from '../components/screens/login';
import { AccountCreationScreen } from '../components/screens/account-creation';
import { ForgotPasswordScreen, ResetPasswordScreen } from '../components/screens/passwordRecovery';
import { ProfileEditScreen, ProfileScreen } from '../components/screens/profile';
import { DEFAULT_AVATAR } from '../constants/images';
import { SaveDiscoveryResult, useDiscoveryStore } from '../store/useDiscoveryStore';
import { useForgotPasswordStore } from '../store/useForgotPasswordStore';
import { useLocationsStore } from '../store/useLocationsStore';
import { useLoginStore } from '../store/useLoginStore';
import { useProfileEditStore } from '../store/useProfileEditStore';
import { apiMessage } from '../utils/authApi';

const OFFLINE_SPECIES = Array.from(new Map(SEED_SPECIES.map((item) => [item.id, item])).values());

const GRADIENT_SCREENS: Screen[] = ['account_entry', 'login', 'create_account', 'forgot_password', 'reset_password', 'collection', 'locations', 'location_detail', 'progress', 'profile_edit'];
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

type BattleOpponent = {
  species_id: string;
  name: string;
  category: string;
  hp: number;
  max_hp: number;
  base_attack: number;
  abilities?: BattleAbilityItem[];
};

const DEFAULT_OPPONENT: BattleOpponent = {
  species_id: 'sp_wild_boar',
  name: 'Wild Boar',
  category: 'Mammal',
  hp: 110,
  max_hp: 110,
  base_attack: 20,
};

const FALLBACK_ABILITIES: Record<string, BattleAbilityItem[]> = {
  Mammal: [
    { slot: 1, name: 'Swift Pounce', multiplier: 1.5, heal_amount: 0, description: 'A rapid leaping attack dealing 1.5x damage.' },
    { slot: 2, name: 'Wild Roar', multiplier: 0.8, heal_amount: 25, description: 'An intimidating roar recovering 25 HP and dealing moderate damage.' },
    { slot: 3, name: 'Guardian Guard', multiplier: 2.2, heal_amount: 10, description: 'An ultimate territorial strike dealing 2.2x damage and restoring 10 HP.' },
  ],
  Reptile: [
    { slot: 1, name: 'Iron Scales', multiplier: 1.4, heal_amount: 0, description: 'Hardened armored charge dealing 1.4x damage.' },
    { slot: 2, name: 'Venom Strike', multiplier: 1.3, heal_amount: 20, description: 'A venomous bite dealing damage and absorbing 20 HP.' },
    { slot: 3, name: 'Ambush Snap', multiplier: 2.1, heal_amount: 0, description: 'A crushing ambush strike dealing devastating 2.1x damage.' },
  ],
  Bird: [
    { slot: 1, name: 'Aerial Dive', multiplier: 1.5, heal_amount: 0, description: 'A high-speed dive from above dealing 1.5x damage.' },
    { slot: 2, name: 'Sonic Cry', multiplier: 1.3, heal_amount: 15, description: 'A disorienting screech dealing damage and rallying 15 HP.' },
    { slot: 3, name: 'Sharp Talon', multiplier: 2.2, heal_amount: 0, description: 'Savage razor-sharp talons dealing 2.2x base attack damage.' },
  ],
  Butterfly: [
    { slot: 1, name: 'Toxic Powder', multiplier: 1.5, heal_amount: 0, description: 'Scatters irritating spore dust dealing 1.5x damage.' },
    { slot: 2, name: 'Nectar Heal', multiplier: 0.5, heal_amount: 35, description: 'Sips restorative jungle nectar to recover 35 HP.' },
    { slot: 3, name: 'Dazzle Flutter', multiplier: 2.0, heal_amount: 15, description: 'A mesmerizing wing flurry dealing 2.0x damage and restoring 15 HP.' },
  ],
};

function getFallbackAbilities(category?: string): BattleAbilityItem[] {
  const cat = (category || '').charAt(0).toUpperCase() + (category || '').slice(1).toLowerCase();
  return FALLBACK_ABILITIES[cat] || [
    { slot: 1, name: 'Basic Tackle', multiplier: 1.4, heal_amount: 0, description: 'A forceful body tackle dealing 1.4x damage.' },
    { slot: 2, name: 'Defend', multiplier: 0.6, heal_amount: 20, description: 'Braces defense and recovers 20 HP.' },
    { slot: 3, name: 'Focus Strike', multiplier: 2.0, heal_amount: 0, description: 'Concentrates energy for a heavy 2.0x damage strike.' },
  ];
}


function isHttpPhotoUrl(url?: string | null): boolean {
  return Boolean(url && /^https?:\/\//i.test(url));
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
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');

  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, GalleryItem[]>>({});
  const [recentCaptures, setRecentCaptures] = useState<RecentCapture[]>([]);

  const locations = useLocationsStore((state) => state.locations);
  const selectedLocation = useLocationsStore((state) => state.selectedLocation);

  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_USER);

  const [battlePlayerCard, setBattlePlayerCard] = useState<Species | null>(null);
  const [battlePlayerHp, setBattlePlayerHp] = useState(120);
  const [battlePlayerMaxHp, setBattlePlayerMaxHp] = useState(120);
  const [battleOpponent, setBattleOpponent] = useState<BattleOpponent>(DEFAULT_OPPONENT);
  const [battleOpponentHp, setBattleOpponentHp] = useState(DEFAULT_OPPONENT.hp);
  const [battleOpponentMaxHp, setBattleOpponentMaxHp] = useState(DEFAULT_OPPONENT.hp);
  const [unlockedAbilities, setUnlockedAbilities] = useState<number[]>([]);
  const [playerAbilities, setPlayerAbilities] = useState<BattleAbilityItem[]>([]);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleRound, setBattleRound] = useState(1);
  const [battleOutcome, setBattleOutcome] = useState<'playing' | 'win' | 'lose' | null>(null);
  const [battleXpAwarded, setBattleXpAwarded] = useState<number | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const battleRecordedRef = useRef(false);

  const resetAuthForm = () => {
    useLoginStore.getState().reset();
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
    useLoginStore.getState().setAuthError('Your session is no longer valid. Please sign in again.');
    setHistory([]);
    setScreen('login');
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
      await useLocationsStore.getState().loadLocations();
      setNotice(null);
    } catch {
      setNotice('You are exploring in offline demo mode. Discoveries will sync when the backend connects.');
      // useLocationsStore.getState().useOfflineFallbackIfEmpty();
    } finally {
      setLoading(false);
    }
  };

  const refreshRecentCaptures = async (childId: number, token = accessToken) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/children/${childId}/recent-captures`,
        { headers: authenticatedHeaders(token) },
      );
      if (response.status === 401 || response.status === 403) {
        await expireSession();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setRecentCaptures(data.items);
      }
    } catch {
      // A chat answer may still be visible even if the background refresh
      // cannot update the home card immediately.
    }
  };

  const sendSpeciesChatQuestion = async (
    speciesId: string,
    question: string,
  ): Promise<SpeciesChatResponse> => {
    if (!currentUser.id || !accessToken) {
      throw new Error('Please sign in before using WildGuide.');
    }
    const response = await fetch(
      `${API_BASE}/api/v1/children/${currentUser.id}/species/${encodeURIComponent(speciesId)}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authenticatedHeaders(),
        },
        body: JSON.stringify({ question }),
      },
    );
    const data: unknown = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      await expireSession();
      throw new Error('Your session is no longer valid. Please sign in again.');
    }
    if (!response.ok) {
      throw new Error(apiMessage(data, "I couldn't answer that right now. Please try again."));
    }
    if (!data || typeof data !== 'object' || !('answer' in data) ||
      typeof data.answer !== 'string' || !data.answer.trim()) {
      throw new Error("I couldn't answer that right now. Please try again.");
    }
    void refreshRecentCaptures(currentUser.id, accessToken);
    const suggestions = 'suggested_questions' in data ? data.suggested_questions : undefined;
    return {
      answer: data.answer,
      suggested_questions: Array.isArray(suggestions)
        ? suggestions.filter((item): item is string => typeof item === 'string')
        : undefined,
    };
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

  const startDiscovery = (presetLocation?: string) => {
    useDiscoveryStore.getState().resetSelections();
    setSelected(OFFLINE_SPECIES[0]);
    if (presetLocation) useDiscoveryStore.getState().setDiscoveryLocation(presetLocation);
    resetTo('photo');
  };

  const acceptPhoto = (uri: string, mimeType = 'image/jpeg') => {
    open('photo_preview');
    void (async () => {
      const verified = await useDiscoveryStore
        .getState()
        .submitPhoto(uri, mimeType, currentUser.id, accessToken, expireSession);
      if (verified) setScreen('species');
    })();
  };

  // Confirmed from the discard-photo dialog: abandon the in-progress
  // discovery entirely and land back on Home, rather than stepping back
  // one screen at a time.
  const discardDiscovery = () => {
    useDiscoveryStore.getState().discard();
    setSelected(OFFLINE_SPECIES[0]);
    resetTo('home');
  };

  const retakePhoto = () => {
    setScreen('photo');
  };

  const continueWithVerifiedSpecies = (item: Species) => {
    useDiscoveryStore.getState().confirmSpecies(item);
    setSelected(item);
    open('confirm');
  };

  const handleDiscoverySaved = (result: SaveDiscoveryResult) => {
    if (result.first_discovery && !discovered.includes(selected.id)) {
      setDiscovered((current) => [...current, selected.id]);
      setCurrentUser((prev) => ({ ...prev, xp: result.total_xp ?? prev.xp }));
    }
    setGalleryPhotos((current) => ({
      ...current,
      [selected.id]: [
        { photo_url: result.photo_url, location_label: result.location_label },
        ...(current[selected.id] ?? []),
      ],
    }));
    return refresh(currentUser.id, accessToken).then(() => open('success'));
  };

  const handleDiscoveryReported = () => {
    discardDiscovery();
    setNotice('Thanks for reporting the AI result. No discovery or Wildlife Card was saved.');
  };

  const handleProfileSaved = (data: Partial<UserProfile>, submittedUsername: string) => {
    setCurrentUser((prev) => {
      const updatedUsername = String(data.username || submittedUsername || prev.username);
      const next = { ...prev, ...data, username: updatedUsername, display_name: String(data.display_name || updatedUsername) };
      void saveSession({ user: next, accessToken });
      return next;
    });
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

  const initBattle = async (card: Species) => {
    battleRecordedRef.current = false;
    setBattleXpAwarded(null);
    setBattlePlayerCard(card);

    let opponent: BattleOpponent = DEFAULT_OPPONENT;
    let unlocked: number[] = [];
    let abilities: BattleAbilityItem[] = getFallbackAbilities(card.category);
    let playerMaxHp = card.hp || 120;

    if (currentUser.id) {
      try {
        const [oppRes, cardRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/children/${currentUser.id}/battle/opponent?player_species_id=${encodeURIComponent(card.id)}`, {
            headers: authenticatedHeaders(),
          }),
          fetch(`${API_BASE}/api/v1/children/${currentUser.id}/species/${encodeURIComponent(card.id)}/battle-card`, {
            headers: authenticatedHeaders(),
          }),
        ]);

        if (oppRes.ok) {
          const oppData = await oppRes.json();
          if (oppData.opponent) {
            opponent = {
              species_id: oppData.opponent.species_id || 'sp_wild_boar',
              name: oppData.opponent.name || 'Wild Boar',
              category: oppData.opponent.category || 'Mammal',
              hp: oppData.opponent.hp || 110,
              max_hp: oppData.opponent.max_hp || oppData.opponent.hp || 110,
              base_attack: oppData.opponent.base_attack || 20,
              abilities: oppData.opponent.abilities,
            };
          }
        }

        if (cardRes.ok) {
          const cardData = await cardRes.json();
          if (cardData.card) {
            if (cardData.card.hp) playerMaxHp = cardData.card.hp;
            if (Array.isArray(cardData.card.unlocked_abilities)) {
              unlocked = cardData.card.unlocked_abilities;
            }
            if (Array.isArray(cardData.card.abilities_details)) {
              abilities = cardData.card.abilities_details;
            }
          }
        }
      } catch {
        // Fallback to defaults
      }
    }

    setBattleOpponent(opponent);
    setUnlockedAbilities(unlocked);
    setPlayerAbilities(abilities);

    setBattlePlayerHp(playerMaxHp);
    setBattlePlayerMaxHp(playerMaxHp);
    setBattleOpponentHp(opponent.hp);
    setBattleOpponentMaxHp(opponent.max_hp);
    setBattleLog([
      `A wild ${opponent.name} appeared!`,
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
          opponent_name: battleOpponent.name,
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

  const executeBotTurn = async (
    currentOpponent: BattleOpponent,
    botHp: number,
    playerHp: number,
    round: number,
  ): Promise<{ action_name: string; damage: number; healing: number; log: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/battle/bot-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_data: currentOpponent,
          bot_current_hp: botHp,
          player_current_hp: playerHp,
          round_num: round,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.action) {
          return data.action;
        }
      }
    } catch {
      // offline fallback
    }

    const baseAtk = currentOpponent.base_attack || 20;
    const hit = Math.random() < 0.85;
    const dmg = hit ? baseAtk : 0;
    const log = hit
      ? `${currentOpponent.name} used Basic Attack for ${dmg} damage.`
      : `${currentOpponent.name}'s Basic Attack missed!`;
    return {
      action_name: 'Basic Attack',
      damage: dmg,
      healing: 0,
      log,
    };
  };

  const performAttack = () => {
    if (!battlePlayerCard || isAttacking || battleOutcome !== 'playing') return;
    setIsAttacking(true);
    const missed = Math.random() < 0.15;
    const playerDmg = missed ? 0 : battlePlayerCard.base_attack || 25;
    const nextOpponentHp = Math.max(0, battleOpponentHp - playerDmg);
    const newLogs = [
      ...battleLog,
      missed
        ? `${battlePlayerCard.common_name}'s Basic Attack missed!`
        : `${battlePlayerCard.common_name} used Basic Attack for ${playerDmg} damage.`,
    ];
    if (nextOpponentHp <= 0) {
      setBattleOpponentHp(0);
      newLogs.push(`${battleOpponent.name} fainted. You won!`);
      setBattleLog(newLogs);
      setBattleOutcome('win');
      setIsAttacking(false);
      void recordBattleResult(true, battleRound);
      return;
    }
    setBattleOpponentHp(nextOpponentHp);
    setBattleLog(newLogs);

    setTimeout(async () => {
      const botAction = await executeBotTurn(
        battleOpponent,
        nextOpponentHp,
        battlePlayerHp,
        battleRound,
      );
      if (botAction.healing > 0) {
        setBattleOpponentHp((curr) => Math.min(battleOpponentMaxHp, curr + botAction.healing));
      }
      const nextPlayerHp = Math.max(0, battlePlayerHp - botAction.damage);
      newLogs.push(botAction.log);
      if (nextPlayerHp <= 0) {
        setBattlePlayerHp(0);
        newLogs.push(`${battlePlayerCard.common_name} is too tired to continue.`);
        setBattleOutcome('lose');
        void recordBattleResult(false, battleRound);
      } else {
        setBattlePlayerHp(nextPlayerHp);
        setBattleRound((r) => r + 1);
      }
      setBattleLog([...newLogs]);
      setIsAttacking(false);
    }, 500);
  };

  const performAbility = (slot: number) => {
    if (!battlePlayerCard || isAttacking || battleOutcome !== 'playing') return;
    setIsAttacking(true);

    const ability = playerAbilities.find((a) => a.slot === slot) || {
      slot,
      name: `Ability ${slot}`,
      multiplier: slot === 3 ? 2.0 : slot === 2 ? 0.8 : 1.5,
      heal_amount: slot === 2 ? 25 : 0,
    };

    const baseAtk = battlePlayerCard.base_attack || 25;
    const mult = typeof ability.multiplier === 'number' ? ability.multiplier : 1.0;
    const dmg = Math.round(baseAtk * mult);
    const heal = ability.heal_amount || 0;

    let nextPlayerHp = battlePlayerHp;
    if (heal > 0) {
      nextPlayerHp = Math.min(battlePlayerMaxHp, battlePlayerHp + heal);
      setBattlePlayerHp(nextPlayerHp);
    }

    const nextOpponentHp = Math.max(0, battleOpponentHp - dmg);
    setBattleOpponentHp(nextOpponentHp);

    let abilityLog = `${battlePlayerCard.common_name} used ${ability.name}! Opponent lost ${dmg} HP.`;
    if (heal > 0) {
      abilityLog += ` Recovered ${heal} HP.`;
    }
    const newLogs = [...battleLog, abilityLog];

    if (nextOpponentHp <= 0) {
      setBattleOpponentHp(0);
      newLogs.push(`${battleOpponent.name} fainted. You won!`);
      setBattleLog(newLogs);
      setBattleOutcome('win');
      setIsAttacking(false);
      void recordBattleResult(true, battleRound);
      return;
    }

    setBattleLog(newLogs);

    setTimeout(async () => {
      const botAction = await executeBotTurn(
        battleOpponent,
        nextOpponentHp,
        nextPlayerHp,
        battleRound,
      );
      if (botAction.healing > 0) {
        setBattleOpponentHp((curr) => Math.min(battleOpponentMaxHp, curr + botAction.healing));
      }
      const afterBotPlayerHp = Math.max(0, nextPlayerHp - botAction.damage);
      newLogs.push(botAction.log);
      if (afterBotPlayerHp <= 0) {
        setBattlePlayerHp(0);
        newLogs.push(`${battlePlayerCard.common_name} is too tired to continue.`);
        setBattleOutcome('lose');
        void recordBattleResult(false, battleRound);
      } else {
        setBattlePlayerHp(afterBotPlayerHp);
        setBattleRound((r) => r + 1);
      }
      setBattleLog([...newLogs]);
      setIsAttacking(false);
    }, 500);
  };

  const performGiveUp = () => {
    if (!battlePlayerCard || isAttacking || battleOutcome !== 'playing') return;
    setBattlePlayerHp(0);
    setBattleLog((current) => [...current, `You gave up. ${battlePlayerCard.common_name} retreated from the battle.`]);
    setBattleOutcome('lose');
    void recordBattleResult(false, battleRound);
  };

  const discoveryPhotoUri = useDiscoveryStore((state) => state.photoUri);
  const discoveryPhoto = discoveryPhotoUri ? { uri: discoveryPhotoUri } : null;
  const discoverySession: DiscoverySession = {
    childId: currentUser.id,
    token: accessToken,
    onSessionExpired: expireSession,
  };
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
          <LocationsScreen onOpenDetail={() => open('location_detail')} onBack={goBack} />
        )}

        {screen === 'location_detail' && selectedLocation && (
          <LocationDetailScreen onBack={goBack} onRecordHere={(locName) => startDiscovery(locName)} />
        )}

        {screen === 'photo' && (
          <CameraScreen
            lastCaptureUri={recentCaptures[0]?.photo_url ?? null}
            onCapture={acceptPhoto}
            onBack={goBack}
          />
        )}

        {screen === 'photo_preview' && discoveryPhoto && (
          <PhotoPreviewScreen photo={discoveryPhoto} onRetake={retakePhoto} />
        )}

        {screen === 'category' && discoveryPhoto && (
          <CategoryScreen
            photo={discoveryPhoto}
            onNext={() => open('species')}
            onBack={goBack}
            onDiscard={discardDiscovery}
          />
        )}

        {screen === 'species' && discoveryPhoto && (
          <SpeciesScreen
            photo={discoveryPhoto}
            session={discoverySession}
            onContinue={continueWithVerifiedSpecies}
            onBack={goBack}
            onDiscard={discardDiscovery}
          />
        )}

        {screen === 'confirm' && discoveryPhoto && (
          <ConfirmScreen
            photo={discoveryPhoto}
            selected={selected}
            session={discoverySession}
            onSaved={handleDiscoverySaved}
            onReported={handleDiscoveryReported}
            onBack={goBack}
            onDiscard={discardDiscovery}
          />
        )}

        {screen === 'success' && (
          <SuccessScreen selected={selected} onViewCard={() => open('about')} onRecordAnother={() => startDiscovery()} />
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
            onStartDiscovery={() => startDiscovery()}
            onBack={goBack}
          />
        )}

        {(screen === 'about' || screen === 'battle_stats' || screen === 'facts' || screen === 'gallery' || screen === 'quiz') && (
          <SpeciesDetailScreen
            species={selected}
            screen={screen}
            photos={galleryPhotos[selected.id] ?? []}
            token={accessToken}
            onTabChange={(tab) => open(tab)}
            onStartBattle={() => void initBattle(selected)}
            childId={currentUser.id}
            onChatSend={(question) => sendSpeciesChatQuestion(selected.id, question)}
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
            onStartBattle={() => battlePlayerCard && void initBattle(battlePlayerCard)}
            onStartDiscovery={() => startDiscovery()}
            onBack={goBack}
          />
        )}

        {screen === 'battle_arena' && battlePlayerCard && (
          <BattleArenaScreen
            card={battlePlayerCard}
            opponentName={battleOpponent.name}
            opponentImage={SPECIES_IMAGES[battleOpponent.species_id] || BATTLE_OPPONENT.image}
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
            onGiveUp={performGiveUp}
            onBattleAgain={() => void initBattle(battlePlayerCard)}
            onSelectAnotherCard={() => resetTo('battle_select')}
            onBack={goBack}
            unlockedAbilities={unlockedAbilities}
            abilities={playerAbilities}
            onUseAbility={performAbility}
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
            onLoginSuccess={(user, token) => applyUser(user, token)}
            onForgotPassword={() => {
              useForgotPasswordStore.getState().reset();
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
            onRegisterSuccess={(user, token) => applyUser(user, token)}
            onLogin={() => {
              resetAuthForm();
              open('login');
            }}
            onBack={goBack}
          />
        )}

        {screen === 'forgot_password' && (
          <ForgotPasswordScreen
            onRequestSuccess={() => open('reset_password')}
            onBackToLogin={() => resetTo('login')}
          />
        )}

        {screen === 'reset_password' && (
          <ResetPasswordScreen
            onResetSuccess={() => resetTo('login')}
            onBackToLogin={() => resetTo('login')}
          />
        )}

        {screen === 'profile_edit' && (
          <ProfileEditScreen
            email={currentUser.email}
            childId={currentUser.id}
            token={accessToken}
            onSaved={handleProfileSaved}
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
              useProfileEditStore.getState().startEditing(currentUser);
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
