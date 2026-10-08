import React, { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GameScreenHeader } from "../../../common/game/GameScreenHeader";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import {
  WildlifeFriend,
  WildlifeFriends,
  WildlifeIncomingInvite,
  WildlifeLeaderboardEntry,
} from "../../../../types/wildlifeMatch";
import { FriendsView } from "./FriendsView";
import { LeaderboardView } from "./LeaderboardView";

export type FriendsTab = "leaderboard" | "friends";

export function FriendsScreen({
  tab,
  onTabChange,
  onBack,
  friends,
  friendsError,
  leaderboard,
  leaderboardError,
  childId,
  myAvatar,
  busy,
  onAdd,
  onInvite,
  onAcceptInvite,
  onDeclineInvite,
  onRefresh,
}: {
  tab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
  onBack: () => void;
  friends: WildlifeFriends | null;
  friendsError: string | null;
  leaderboard: WildlifeLeaderboardEntry[] | null;
  leaderboardError: string | null;
  childId: number;
  myAvatar: string;
  busy: boolean;
  onAdd: (code: string) => Promise<WildlifeFriend | null>;
  onInvite: (friend: WildlifeFriend) => void;
  onAcceptInvite: (invite: WildlifeIncomingInvite) => void;
  onDeclineInvite: (invite: WildlifeIncomingInvite) => void;
  /** Pull-to-refresh: reloads the friends list and the leaderboard. */
  onRefresh: () => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const avatarOf = (id: number) =>
    friends?.friends.find((friend) => friend.child_id === id)?.avatar;
  const rankOf = (id: number) =>
    leaderboard?.find((entry) => entry.child_id === id)?.rank;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.root}>
      <GameScreenHeader
        title={tab === "friends" ? "Friends" : "Leaderboard"}
        onBack={onBack}
        disabled={busy}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={GAME_COLORS.goldLight}
          />
        }
      >
        {tab === "friends" ? (
          <FriendsView
            data={friends}
            error={friendsError}
            busy={busy}
            onAdd={onAdd}
            onInvite={onInvite}
            onAcceptInvite={onAcceptInvite}
            onDeclineInvite={onDeclineInvite}
            rankOf={rankOf}
          />
        ) : (
          <LeaderboardView
            entries={leaderboard}
            error={leaderboardError}
            childId={childId}
            myAvatar={myAvatar}
            avatarOf={avatarOf}
            onAddFriends={() => onTabChange("friends")}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GAME_COLORS.headerGreen },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
