import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GameButton } from "../../../common/game/GameButton";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WildlifeLeaderboardEntry } from "../../../../types/wildlifeMatch";
import { Avatar } from "../shared/Avatar";
import { Chip } from "../shared/Chip";
import { LeaderboardRow, formatPoints } from "../shared/LeaderboardRow";

const INK = GAME_COLORS.ink;

function RankSpotlight({
  entry,
  avatar,
}: {
  entry: WildlifeLeaderboardEntry;
  avatar: string;
}) {
  return (
    <View style={styles.spotlight}>
      <View>
        <Avatar avatar={avatar} size={92} ring />
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>{entry.rank}</Text>
        </View>
      </View>
      <Text style={styles.spotlightName} numberOfLines={1}>
        {entry.display_name} (you)
      </Text>
      <Text style={styles.spotlightPoints}>{formatPoints(entry.points)}</Text>
    </View>
  );
}

function LonelyBoard({ onAddFriends }: { onAddFriends: () => void }) {
  return (
    <View style={styles.lonely}>
      <Image
        source={BATTLE_IMAGES.leafShield}
        style={styles.lonelyIcon as ImageStyle}
        resizeMode="contain"
      />
      <Text style={styles.lonelyTitle}>The leaderboard is lonely!</Text>
      <Text style={styles.lonelyBody}>Add friends to see how you rank.</Text>
      <GameButton label="Add Friends" width="hug" onPress={onAddFriends} />
    </View>
  );
}

export function LeaderboardView({
  entries,
  error,
  childId,
  myAvatar,
  avatarOf,
  onAddFriends,
}: {
  entries: WildlifeLeaderboardEntry[] | null;
  error: string | null;
  childId: number;
  myAvatar: string;
  avatarOf: (childId: number) => string | undefined;
  onAddFriends: () => void;
}) {
  const me = entries?.find((entry) => entry.child_id === childId);
  return (
    <>
      <View style={styles.rules}>
        <Chip text="Win +5" tone="win" />
        <Chip text="Loss −3" tone="loss" />
        <Chip text="Bot practice: no points" tone="plain" />
      </View>

      {error ? <Text style={styles.lightError}>{error}</Text> : null}
      {me ? <RankSpotlight entry={me} avatar={myAvatar} /> : null}

      <View style={styles.board}>
        {entries === null ? (
          <ActivityIndicator color={GAME_COLORS.go} />
        ) : (
          <>
            {entries.map((entry) => {
              const mine = entry.child_id === childId;
              return (
                <LeaderboardRow
                  key={entry.child_id}
                  entry={entry}
                  mine={mine}
                  avatar={mine ? myAvatar : avatarOf(entry.child_id)}
                />
              );
            })}
            {entries.length <= 1 ? (
              <LonelyBoard onAddFriends={onAddFriends} />
            ) : null}
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  lightError: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: "#FFB3B5",
    textAlign: "center",
  },
  rules: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  spotlight: { alignItems: "center", gap: 2 },
  rankBadge: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GAME_COLORS.goldLight,
    borderWidth: 3,
    borderColor: INK,
  },
  rankBadgeText: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: GAME_COLORS.goldText,
  },
  spotlightName: {
    marginTop: 10,
    fontFamily: FONTS.display,
    fontSize: 20,
    color: GAME_COLORS.woodText,
  },
  spotlightPoints: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: GAME_COLORS.goldLight,
  },
  board: {
    gap: 10,
    minHeight: 280,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: "#ECD9AB",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 24,
  },
  lonely: { alignItems: "center", gap: 8, marginTop: 18 },
  lonelyIcon: { width: 54, height: 54 },
  lonelyTitle: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: GAME_COLORS.heading,
  },
  lonelyBody: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    color: GAME_COLORS.label,
    textAlign: "center",
  },
});
