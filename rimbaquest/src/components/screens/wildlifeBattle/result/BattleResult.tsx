import React, { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../../constants/fonts";
import {
  GAME_COLORS,
  outlinedTitleStyle,
} from "../../../common/game/gameTheme";
import { SpinningRays } from "../../../common/game/SpinningRays";
import {
  WildlifeCombatant,
  WildlifeEvent,
  WildlifeLeaderboardEntry,
  WildlifeMatch,
} from "../../../../types/wildlifeMatch";
import { playDefeatSound } from "../arena/fx/BattleSFX";
import { friendlyHabitat } from "../shared/battleText";
import { LeaderboardRow } from "../shared/LeaderboardRow";
import { BattleRecap } from "./BattleRecap";
import { FinalCards } from "./FinalCards";
import { HabitatTip } from "./HabitatTip";
import { ResultActions } from "./ResultActions";
import { ResultTiles } from "./ResultTiles";

const INK = GAME_COLORS.ink;

function ResultHeader({ won, lost }: { won: boolean; lost: boolean }) {
  const title = won ? "Victory!" : lost ? "Defeat" : "Draw";
  const ribbon = won
    ? "Great job, Explorer!"
    : lost
      ? "Good try, Explorer!"
      : "So close, Explorer!";
  return (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.ribbon}>
        <Text style={styles.ribbonText}>{ribbon}</Text>
      </View>
    </View>
  );
}

export function BattleResult({
  match,
  myCard,
  opponentCard,
  events,
  childId,
  leaderboard,
  rankBefore,
  myAvatar,
  avatarOf,
  onRematch,
  onLeave,
}: {
  match: WildlifeMatch;
  myCard: WildlifeCombatant;
  opponentCard: WildlifeCombatant;
  events: WildlifeEvent[] | undefined;
  childId: number;
  leaderboard: WildlifeLeaderboardEntry[] | null;
  /** The explorer's rank when the battle started, to show the change. */
  rankBefore: number | null;
  myAvatar: string;
  avatarOf: (childId: number) => string | undefined;
  onRematch: () => void;
  onLeave: () => void;
}) {
  const insets = useSafeAreaInsets();
  const winner = match.state?.winner ?? null;
  const won = winner === match.viewer_side;
  const lost = Boolean(winner) && !won;
  const friend = match.mode === "friend";

  // Once per result screen: a playful fail sound on a loss.
  useEffect(() => {
    if (lost) playDefeatSound();
  }, [lost, match.id]);

  const me = leaderboard?.find((entry) => entry.child_id === childId);
  const rankLine = !me
    ? "Updating rank…"
    : rankBefore && rankBefore !== me.rank
      ? `#${rankBefore} → #${me.rank}`
      : `#${me.rank} on your board`;

  return (
    <View style={styles.root}>
      {won ? (
        <View style={styles.raysWrap} pointerEvents="none">
          <SpinningRays style={styles.rays} />
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ResultHeader won={won} lost={lost} />
        <FinalCards
          myCard={myCard}
          opponentCard={opponentCard}
          opponentTag={friend ? "FRIEND" : "BOT"}
          won={won}
          lost={lost}
        />
        <ResultTiles
          friend={friend}
          delta={match.leaderboard_delta}
          rankLine={rankLine}
          cardName={myCard.name}
        />
        {!myCard.habitat_advantage ? (
          <HabitatTip habitat={friendlyHabitat(match.habitat)} />
        ) : null}
        <BattleRecap match={match} events={events ?? []} />

        {friend ? (
          <View style={styles.board}>
            <Text style={styles.boardKicker}>FRIENDS LEADERBOARD</Text>
            {leaderboard === null ? (
              <ActivityIndicator color={GAME_COLORS.goldLight} />
            ) : (
              leaderboard.map((entry) => {
                const mine = entry.child_id === childId;
                return (
                  <LeaderboardRow
                    key={entry.child_id}
                    entry={entry}
                    mine={mine}
                    avatar={mine ? myAvatar : avatarOf(entry.child_id)}
                    paper
                  />
                );
              })
            )}
          </View>
        ) : null}
      </ScrollView>

      <ResultActions
        bottomInset={insets.bottom}
        onLeave={onLeave}
        onRematch={onRematch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GAME_COLORS.headerGreen,
    overflow: "hidden",
  },
  raysWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  rays: { marginTop: -300 },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
  },
  header: { alignItems: "center", gap: 8 },
  title: {
    ...outlinedTitleStyle,
    textShadowColor: INK,
    fontSize: 44,
    lineHeight: 48,
    textAlign: "center",
  },
  ribbon: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: "#FFB938",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 12,
    boxShadow: `0px 4px 0px ${INK}`,
  },
  ribbonText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: "#FFFFFF",
    textShadowColor: "#7A3500",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  board: { gap: 6 },
  boardKicker: {
    marginBottom: 2,
    fontFamily: FONTS.bodyBlack,
    fontSize: 11,
    letterSpacing: 1.5,
    color: "#9BE07A",
  },
});
