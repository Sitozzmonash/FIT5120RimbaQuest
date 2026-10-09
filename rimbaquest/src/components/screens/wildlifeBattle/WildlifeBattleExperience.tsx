import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useWildlifeMatch } from "../../../hooks/useWildlifeMatch";
import { useUnlockedBattleSpecies } from "../../../hooks/useUnlockedBattleSpecies";
import { imageFor } from "../../../constants/images";
import { useAbilityQuizStore } from "../../../store/useAbilityQuizStore";
import { useBattleInviteStore } from "../../../store/useBattleInviteStore";
import { useUserStore } from "../../../store/useUserStore";
import { WildlifeEvent } from "../../../types/wildlifeMatch";
import { GameScreenHeader } from "../../common/game/GameScreenHeader";
import { GAME_COLORS } from "../../common/game/gameTheme";
import { BattleArena } from "./arena/BattleArena";
import { buildMoves, energyRule, secondsLeft, turnLabel } from "./arena/battleMoves";
import { FriendsScreen, FriendsTab } from "./friends/FriendsScreen";
import { useAndroidBack, useBattleMusic, usePendingInvite, useRankBefore, useTicker } from "./hooks/battleHooks";
import { InvitePopup } from "./invites/InvitePopup";
import { BattleLobby } from "./lobby/BattleLobby";
import { GiveUpModal, MatchEndedModal, RecoveryModal } from "./modals/BattleModals";
import { CardPicker } from "./picker/CardPicker";
import { BattleResult } from "./result/BattleResult";
import { ErrorNote } from "./shared/ErrorNote";
import { BattleWaiting } from "./waiting/BattleWaiting";

const NO_EVENTS: WildlifeEvent[] = [];

