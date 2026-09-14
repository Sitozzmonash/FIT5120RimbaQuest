import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen, Species } from '../types';
import { API_BASE } from '../constants/config';
import { SPECIES_IMAGES, hasReferenceImage } from '../constants/images';
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
import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useSelectedSpeciesStore } from '../store/useSelectedSpeciesStore';
import { useSpeciesCatalogStore } from '../store/useSpeciesCatalogStore';
import { useUserStore } from '../store/useUserStore';

const GRADIENT_SCREENS: Screen[] = ['account_entry', 'login', 'create_account', 'forgot_password', 'reset_password', 'collection', 'locations', 'location_detail', 'progress', 'profile_edit'];
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

export default function RimbaQuest() {
  const screen = useNavigationStore((state) => state.screen);
  const open = useNavigationStore((state) => state.open);
  const resetTo = useNavigationStore((state) => state.resetTo);
  const goBack = useNavigationStore((state) => state.goBack);

  const bootstrapped = useUserStore((state) => state.bootstrapped);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const discovered = useUserStore((state) => state.discovered);

  const selected = useSelectedSpeciesStore((state) => state.selected);
  const species = useSpeciesCatalogStore((state) => state.species);

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
  const battleRecordedRef = React.useRef(false);

  useEffect(() => {
    void useUserStore.getState().restoreSession();
  }, []);

  // The species catalog is public and static enough to fetch once, rather
  // than re-fetching alongside every profile refresh.
  useEffect(() => {
    void useSpeciesCatalogStore.getState().loadSpecies();
  }, []);

  // goBack() lands here once its history stack is empty.
  useEffect(() => {
    useNavigationStore.getState().setFallbackScreen(isLoggedIn ? 'home' : 'account_entry');
  }, [isLoggedIn]);

  const supportedSpecies = useMemo(() => species.filter(hasReferenceImage), [species]);
  const unlockedSpeciesList = useMemo(
    () => supportedSpecies.filter((item) => discovered.includes(item.id)),
    [discovered, supportedSpecies]
  );

  const initBattle = async (card: Species) => {
    battleRecordedRef.current = false;
    setBattleXpAwarded(null);
    setBattlePlayerCard(card);

    const { currentUser: user, authHeaders } = useUserStore.getState();

    let opponent: BattleOpponent = DEFAULT_OPPONENT;
    let unlocked: number[] = [];
    let abilities: BattleAbilityItem[] = getFallbackAbilities(card.category);
    let playerMaxHp = card.hp || 120;

    if (user.id) {
      try {
        const [oppRes, cardRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/children/${user.id}/battle/opponent?player_species_id=${encodeURIComponent(card.id)}`, {
            headers: authHeaders(),
          }),
          fetch(`${API_BASE}/api/v1/children/${user.id}/species/${encodeURIComponent(card.id)}/battle-card`, {
            headers: authHeaders(),
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
    const { currentUser: user, authHeaders } = useUserStore.getState();
    if (battleRecordedRef.current || !user.id) return;
    battleRecordedRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/api/v1/children/${user.id}/battle/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        useUserStore.getState().updateCurrentUser({ xp: data.total_xp });
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

        {(screen === 'about' || screen === 'battle_stats' || screen === 'facts' || screen === 'gallery' || screen === 'quiz') && (
          <SpeciesDetailScreen onStartBattle={() => void initBattle(selected)} />
        )}

        {screen === 'locked' && <LockedScreen />}

        {screen === 'battle_select' && (
          <BattleSelectScreen
            unlockedSpecies={unlockedSpeciesList}
            selectedCard={battlePlayerCard}
            onSelectCard={setBattlePlayerCard}
            onStartBattle={() => battlePlayerCard && void initBattle(battlePlayerCard)}
            onStartDiscovery={() => useDiscoveryStore.getState().start()}
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
