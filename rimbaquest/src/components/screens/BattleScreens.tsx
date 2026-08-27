import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Species } from '../../types';
import { imageFor } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Header, Section } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function BattleSelectScreen({
  unlockedSpecies,
  selectedCard,
  onSelectCard,
  onStartBattle,
  onStartDiscovery,
  onBack,
}: {
  unlockedSpecies: Species[];
  selectedCard: Species | null;
  onSelectCard: (card: Species) => void;
  onStartBattle: () => void;
  onStartDiscovery: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Wildlife Card Battles" onBack={onBack} />
      <View style={styles.battleHero}>
        <Text style={styles.battleHeroTitle}>Card Battle</Text>
        <Text style={styles.battleHeroCopy}>
          Choose one discovered Wildlife Card, then start a simple battle.
        </Text>
      </View>

      <Section title="Select Your Battle Card" />
      {unlockedSpecies.length > 0 ? (
        <>
          <View style={styles.grid}>
            {unlockedSpecies.map((item) => {
              const selected = selectedCard?.id === item.id;
              return (
                <Tap
                  key={item.id}
                  label={`Select ${item.common_name}`}
                  style={[styles.battleCardSelect, selected && styles.battleCardSelectActive]}
                  onPress={() => onSelectCard(item)}
                >
                  <Image source={imageFor(item)!} style={styles.battleCardImage} />
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.common_name}</Text>
                  <View style={styles.battleStatsRow}>
                    <Text style={styles.hpBadge}>HP {item.hp || 120}</Text>
                    <Text style={styles.atkBadge}>ATK {item.base_attack || 25}</Text>
                  </View>
                  <View style={[styles.battleButtonSmall, !selected && styles.battleButtonSmallIdle]}>
                    <Text style={styles.battleButtonSmallText}>{selected ? 'Selected' : 'Tap to select'}</Text>
                  </View>
                </Tap>
              );
            })}
          </View>
          <Tap
            label="Start Battle"
            style={[styles.primary, !selectedCard && styles.buttonDisabled]}
            disabled={!selectedCard}
            onPress={onStartBattle}
          >
            <Text style={styles.primaryText}>Start Battle</Text>
          </Tap>
        </>
      ) : (
        <View style={styles.searchEmpty}>
          <Text style={styles.searchEmptyTitle}>No unlocked Wildlife Cards yet</Text>
          <Text style={styles.muted}>Record a wildlife discovery to unlock cards for battle.</Text>
          <Tap label="Record discovery" style={styles.primary} onPress={onStartDiscovery}>
            <Text style={styles.primaryText}>Record a Discovery</Text>
          </Tap>
        </View>
      )}
    </ScrollView>
  );
}

export function BattleArenaScreen({
  card,
  opponentName,
  opponentImage,
  playerHp,
  playerMaxHp,
  opponentHp,
  opponentMaxHp,
  battleLog,
  battleRound,
  battleOutcome,
  xpAwarded,
  isAttacking,
  onAttack,
  onBattleAgain,
  onSelectAnotherCard,
  onBack,
}: {
  card: Species;
  opponentName: string;
  opponentImage: number;
  playerHp: number;
  playerMaxHp: number;
  opponentHp: number;
  opponentMaxHp: number;
  battleLog: string[];
  battleRound: number;
  battleOutcome: 'playing' | 'win' | 'lose' | null;
  xpAwarded?: number | null;
  isAttacking: boolean;
  onAttack: () => void;
  onBattleAgain: () => void;
  onSelectAnotherCard: () => void;
  onBack: () => void;
}) {
  const outcomeTitle = battleOutcome === 'win' ? 'Victory' : 'Defeat';
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title={battleOutcome === 'playing' ? 'Battle' : outcomeTitle} onBack={onBack} />

      <View style={styles.arenaOpponentBox}>
        <Image source={opponentImage} style={styles.arenaCardImage} />
        <View style={styles.arenaHeaderRow}>
          <Text style={styles.arenaOpponentName}>{opponentName}</Text>
          <Text style={styles.arenaHpText}>{opponentHp} / {opponentMaxHp} HP</Text>
        </View>
        <View style={styles.hpTrack}>
          <View style={[styles.hpFillOpponent, { width: `${(opponentHp / opponentMaxHp) * 100}%` }]} />
        </View>
      </View>

      <Text style={styles.arenaVsText}>VS</Text>

      <View style={styles.arenaPlayerBox}>
        <Image source={imageFor(card)!} style={styles.arenaCardImage} />
        <View style={styles.arenaHeaderRow}>
          <Text style={styles.arenaPlayerName}>{card.common_name}</Text>
          <Text style={styles.arenaHpText}>{playerHp} / {playerMaxHp} HP</Text>
        </View>
        <View style={styles.hpTrack}>
          <View style={[styles.hpFillPlayer, { width: `${(playerHp / playerMaxHp) * 100}%` }]} />
        </View>
        <View style={styles.battleStatsRow}>
          <Text style={styles.categoryPill}>{card.category}</Text>
          <Text style={styles.atkBadge}>Base ATK {card.base_attack || 25}</Text>
        </View>
      </View>

      <View style={styles.battleLogBox}>
        <Text style={styles.battleLogTitle}>Battle log (round {battleRound})</Text>
        {battleLog.slice(-4).map((log, idx) => (
          <Text key={idx} style={styles.battleLogText}>{log}</Text>
        ))}
      </View>

      {battleOutcome === 'playing' ? (
        <View style={styles.battleActions}>
          <Tap
            label="Basic Attack"
            style={[styles.primary, isAttacking && styles.buttonDisabled]}
            disabled={isAttacking}
            onPress={onAttack}
          >
            <Text style={styles.primaryText}>
              {isAttacking ? 'Attacking...' : 'Basic Attack'}
            </Text>
          </Tap>
          <View style={styles.lockedAbilityNotice}>
            <Text style={styles.lockedAbilityNoticeText}>Special abilities are locked</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.battleOutcomeBox, battleOutcome === 'lose' && styles.battleOutcomeBoxLose]}>
          <Text style={[styles.battleOutcomeTitle, battleOutcome === 'lose' && styles.battleOutcomeTitleLose]}>
            {battleOutcome === 'win' ? 'Victory' : 'Defeat'}
          </Text>
          <Text style={styles.battleOutcomeCopy}>
            {battleOutcome === 'win'
              ? (xpAwarded
                ? `Your Wildlife Card won this battle. +${xpAwarded} Explorer XP`
                : 'Your Wildlife Card won this battle.')
              : (xpAwarded
                ? `Your Wildlife Card was defeated. +${xpAwarded} Explorer XP. Try another card or battle again.`
                : 'Your Wildlife Card was defeated. Try another card or battle again.')}
          </Text>
          <Tap label="Battle Again" style={styles.primary} onPress={onBattleAgain}>
            <Text style={styles.primaryText}>Battle Again</Text>
          </Tap>
          <Tap label="Choose Another Card" style={styles.secondary} onPress={onSelectAnotherCard}>
            <Text style={styles.secondaryText}>Choose Another Card</Text>
          </Tap>
        </View>
      )}
    </ScrollView>
  );
}
