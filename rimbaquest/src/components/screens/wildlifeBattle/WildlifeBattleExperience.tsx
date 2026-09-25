import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ImageStyle,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { imageFor } from "../../../constants/images";
import { monotonicNow, useWildlifeMatch } from "../../../hooks/useWildlifeMatch";
import type { WildlifeServerClock } from "../../../hooks/useWildlifeMatch";
import { useUnlockedBattleSpecies } from "../../../hooks/useUnlockedBattleSpecies";
import { useUserStore } from "../../../store/useUserStore";
import { Species } from "../../../types";
import {
  WildlifeAction,
  WildlifeCardOption,
  WildlifeCombatant,
  WildlifeEvent,
  WildlifeLeaderboardEntry,
  WildlifeMatch,
} from "../../../types/wildlifeMatch";
import { PrimaryButton } from "../../common/PrimaryButton";
import { Tap } from "../../common/Tap";

const ACTIONS: Array<{ action: WildlifeAction; slot?: number; cost: number; fallback: string }> = [
  { action: "basic", cost: 0, fallback: "Basic Attack" },
  { action: "ability_1", slot: 1, cost: 1, fallback: "Skill 1" },
  { action: "ability_2", slot: 2, cost: 2, fallback: "Skill 2" },
  { action: "ability_3", slot: 3, cost: 4, fallback: "Skill 3" },
];

function friendlyHabitat(habitat: string): string {
  return habitat.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function secondsLeft(deadline: string | null | undefined, clock: WildlifeServerClock | null): number | null {
  if (!deadline || !clock) return null;
  const end = Date.parse(deadline);
  if (Number.isNaN(end)) return null;
  const serverNow = clock.serverEpochMs + Math.max(0, monotonicNow() - clock.receivedMonotonicMs);
  return Math.max(0, Math.ceil((end - serverNow) / 1000));
}

function recentEvents(events?: WildlifeEvent[]): WildlifeEvent[] {
  const seen = new Set<number>();
  return (events ?? []).filter((event) => {
    if (event.id === undefined) return true;
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  }).slice(-6).reverse();
}

function InfoButton({ label, onPress, disabled = false }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Tap label={label} onPress={onPress} disabled={disabled} style={[styles.outlineButton, disabled && styles.disabled]}>
      <Text style={styles.outlineButtonText}>{label}</Text>
    </Tap>
  );
}

function HabitatPanel({ habitat }: { habitat: string }) {
  return (
    <View style={styles.habitatPanel}>
      <MaterialIcons name="landscape" size={27} color="#176B40" />
      <View style={styles.flex}>
        <Text style={styles.eyebrow}>RANDOM BATTLE HABITAT</Text>
        <Text style={styles.habitatTitle}>{friendlyHabitat(habitat)}</Text>
        <Text style={styles.smallText}>Matching cards get +20% Attack and Defence. The server applies the bonus.</Text>
      </View>
    </View>
  );
}

function CardChoice({ species, option, selected, onPress }: {
  species: Species;
  option: WildlifeCardOption;
  selected: boolean;
  onPress: () => void;
}) {
  const picture = imageFor(species);
  const rest = Math.max(0, option.rest_remaining);
  const restUnit = rest === 1 ? "battle" : "battles";
  return (
    <Tap
      label={`${species.common_name}. ${option.habitat_match ? "Habitat match, 20 percent Attack and Defence bonus" : "No habitat bonus"}. ${rest ? `Resting for ${rest} more completed ${restUnit}` : "Ready"}.`}
      onPress={onPress}
      disabled={!option.selectable}
      style={[styles.cardChoice, selected && styles.cardChoiceSelected, !option.selectable && styles.disabled]}
    >
      {picture ? <Image source={picture} style={styles.cardImage as ImageStyle} resizeMode="cover" /> : <View style={styles.cardImagePlaceholder}><MaterialIcons name="pets" size={30} color="#58826A" /></View>}
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{species.common_name}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{species.habitat || "Habitat unknown"}</Text>
        <Text style={[styles.cardBadge, option.habitat_match && styles.matchBadge]}>
          {option.habitat_match ? "+20% Attack & Defence" : "No habitat boost"}
        </Text>
        <Text style={[styles.restBadge, rest > 0 && styles.restingBadge]}>
          {rest > 0 ? `Resting · ${rest} ${restUnit} left` : option.selectable ? "Ready to battle" : "Unavailable"}
        </Text>
      </View>
    </Tap>
  );
}