export function WildlifeBattleExperience({ onBack }: { onBack: () => void }) {
  const battle = useWildlifeMatch();
  const species = useUnlockedBattleSpecies();
  const childId = useUserStore((state) => state.currentUser.id);
  const myAvatar = useUserStore((state) => state.currentUser.avatar);
  // Invitations put off with "Not Now" here or on any other screen.
  const dismissedInvites = useBattleInviteStore((state) => state.dismissed);
  const [view, setView] = useState<"lobby" | FriendsTab>("lobby");
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [editingWaitingCard, setEditingWaitingCard] = useState(false);
  // Last battle event the arena finished animating, so the final hit plays before the results.
  const [replayedEventId, setReplayedEventId] = useState<number | null>(null);

  const match = battle.match;
  const selecting = match?.status === "setup" || (match?.status === "waiting" && editingWaitingCard) || (!match && Boolean(battle.invite));
  const habitat = match && (match.status === "setup" || match.status === "waiting" && editingWaitingCard) ? match.habitat : battle.invite?.habitat;

  useEffect(() => setReplayedEventId(null), [match?.id]);
  // Preload every card's unlocked skills so the card picker shows locks instantly.
  useEffect(() => {
    void useAbilityQuizStore.getState().fetchAllProgression();
  }, []);

  const rankBefore = useRankBefore(match, battle.leaderboard, childId);
  usePendingInvite({ recovering: battle.recovering, busy: Boolean(match || battle.invite), previewInvite: battle.previewInvite });
  useTicker(match?.status === "active");
  
  const incomingCount = battle.friends?.incoming_invites.length;
  useEffect(() => {
    if (incomingCount !== undefined) useBattleInviteStore.getState().setIncomingCount(incomingCount);
  }, [incomingCount]);

  const cancelAndClear = useCallback(async () => {
    if (!match) {
      battle.clear();
      return;
    }
    const success = await battle.cancel();
    if (success) battle.clear();
  }, [match, battle.cancel, battle.clear]);

  // Back steps through the flow: arena -> give-up prompt, card picker -> lobby, lobby -> home.
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
    if (match?.status === "waiting" && editingWaitingCard) {
      setEditingWaitingCard(false);
      return;
    }
    if (match?.status === "setup" || match?.status === "waiting" || battle.invite) {
      void cancelAndClear();
      return;
    }
    if (match?.status === "completed" || match?.status === "expired" || match?.status === "canceled") {
      battle.clear();
      return;
    }
    if (!match && view !== "lobby") {
      setView("lobby");
      return;
    }
    onBack();
  }, [match, battle.pending, battle.invite, battle.clear, editingWaitingCard, cancelAndClear, leaveVisible, view, onBack]);
  useAndroidBack(handleBack);

  const confirmLeave = useCallback(async () => {
    const success = await battle.forfeit();
    if (success) {
      setLeaveVisible(false);
      onBack();
    }
  }, [battle.forfeit, onBack]);

  const mySide = match?.viewer_side ?? "player";
  const opponentSide = mySide === "player" ? "opponent" : "player";
  const myCard = match?.state?.[mySide];
  const opponentCard = match?.state?.[opponentSide];
  const battleEvents = match?.state?.events?.length ? match.state.events : match?.events;
  const myTurn = match?.status === "active" && match.state?.turn === mySide;
  const invitedFriend = battle.friends?.outgoing_invites.find((item) => item.match_id === match?.id);
  const incomingInvites = battle.friends?.incoming_invites ?? [];
  const avatarOf = (id: number) => battle.friends?.friends.find((friend) => friend.child_id === id)?.avatar;

  const latestEventId = Math.max(0, ...(battleEvents ?? []).map((event) => event.id ?? 0));
  const finishingReplay = match?.status === "completed" && replayedEventId !== null && latestEventId > replayedEventId;
  const inArena = Boolean((match?.status === "active" || finishingReplay) && myCard && opponentCard);
  useBattleMusic(inArena);

  if (inArena && match && myCard && opponentCard) {
    return (
      <View style={styles.root}>
        <BattleArena
          habitat={match.habitat}
          mySide={mySide}
          opponentTag={match.mode === "bot" ? "BOT" : "FRIEND"}
          myCard={myCard}
          opponentCard={opponentCard}
          events={battleEvents ?? NO_EVENTS}
          turnLabel={turnLabel(myTurn, match.mode, secondsLeft(match.deadline_at, battle.serverClock))}
          myTurn={myTurn}
          onReplayed={setReplayedEventId}
          moves={buildMoves(myCard, myTurn && !battle.pending)}
          onMove={(action) => void battle.act(action)}
          onLeave={handleBack}
          leaveDisabled={Boolean(battle.pending)}
          energyRule={energyRule(myCard.max_energy, match.mode)}
          error={leaveVisible ? null : battle.error}
          onRefresh={() => void battle.refreshMatch()}
        />
        <GiveUpModal
          visible={leaveVisible}
          mode={match.mode}
          leaving={battle.pending === "Leaving match"}
          error={battle.error}
          onConfirm={() => void confirmLeave()}
          onKeepPlaying={() => setLeaveVisible(false)}
        />
      </View>
    );
  }

  if (match?.status === "completed" && myCard && opponentCard) {
    const rematch = () => {
      const opponentId = match.opponent_child_id;
      const stillFriends = opponentId != null && battle.friends?.friends.some((friend) => friend.child_id === opponentId);
      battle.clear();
      // Friends get a fresh invite; a bot battle starts again; a code-only opponent goes back to the lobby.
      if (match.mode === "bot") void battle.start("bot");
      else if (stillFriends && opponentId != null) void battle.start("friend", opponentId);
    };
    return (
      <BattleResult
        match={match}
        myCard={myCard}
        opponentCard={opponentCard}
        events={battleEvents}
        childId={childId}
        leaderboard={battle.leaderboard}
        rankBefore={rankBefore}
        myAvatar={myAvatar}
        avatarOf={avatarOf}
        onRematch={rematch}
        onLeave={battle.clear}
      />
    );
  }

  if (selecting && habitat) {
    const hint = battle.invite?.host_display_name
      ? `Tap a card to see its skills, then use it to accept ${battle.invite.host_display_name}'s battle.`
      : invitedFriend
        ? `Tap a card to see its skills, then use it to battle ${invitedFriend.friend_display_name}. They get your invitation once you choose.`
        : undefined;
    return (
      <CardPicker
        key={`${match?.id ?? battle.invite?.code}-${editingWaitingCard}`}
        habitat={habitat}
        inviteCode={battle.invite?.code}
        hint={hint}
        species={species}
        cardOptions={battle.cardOptions}
        useLabel={battle.invite ? "Join Match" : editingWaitingCard ? "Switch Card" : "Use This Card"}
        onBack={handleBack}
        onUse={async (speciesId) => {
          if (battle.invite) return battle.joinInvite(speciesId);
          const success = await battle.selectCard(speciesId);
          if (success) setEditingWaitingCard(false);
          return success;
        }}
        onRetry={() => void battle.refreshCardOptions(match ? { matchId: match.id } : { code: battle.invite?.code })}
        pending={battle.pending === "Selecting card" || battle.pending === "Joining match"}
        error={battle.error}
      />
    );
  }

  if (match?.status === "waiting" && !editingWaitingCard) {
    const mySpecies = species.find((item) => item.id === match.my_species_id);
    return (
      <BattleWaiting
        match={match}
        invitedFriendName={invitedFriend?.friend_display_name}
        myCard={mySpecies ? { name: mySpecies.common_name, image: imageFor(mySpecies) } : null}
        pending={Boolean(battle.pending)}
        error={battle.error}
        onBack={handleBack}
        onChangeCard={() => {
          setEditingWaitingCard(true);
          void battle.refreshCardOptions({ matchId: match.id });
        }}
        onCancel={() => void cancelAndClear()}
      />
    );
  }

  // No match yet. Any unfinished-match lookup shows as a wood popup over this screen.
  const idle = !match && !battle.invite;
  const recoveryModal = (
    <RecoveryModal
      visible={idle && (battle.recovering || Boolean(battle.recoveryError))}
      recovering={battle.recovering}
      error={battle.recoveryError}
      onRetry={() => void battle.recoverCurrent()}
      onBack={onBack}
      onClose={handleBack}
    />
  );

  // A friend's newest invitation pops up over the lobby and Friends screens until accepted, declined or put off.
  const popupInvite = idle && !battle.recovering && !battle.recoveryError
    ? incomingInvites.find((item) => !dismissedInvites.includes(item.match_id)) ?? null
    : null;
  const invitePopup = (
    <InvitePopup
      invite={popupInvite}
      friendAvatar={popupInvite ? avatarOf(popupInvite.friend_child_id) : undefined}
      myAvatar={myAvatar}
      busy={Boolean(battle.pending)}
      onAccept={() => popupInvite && void battle.previewInvite(popupInvite.invite_code)}
      onNotNow={() => popupInvite && useBattleInviteStore.getState().dismiss(popupInvite.match_id)}
    />
  );

  if (idle && view === "lobby") {
    return (
      <>
        <BattleLobby
          onBack={handleBack}
          onPractice={() => void battle.start("bot")}
          onJoin={(code) => void battle.previewInvite(code)}
          onCreateCode={() => void battle.start("friend")}
          onOpenFriends={() => {
            setView("friends");
            void battle.refreshFriends();
          }}
          onOpenLeaderboard={() => {
            setView("leaderboard");
            void battle.refreshLeaderboard();
          }}
          friends={battle.friends?.friends ?? null}
          onInviteFriend={(friend) => void battle.start("friend", friend.child_id)}
          inviteCount={incomingInvites.length}
          leaderboard={battle.leaderboard}
          childId={childId}
          restCards={battle.restCards}
          pending={battle.pending}
          error={battle.error}
        />
        {recoveryModal}
        {invitePopup}
      </>
    );
  }

  if (idle && view !== "lobby") {
    return (
      <>
        <FriendsScreen
          tab={view}
          onTabChange={setView}
          onBack={handleBack}
          friends={battle.friends}
          friendsError={battle.friendsError}
          leaderboard={battle.leaderboard}
          leaderboardError={battle.leaderboardError}
          childId={childId}
          myAvatar={myAvatar}
          busy={Boolean(battle.pending)}
          onAdd={battle.addFriend}
          onInvite={(friend) => void battle.start("friend", friend.child_id)}
          onAcceptInvite={(invite) => void battle.previewInvite(invite.invite_code)}
          onDeclineInvite={(invite) => void battle.declineInvite(invite.match_id)}
          onRefresh={async () => {
            await Promise.all([battle.refreshFriends(), battle.refreshLeaderboard()]);
          }}
        />
        {recoveryModal}
        {invitePopup}
      </>
    );
  }

  // The host's invite expired or was canceled (or something else went wrong): explain and start over.
  const ended = match?.status === "expired" || match?.status === "canceled" ? match.status : null;
  return (
    <View style={styles.root}>
      <GameScreenHeader title="Card Battle" onBack={handleBack} disabled={Boolean(battle.pending)} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {battle.error && !ended ? <ErrorNote message={battle.error} /> : null}
      </ScrollView>
      <MatchEndedModal status={ended} onNewMatch={battle.clear} />
      {recoveryModal}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GAME_COLORS.headerGreen },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 16, paddingVertical: 18, paddingBottom: 40, gap: 14 },
});
