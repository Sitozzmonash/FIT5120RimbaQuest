import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Species } from '../../types';
import { imageFor } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Header, Section } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function BattleSelectScreen({
  unlockedSpecies,
  battleCard,
  onSelectCard,
  onStartDiscovery,
}: {
  unlockedSpecies: Species[];
  battleCard: Species | null;
  onSelectCard: (card: Species) => void;
  onStartDiscovery: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Wildlife Card Battles" back={false} />
      <View style={styles.battleHero}>
        <Text style={styles.battleHeroTitle}>⚔️ Rainforest Battle Arena</Text>
        <Text style={styles.battleHeroCopy}>
          Select one of your discovered Wildlife Cards to test its strength against wild forest challengers!
        </Text>
      </View>

      <Section title="Select Your Battle Card" />
      {unlockedSpecies.length > 0 ? (
        <View style={styles.grid}>
          {unlockedSpecies.map((item) => (
            <Tap
              key={item.id}
              label={`Select ${item.common_name}`}
              style={[styles.battleCardSelect, battleCard?.id === item.id && styles.battleCardSelectActive]}
              onPress={() => onSelectCard(item)}
            >
              <Image source={imageFor(item)!} style={styles.battleCardImage} />
              <Text style={styles.cardTitle} numberOfLines={1}>{item.common_name}</Text>
              <View style={styles.battleStatsRow}>
                <Text style={styles.hpBadge}>❤️ {item.hp || 120} HP</Text>
                <Text style={styles.atkBadge}>⚔️ {item.base_attack || 25} ATK</Text>
              </View>
              <View style={styles.battleButtonSmall}>
                <Text style={styles.battleButtonSmallText}>Choose & Battle ›</Text>
              </View>
            </Tap>
          ))}
        </View>
      ) : (
        <View style={styles.searchEmpty}>
          <Text style={styles.searchEmptyTitle}>No unlocked Wildlife Cards yet!</Text>
          <Text style={styles.muted}>Record your first wildlife discovery to unlock cards for battle.</Text>
          <Tap label="Record discovery" style={styles.primary} onPress={onStartDiscovery}>
            <Text style={styles.primaryText}>📷 Record a Discovery</Text>
          </Tap>
        </View>
      )}
    </ScrollView>
  );
}

export function BattleArenaScreen({
  card,
  opponentName,
  playerHp,
  playerMaxHp,
  opponentHp,
  opponentMaxHp,
  battleLog,
  battleRound,
  battleOutcome,
  isAttacking,
  onAttack,
  onBattleAgain,
  onSelectAnotherCard,
  onBack,
}: {
  card: Species;
  opponentName: string;
  playerHp: number;
  playerMaxHp: number;
  opponentHp: number;
  opponentMaxHp: number;
  battleLog: string[];
  battleRound: number;
  battleOutcome: 'playing' | 'win' | 'lose' | null;
  isAttacking: boolean;
  onAttack: () => void;
  onBattleAgain: () => void;
  onSelectAnotherCard: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Battle in Progress" onBack={onBack} />

      {/* Opponent Arena Box */}
      <View style={styles.arenaOpponentBox}>
        <View style={styles.arenaHeaderRow}>
          <Text style={styles.arenaOpponentName}>🐗 {opponentName}</Text>
          <Text style={styles.arenaHpText}>{opponentHp} / {opponentMaxHp} HP</Text>
        </View>
        <View style={styles.hpTrack}>
          <View style={[styles.hpFillOpponent, { width: `${(opponentHp / opponentMaxHp) * 100}%` }]} />
        </View>
      </View>

      <Text style={styles.arenaVsText}>⚡ VS ⚡</Text>

      {/* Player Arena Box */}
      <View style={styles.arenaPlayerBox}>
        <View style={styles.arenaHeaderRow}>
          <Text style={styles.arenaPlayerName}>🐾 {card.common_name}</Text>
          <Text style={styles.arenaHpText}>{playerHp} / {playerMaxHp} HP</Text>
        </View>
        <View style={styles.hpTrack}>
          <View style={[styles.hpFillPlayer, { width: `${(playerHp / playerMaxHp) * 100}%` }]} />
        </View>
        <View style={styles.battleStatsRow}>
          <Text style={styles.categoryPill}>{card.category}</Text>
          <Text style={styles.atkBadge}>Base ATK: {card.base_attack || 25}</Text>
        </View>
      </View>

      {/* Battle Logs */}
      <View style={styles.battleLogBox}>
        <Text style={styles.battleLogTitle}>📜 Battle Log (Round {battleRound})</Text>
        {battleLog.slice(-4).map((log, idx) => (
          <Text key={idx} style={styles.battleLogText}>{log}</Text>
        ))}
      </View>

      {/* Combat Actions */}
      {battleOutcome === 'playing' ? (
        <View style={styles.battleActions}>
          <Tap
            label="Basic Attack"
            style={[styles.primary, isAttacking && styles.buttonDisabled]}
            disabled={isAttacking}
            onPress={onAttack}
          >
            <Text style={styles.primaryText}>
              {isAttacking ? 'Attacking...' : `⚔️ Basic Strike (${card.base_attack || 25} ATK)`}
            </Text>
          </Tap>
          <View style={styles.lockedAbilityNotice}>
            <Text style={styles.lockedAbilityNoticeText}>
              🔒 Special Abilities unlock in Iteration 2 via Species Quizzes!
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.battleOutcomeBox}>
          <Text style={styles.battleOutcomeTitle}>
            {battleOutcome === 'win' ? '🎉 VICTORY! (+50 XP)' : '💔 DEFEATED (+10 XP)'}
          </Text>
          <Text style={styles.battleOutcomeCopy}>
            {battleOutcome === 'win'
              ? 'Your wildlife card fought bravely and protected the rainforest!'
              : 'Good effort! Train your wildlife cards and try again!'}
          </Text>
          <Tap label="Battle Again" style={styles.primary} onPress={onBattleAgain}>
            <Text style={styles.primaryText}>🔄 Battle Again</Text>
          </Tap>
          <Tap label="Choose Another Card" style={styles.secondary} onPress={onSelectAnotherCard}>
            <Text style={styles.secondaryText}>Choose Another Card</Text>
          </Tap>
        </View>
      )}
    </ScrollView>
  );
}