function CombatantPanel({ combatant, label }: { combatant: WildlifeCombatant; label: string }) {
  return (
    <View style={styles.combatantPanel}>
      <Text style={styles.eyebrow}>{label}</Text>
      <Text style={styles.combatantName}>{combatant.name}</Text>
      <Text style={styles.hpText}>HP {combatant.hp} / {combatant.max_hp}</Text>
      <Text style={styles.energyText}>⚡ Energy {combatant.energy} / {combatant.max_energy}</Text>
      {combatant.shield ? <Text style={styles.smallText}>Shield {combatant.shield}</Text> : null}
      {combatant.habitat_advantage ? <Text style={styles.advantageText}>Habitat bonus active · +20% Attack & Defence</Text> : null}
    </View>
  );
}

function Leaderboard({ entries, childId, error, onRetry }: {
  entries: WildlifeLeaderboardEntry[] | null;
  childId: number;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Friend leaderboard</Text>
        <Tap label="Refresh leaderboard" onPress={onRetry}><MaterialIcons name="refresh" size={21} color="#176B40" /></Tap>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {entries === null ? <ActivityIndicator color="#176B40" /> : entries.length === 0 ? (
        <Text style={styles.mutedText}>No ranked friend battles yet.</Text>
      ) : entries.map((entry) => (
        <View key={entry.child_id} style={[styles.leaderboardRow, entry.child_id === childId && styles.myLeaderboardRow]}>
          <Text style={styles.rankText}>#{entry.rank}</Text>
          <Text style={styles.leaderboardName} numberOfLines={1}>{entry.display_name}{entry.child_id === childId ? " (you)" : ""}</Text>
          <Text style={styles.pointsText}>{entry.points} pts</Text>
        </View>
      ))}
    </View>
  );
}

