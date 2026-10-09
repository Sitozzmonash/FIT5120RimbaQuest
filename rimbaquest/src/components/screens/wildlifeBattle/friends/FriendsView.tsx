import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AUTH_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import {
  AddFriendResult,
  WildlifeFriend,
  WildlifeFriends,
  WildlifeIncomingInvite,
} from "../../../../types/wildlifeMatch";
import { CompactFriendCodeCard, FriendCodeCards } from "./FriendCodeCards";
import { FriendRow } from "./FriendRow";
import { InviteCard } from "./InviteCard";

function NoFriendsYet() {
  return (
    <View style={styles.empty}>
      <Image
        source={AUTH_IMAGES.heroTigerSunBear}
        style={styles.emptyArt as ImageStyle}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>No friends yet</Text>
      <Text style={styles.emptyBody}>
        Share your code to start battling together!
      </Text>
    </View>
  );
}

export function FriendsView({
  data,
  error,
  busy,
  onAdd,
  onInvite,
  onAcceptInvite,
  onDeclineInvite,
  rankOf,
}: {
  data: WildlifeFriends | null;
  error: string | null;
  busy: boolean;
  onAdd: (code: string) => Promise<AddFriendResult | null>;
  onInvite: (friend: WildlifeFriend) => void;
  onAcceptInvite: (invite: WildlifeIncomingInvite) => void;
  onDeclineInvite: (invite: WildlifeIncomingInvite) => void;
  rankOf: (childId: number) => number | undefined;
}) {
  if (data === null) {
    return error ? (
      <Text style={styles.lightError}>{error}</Text>
    ) : (
      <ActivityIndicator color={GAME_COLORS.goldLight} />
    );
  }
  const avatarOf = (childId: number) =>
    data.friends.find((friend) => friend.child_id === childId)?.avatar;
  const hasFriends = data.friends.length > 0;
  const codeProps = { code: data.friend_code, busy, error, onAdd };

  return (
    <>
      {data.incoming_invites.map((invite) => (
        <InviteCard
          key={invite.match_id}
          invite={invite}
          avatar={avatarOf(invite.friend_child_id)}
          busy={busy}
          onAccept={() => onAcceptInvite(invite)}
          onDecline={() => onDeclineInvite(invite)}
        />
      ))}

      {hasFriends ? (
        <>
          <CompactFriendCodeCard {...codeProps} />
          <View style={styles.list}>
            <Text style={styles.sectionTitle}>Your Friends</Text>
            {data.friends.map((friend) => (
              <FriendRow
                key={friend.child_id}
                friend={friend}
                rank={rankOf(friend.child_id)}
                busy={busy}
                onBattle={() => onInvite(friend)}
              />
            ))}
            <Text style={styles.lightHint}>
              Tap <Text style={styles.goldText}>Battle!</Text> to send an
              invite. They'll get a pop-up and see it on their Friends screen.
            </Text>
          </View>
        </>
      ) : (
        <>
          <FriendCodeCards {...codeProps} />
          <NoFriendsYet />
        </>
      )}
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
  empty: { alignItems: "center", gap: 6, paddingTop: 8 },
  emptyArt: { width: 200, height: 130 },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: GAME_COLORS.woodText,
  },
  emptyBody: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    color: "#D8ECCE",
    textAlign: "center",
  },
  list: { gap: 10 },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: GAME_COLORS.woodText,
  },
  lightHint: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 12,
    color: "#D8ECCE",
  },
  goldText: { color: GAME_COLORS.goldLight },
});
