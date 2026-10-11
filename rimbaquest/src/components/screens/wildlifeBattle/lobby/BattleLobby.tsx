import React, { useState } from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GameScreenHeader } from "../../../common/game/GameScreenHeader";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import {
  WildlifeFriend,
  WildlifeLeaderboardEntry,
  WildlifeRestCard,
} from "../../../../types/wildlifeMatch";
import { formatPoints } from "../shared/LeaderboardRow";
import { ChooseBattleSheet } from "./chooseBattle/ChooseBattleSheet";
import { DeckCard } from "./DeckCard";
import { LobbyHero } from "./LobbyHero";
import { LobbyTile } from "./LobbyTile";

const INK = GAME_COLORS.ink;

function friendsSubtitle(
  friends: WildlifeFriend[] | null,
  inviteCount: number,
): string {
  if (inviteCount > 0)
    return `${inviteCount} ${inviteCount === 1 ? "invite" : "invites"} waiting!`;
  if (!friends) return "Loading…";
  if (friends.length === 0) return "0 friends · add some!";
  return `${friends.length} ${friends.length === 1 ? "friend" : "friends"}`;
}

function leaderboardSubtitle(
  leaderboard: WildlifeLeaderboardEntry[] | null,
  childId: number | null | undefined,
): string {
  const me = leaderboard?.find((entry) => entry.child_id === childId);
  if (me) return `You're #${me.rank} · ${formatPoints(me.points)}`;
  return leaderboard ? "See your rank" : "Loading…";
}

export function BattleLobby({
  onBack,
  onPractice,
  onJoin,
  onCreateCode,
  onOpenFriends,
  onOpenLeaderboard,
  friends,
  onInviteFriend,
  inviteCount = 0,
  leaderboard,
  childId,
  restCards,
  pending,
  error,
}: {
  onBack: () => void;
  onPractice: () => void;
  onJoin: (code: string) => void;
  onCreateCode: () => void;
  onOpenFriends: () => void;
  onOpenLeaderboard: () => void;
  friends: WildlifeFriend[] | null;
  onInviteFriend: (friend: WildlifeFriend) => void;
  inviteCount?: number;
  leaderboard: WildlifeLeaderboardEntry[] | null;
  childId: number | null | undefined;
  restCards: WildlifeRestCard[] | null;
  pending: string | null;
  error: string | null;
}) {
  const [chooseVisible, setChooseVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <GameScreenHeader title="Card Battle" guide="battle" onBack={onBack} />
      <View style={[styles.content, { paddingBottom: 16 + insets.bottom }]}>
        <LobbyHero />

        <ScaleTap
          label="Enter Battle"
          onPress={() => setChooseVisible(true)}
          style={styles.enterButton}
        >
          <Image
            source={BATTLE_IMAGES.swords}
            style={styles.enterIcon as ImageStyle}
            resizeMode="contain"
          />
          <Text style={styles.enterText}>Enter Battle</Text>
        </ScaleTap>

        <View style={styles.tiles}>
          <LobbyTile
            icon={<MaterialIcons name="group" size={26} color={INK} />}
            title="Friends"
            subtitle={friendsSubtitle(friends, inviteCount)}
            highlight={inviteCount > 0}
            onPress={onOpenFriends}
          />
          <LobbyTile
            icon={
              <Image
                source={BATTLE_IMAGES.leafShield}
                style={styles.tileIcon as ImageStyle}
                resizeMode="contain"
              />
            }
            title="Leaderboard"
            subtitle={leaderboardSubtitle(leaderboard, childId)}
            onPress={onOpenLeaderboard}
          />
        </View>

        <DeckCard restCards={restCards} />
      </View>

      <ChooseBattleSheet
        visible={chooseVisible}
        onClose={() => setChooseVisible(false)}
        onPractice={onPractice}
        onJoin={onJoin}
        onCreateCode={onCreateCode}
        friends={friends}
        onInviteFriend={onInviteFriend}
        onOpenFriends={() => {
          setChooseVisible(false);
          onOpenFriends();
        }}
        pending={pending}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GAME_COLORS.headerGreen },
  // Fills the screen without scrolling: the hero art shrinks to whatever height is left.
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  enterButton: {
    width: "100%",
    maxWidth: 330,
    height: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFB938",
    borderWidth: 4,
    borderColor: INK,
    borderRadius: 22,
    boxShadow: `0px 7px 0px ${INK}, inset 0px 6px 0px rgba(255, 255, 255, 0.4), inset 0px -6px 0px rgba(122, 53, 0, 0.25)`,
  },
  enterIcon: { width: 42, height: 38 },
  enterText: {
    fontFamily: FONTS.display,
    fontSize: 30,
    color: "#FFFFFF",
    textShadowColor: "#7A3500",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  tiles: { width: "100%", flexDirection: "row", gap: 12 },
  tileIcon: { width: 28, height: 28 },
});