export function WildlifeBattleExperience({ onBack }: { onBack: () => void }) {
  const battle = useWildlifeMatch();
  const species = useUnlockedBattleSpecies();
  const restingCards = battle.restCards?.filter((card) => card.remaining > 0);
  const childId = useUserStore((state) => state.currentUser.id);
  const [inviteCode, setInviteCode] = useState("");
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [editingWaitingCard, setEditingWaitingCard] = useState(false);
  const [, setClockTick] = useState(0);

  const match = battle.match;
  const selecting = match?.status === "setup" || (match?.status === "waiting" && editingWaitingCard) || (!match && Boolean(battle.invite));
  const habitat = match && (match.status === "setup" || match.status === "waiting" && editingWaitingCard) ? match.habitat : battle.invite?.habitat;
  const selectedSpecies = useMemo(() => species.find((item) => item.id === selectedSpeciesId), [species, selectedSpeciesId]);
  const selectedOption = battle.cardOptions?.find((item) => item.species_id === selectedSpeciesId);

  useEffect(() => setSelectedSpeciesId(null), [match?.id, battle.invite?.code, editingWaitingCard]);

  useEffect(() => {
    if (match?.status !== "active") return;
    const timer = setInterval(() => setClockTick((tick) => tick + 1), 500);
    return () => clearInterval(timer);
  }, [match?.status]);

  const handleBack = useCallback(() => {
    if (battle.pending) return;
    if (leaveVisible) {
      setLeaveVisible(false);
      return;
    }
    if (match?.status === "active") {
      setLeaveVisible(true);
      return;
    }
    if (match?.status === "setup" || match?.status === "waiting") {
      void battle.cancel().then((success) => { if (success) onBack(); });
      return;
    }
    onBack();
  }, [match?.status, battle.pending, battle.cancel, leaveVisible, onBack]);

  const cancelAndClear = useCallback(async () => {
    if (!match) {
      battle.clear();
      return;
    }
    const success = await battle.cancel();
    if (success) battle.clear();
  }, [match, battle.cancel, battle.clear]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]);

  const confirmLeave = useCallback(async () => {
    const success = await battle.forfeit();
    if (success) {
      setLeaveVisible(false);
      onBack();
    }
  }, [battle.forfeit, onBack]);

  const cardOptionById = useMemo(() => new Map((battle.cardOptions ?? []).map((option) => [option.species_id, option])), [battle.cardOptions]);
  const availableSpecies = useMemo(() => species.filter((item) => cardOptionById.has(item.id)), [species, cardOptionById]);
  const mySide = match?.viewer_side ?? "player";
  const opponentSide = mySide === "player" ? "opponent" : "player";
  const myCard = match?.state?.[mySide];
  const opponentCard = match?.state?.[opponentSide];
  const battleEvents = match?.state?.events?.length ? match.state.events : match?.events;
  const myTurn = match?.status === "active" && match.state?.turn === mySide;
  const countdown = secondsLeft(match?.deadline_at, battle.serverClock);
  const canAct = myTurn && !battle.pending;

  const actionButtons = myCard ? ACTIONS.map((entry) => {
    const skill = entry.slot === undefined ? undefined : myCard.abilities?.find((ability) => ability.slot === entry.slot);
    const cost = skill?.cost ?? entry.cost;
    const unlocked = entry.slot === undefined || Boolean(skill?.unlocked);
    const affordable = myCard.energy >= cost;
    const enabled = Boolean(canAct && unlocked && affordable);
    const name = entry.slot === undefined ? entry.fallback : skill?.name || entry.fallback;
    const note = !unlocked ? "Locked · pass its quiz" : !affordable ? "Not enough Energy" : entry.slot === undefined ? "Always available" : skill?.description || "Ready";
    return (
      <Tap
        key={entry.action}
        label={`${name}, ${cost} Energy. ${note}`}
        disabled={!enabled}
        onPress={() => void battle.act(entry.action)}
        style={[styles.actionButton, !enabled && styles.disabled]}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.actionName}>{name}</Text>
          <Text style={styles.actionCost}>{cost} ⚡</Text>
        </View>
        <Text style={styles.actionNote}>{note}</Text>
      </Tap>
    );
  }) : null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Tap label="Back from wildlife battle" onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={27} color="#1E4930" />
        </Tap>
        <View style={styles.flex}>
          <Text style={styles.headerTitle}>Wildlife Card Battle</Text>
          <Text style={styles.headerSubtitle}>See the habitat, then choose your card.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {battle.error ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorText}>{battle.error}</Text>
            {match?.status === "active" || match?.status === "waiting" ? (
              <InfoButton label="Refresh match" onPress={() => void battle.refreshMatch()} disabled={Boolean(battle.pending)} />
            ) : null}
          </View>
        ) : null}

        {!match && !battle.invite && (battle.recovering || battle.recoveryError) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checking for your current match</Text>
            {battle.recovering ? <ActivityIndicator color="#176B40" /> : null}
            {battle.recoveryError ? (
              <>
                <Text style={styles.errorText}>{battle.recoveryError}</Text>
                <InfoButton label="Retry match recovery" onPress={() => void battle.recoverCurrent()} />
              </>
            ) : <Text style={styles.smallText}>Your unfinished battle will reopen here.</Text>}
          </View>
        ) : null}

        {!match && !battle.invite && !battle.recovering && !battle.recoveryError ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Choose your challenge</Text>
              <Text style={styles.heroText}>The habitat is picked at random before you choose a card. Matching habitat gives your card +20% Attack and Defence.</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Play a new match</Text>
              <Text style={styles.smallText}>A completed match makes its card rest for your next two battles.</Text>
              <PrimaryButton label="Practice against a bot" icon="smart-toy" onPress={() => void battle.start("bot")} disabled={Boolean(battle.pending)} loading={battle.pending === "Creating match"} />
              <PrimaryButton label="Challenge a friend" icon="people" onPress={() => void battle.start("friend")} disabled={Boolean(battle.pending)} />
              <Text style={styles.mutedText}>Bot practice does not change leaderboard points. Friend wins earn +5; losses cost 3.</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Join a friend's match</Text>
              <TextInput
                style={styles.inviteInput}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Enter invitation code"
                placeholderTextColor="#85988B"
                accessibilityLabel="Invitation code"
                maxLength={32}
              />
              <InfoButton label="Preview invitation" onPress={() => void battle.previewInvite(inviteCode)} disabled={!inviteCode.trim() || Boolean(battle.pending)} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Card recovery</Text>
              {battle.restCards === null ? <Text style={styles.mutedText}>{battle.restError ?? "Loading card recovery…"}</Text> : restingCards?.length ? restingCards.map((card) => {
                const item = species.find((candidate) => candidate.id === card.species_id);
                return <Text key={card.species_id} style={styles.smallText}>{item?.common_name ?? card.species_id}: {card.remaining} completed {card.remaining === 1 ? "battle" : "battles"} left</Text>;
              }) : <Text style={styles.smallText}>All your cards are ready.</Text>}
              {battle.restError ? <InfoButton label="Retry card recovery" onPress={() => void battle.refreshRest()} /> : null}
            </View>
            <Leaderboard entries={battle.leaderboard} childId={childId} error={battle.leaderboardError} onRetry={() => void battle.refreshLeaderboard()} />
          </>
        ) : null}

        {selecting && habitat ? (
          <>
            <HabitatPanel habitat={habitat} />
            {battle.invite ? <Text style={styles.sectionIntro}>Join code {battle.invite.code}. Pick one ready card to enter your friend's match.</Text> : (
              <Text style={styles.sectionIntro}>Pick one ready card. Your opponent will only see your choice when the match begins.</Text>
            )}
            <View style={styles.section}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Your wildlife cards</Text>
                <Tap label="Refresh available cards" onPress={() => void battle.refreshCardOptions(match ? { matchId: match.id } : { code: battle.invite?.code })}>
                  <MaterialIcons name="refresh" size={21} color="#176B40" />
                </Tap>
              </View>
              {battle.cardOptions === null ? <ActivityIndicator color="#176B40" /> : availableSpecies.length === 0 ? (
                <Text style={styles.mutedText}>No unlocked cards are available. Discover an animal and pass its card quiz to grow your collection.</Text>
              ) : (
                <View style={styles.cardGrid}>
                  {availableSpecies.map((item) => {
                    const option = cardOptionById.get(item.id)!;
                    return <CardChoice key={item.id} species={item} option={option} selected={selectedSpeciesId === item.id} onPress={() => setSelectedSpeciesId(item.id)} />;
                  })}
                </View>
              )}
              {selectedSpecies && selectedOption?.selectable ? (
                <View style={styles.selectedPanel}>
                  <Text style={styles.selectedTitle}>{selectedSpecies.common_name} is ready</Text>
                  <Text style={styles.smallText}>Basic Attack · 0 ⚡</Text>
                  <Text style={styles.smallText}>{selectedSpecies.ability_1 || selectedSpecies.abilities?.find((ability) => ability.slot === 1)?.name || "Skill 1"} · 1 ⚡</Text>
                  <Text style={styles.smallText}>{selectedSpecies.ability_2 || selectedSpecies.abilities?.find((ability) => ability.slot === 2)?.name || "Skill 2"} · 2 ⚡</Text>
                  <Text style={styles.smallText}>{selectedSpecies.ability_3 || selectedSpecies.passive?.name || "Skill 3"} · 4 ⚡ (active in this mode)</Text>
                  <Text style={styles.mutedText}>The battle will show which skills you have unlocked.</Text>
                </View>
              ) : null}
              <PrimaryButton
                label={battle.invite ? "Join with this card" : editingWaitingCard ? "Switch to this card" : "Choose this card"}
                onPress={() => {
                  if (!selectedSpeciesId) return;
                  if (battle.invite) void battle.joinInvite(selectedSpeciesId);
                  else void battle.selectCard(selectedSpeciesId).then((success) => { if (success) setEditingWaitingCard(false); });
                }}
                disabled={!selectedSpeciesId || !selectedOption?.selectable || !battle.cardOptions || Boolean(battle.pending)}
                loading={battle.pending === "Selecting card" || battle.pending === "Joining match"}
              />
              <InfoButton
                label={editingWaitingCard ? "Keep current card" : "Choose another mode"}
                onPress={editingWaitingCard ? () => setEditingWaitingCard(false) : () => void cancelAndClear()}
                disabled={Boolean(battle.pending)}
              />
            </View>
          </>
        ) : null}

        {match?.status === "waiting" && !editingWaitingCard ? (
          <>
            <HabitatPanel habitat={match.habitat} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Waiting for your friend</Text>
              <Text style={styles.smallText}>Give your friend this invitation code. The match starts when they choose a card.</Text>
              <Text selectable style={styles.inviteCode} accessibilityLabel={`Invitation code ${match.invite_code ?? ""}`}>{match.invite_code ?? "—"}</Text>
              <Text style={styles.mutedText}>This screen checks for your friend automatically.</Text>
              <InfoButton label="Check for friend now" onPress={() => void battle.refreshMatch()} disabled={Boolean(battle.pending)} />
              <InfoButton label="Change your card" onPress={() => {
                setEditingWaitingCard(true);
                void battle.refreshCardOptions({ matchId: match.id });
              }} disabled={Boolean(battle.pending)} />
              <InfoButton label="Cancel invitation" onPress={() => void cancelAndClear()} disabled={Boolean(battle.pending)} />
            </View>
          </>
        ) : null}

        {match?.status === "active" && myCard && opponentCard ? (
          <>
            <HabitatPanel habitat={match.habitat} />
            <View style={styles.combatantRow}>
              <CombatantPanel combatant={myCard} label="YOUR CARD" />
              <CombatantPanel combatant={opponentCard} label={match.mode === "bot" ? "BOT CARD" : "FRIEND'S CARD"} />
            </View>
            <View style={styles.turnPanel}>
              <Text style={styles.turnTitle}>{myTurn ? "Your turn" : "Waiting for opponent"}</Text>
              {match.mode === "friend" ? (
                <Text style={styles.turnTimer} accessibilityLabel={`${countdown ?? "unknown"} seconds left in turn`}>
                  {countdown === null ? "Timer syncing…" : countdown === 0 ? "Deadline reached · server checking…" : `${countdown}s left`}
                </Text>
              ) : null}
              <Text style={styles.smallText}>One action per turn. Basic Attack costs 0; unlocked skills cost 1, 2, or 4 Energy. A successful turn restores 2 Energy, up to 8. A timed-out turn is skipped with no recharge.</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose an action</Text>
              <View style={styles.actionGrid}>{actionButtons}</View>
              {battle.pending === "Playing turn" ? <ActivityIndicator color="#176B40" /> : null}
            </View>
            {battleEvents?.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Battle log</Text>
                {recentEvents(battleEvents).map((event, index) => <Text key={event.id ?? `${match.version}-${index}`} style={styles.logText}>{event.message}</Text>)}
              </View>
            ) : null}
          </>
        ) : null}

        {match?.status === "completed" ? (
          <>
            <View style={styles.resultPanel}>
              <Text style={styles.resultTitle}>{match.state?.winner === match.viewer_side ? "Victory!" : match.state?.winner ? "Match complete" : "Draw"}</Text>
              <Text style={styles.resultText}>{match.state?.winner === match.viewer_side ? "Your wildlife card won." : match.state?.winner ? "Your opponent won this time." : "Neither card won."}</Text>
              <Text style={styles.resultText}>{match.mode === "bot" ? "Bot practice · no leaderboard change" : `Friend leaderboard: ${typeof match.leaderboard_delta === "number" ? `${match.leaderboard_delta >= 0 ? "+" : ""}${match.leaderboard_delta} points` : "updating…"}`}</Text>
              <Text style={styles.smallText}>The card used in this match rests for your next two completed battles.</Text>
            </View>
            {battleEvents?.length ? <View style={styles.section}><Text style={styles.sectionTitle}>Final battle log</Text>{recentEvents(battleEvents).map((event, index) => <Text key={event.id ?? `${match.version}-${index}`} style={styles.logText}>{event.message}</Text>)}</View> : null}
            <Leaderboard entries={battle.leaderboard} childId={childId} error={battle.leaderboardError} onRetry={() => void battle.refreshLeaderboard()} />
            <PrimaryButton label="Play another match" icon="replay" onPress={battle.clear} />
            <InfoButton label="Leave battles" onPress={onBack} />
          </>
        ) : null}

        {match?.status === "expired" || match?.status === "canceled" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{match.status === "expired" ? "Invitation expired" : "Match canceled"}</Text>
            <Text style={styles.smallText}>Start a new match to get a fresh code.</Text>
            <PrimaryButton label="New match" onPress={battle.clear} />
          </View>
        ) : null}
      </ScrollView>

      {leaveVisible ? (
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Leave this match?</Text>
            <Text style={styles.smallText}>
              {match?.mode === "bot"
                ? "Bot practice ends as a loss, and your card will rest for two completed battles."
                : "Leaving now counts as a loss. Your friend will see the result."}
            </Text>
            <PrimaryButton label="Forfeit and leave" onPress={() => void confirmLeave()} loading={battle.pending === "Leaving match"} disabled={Boolean(battle.pending)} />
            <InfoButton label="Keep playing" onPress={() => setLeaveVisible(false)} disabled={Boolean(battle.pending)} />
            {battle.error ? <Text style={styles.errorText}>{battle.error}</Text> : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F8F3" },
  flex: { flex: 1 },
  header: { backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#DDE9E0", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#E9F4EC" },
  headerTitle: { color: "#153D27", fontSize: 18, fontWeight: "900" },
  headerSubtitle: { color: "#617266", fontSize: 11, marginTop: 2 },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 16, paddingVertical: 18, paddingBottom: 40, gap: 14 },
  hero: { backgroundColor: "#174A2D", borderRadius: 20, padding: 20, gap: 8 },
  heroTitle: { color: "#FFFFFF", fontSize: 23, fontWeight: "900" },
  heroText: { color: "#E5F5E8", fontSize: 13, lineHeight: 19 },
  section: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E0EBE3", borderRadius: 18, padding: 16, gap: 11 },
  sectionTitle: { color: "#193D29", fontSize: 17, fontWeight: "800" },
  sectionIntro: { color: "#516E58", fontSize: 13, lineHeight: 19, paddingHorizontal: 2 },
  smallText: { color: "#4D6554", fontSize: 12, lineHeight: 18 },
  mutedText: { color: "#78877C", fontSize: 11, lineHeight: 16 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  outlineButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: "#9BC6A5", paddingHorizontal: 14, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  outlineButtonText: { color: "#176B40", fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  inviteInput: { height: 48, borderRadius: 11, borderWidth: 1, borderColor: "#B8CEBE", paddingHorizontal: 13, color: "#193D29", backgroundColor: "#F9FCFA", fontSize: 15, letterSpacing: 1 },
  inviteCode: { color: "#145932", fontSize: 28, fontWeight: "900", textAlign: "center", letterSpacing: 5, paddingVertical: 13, backgroundColor: "#EAF6ED", borderRadius: 12 },
  habitatPanel: { backgroundColor: "#E8F5E9", borderRadius: 18, borderWidth: 1, borderColor: "#BCE4C6", padding: 15, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  eyebrow: { color: "#4D7757", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  habitatTitle: { color: "#184C2C", fontSize: 19, fontWeight: "900", marginBottom: 3 },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardChoice: { width: "48%", minWidth: 142, borderWidth: 1.5, borderColor: "#E0EAE2", borderRadius: 15, overflow: "hidden", backgroundColor: "#FFFFFF" },
  cardChoiceSelected: { borderColor: "#0D984A", backgroundColor: "#F4FCF5" },
  cardImage: { width: "100%", height: 98, backgroundColor: "#EAF2EB" },
  cardImagePlaceholder: { width: "100%", height: 98, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF2EB" },
  cardBody: { padding: 10, gap: 4 },
  cardName: { color: "#173F29", fontWeight: "900", fontSize: 13 },
  cardMeta: { color: "#748077", fontSize: 10 },
  cardBadge: { color: "#65766A", fontSize: 10, fontWeight: "800" },
  matchBadge: { color: "#087D3D" },
  restBadge: { color: "#20834A", fontSize: 10, fontWeight: "800" },
  restingBadge: { color: "#A46222" },
  selectedPanel: { padding: 12, borderWidth: 1, borderColor: "#BCE4C6", borderRadius: 12, backgroundColor: "#F3FCF5", gap: 3 },
  selectedTitle: { color: "#174A2D", fontSize: 14, fontWeight: "900" },
  combatantRow: { flexDirection: "row", gap: 10 },
  combatantPanel: { flex: 1, padding: 12, borderRadius: 15, borderWidth: 1, borderColor: "#D9E8DD", backgroundColor: "#FFFFFF", gap: 4 },
  combatantName: { color: "#183E29", fontSize: 15, fontWeight: "900" },
  hpText: { color: "#B23735", fontSize: 13, fontWeight: "800" },
  energyText: { color: "#B57711", fontSize: 12, fontWeight: "800" },
  advantageText: { color: "#138042", fontSize: 10, fontWeight: "800", lineHeight: 15 },
  turnPanel: { padding: 15, borderWidth: 1, borderColor: "#BCE4C6", borderRadius: 15, backgroundColor: "#ECF8EF", gap: 5 },
  turnTitle: { color: "#154C2C", fontSize: 19, fontWeight: "900" },
  turnTimer: { color: "#975912", fontSize: 14, fontWeight: "900" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  actionButton: { width: "48%", minWidth: 140, minHeight: 82, borderRadius: 13, borderWidth: 1, borderColor: "#B4D6BD", backgroundColor: "#F2FBF5", padding: 11, gap: 7 },
  actionName: { color: "#174A2D", fontWeight: "900", fontSize: 12, flex: 1 },
  actionCost: { color: "#A56817", fontWeight: "900", fontSize: 11 },
  actionNote: { color: "#66796C", fontSize: 10, lineHeight: 14 },
  logText: { color: "#50645A", fontSize: 11, lineHeight: 16, borderBottomWidth: 1, borderBottomColor: "#EDF2EE", paddingVertical: 4 },
  resultPanel: { backgroundColor: "#E7F7E9", borderWidth: 1, borderColor: "#B5E1BF", borderRadius: 18, padding: 18, gap: 9 },
  resultTitle: { color: "#14552F", fontSize: 25, fontWeight: "900" },
  resultText: { color: "#245B38", fontSize: 14, fontWeight: "700" },
  leaderboardRow: { flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: "#EEF3EF", paddingVertical: 7 },
  myLeaderboardRow: { backgroundColor: "#F1F9F3" },
  rankText: { width: 38, color: "#176B40", fontSize: 12, fontWeight: "900" },
  leaderboardName: { color: "#3D5744", fontSize: 12, flex: 1 },
  pointsText: { color: "#1C6D3A", fontSize: 12, fontWeight: "900" },
  errorPanel: { backgroundColor: "#FFF0E9", borderRadius: 12, padding: 12, gap: 8 },
  errorText: { color: "#A13D25", fontSize: 12, lineHeight: 17 },
  modalScrim: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(13, 28, 18, 0.65)", alignItems: "center", justifyContent: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 420, borderRadius: 18, backgroundColor: "#FFFFFF", padding: 20, gap: 12 },
});
