import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { GAME_COLORS } from "../../../../common/game/gameTheme";
import { ScaleTap } from "../../../../common/ScaleTap";
import { WildlifeFriend } from "../../../../../types/wildlifeMatch";
import { Avatar } from "../../shared/Avatar";

const INK = GAME_COLORS.ink;

function Option({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.option}>
      <View>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionBody}>{body}</Text>
      </View>
      {children}
    </View>
  );
}

function OrDivider() {
  return (
    <View
      style={styles.orRow}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.orLine} />
      <Text style={styles.orText}>OR</Text>
      <View style={styles.orLine} />
    </View>
  );
}

function InviteFromFriendList({
  friends,
  busy,
  onInvite,
  onOpenFriends,
}: {
  friends: WildlifeFriend[] | null;
  busy: boolean;
  onInvite: (friend: WildlifeFriend) => void;
  onOpenFriends: () => void;
}) {
  if (friends === null) return <ActivityIndicator color={GAME_COLORS.go} />;
  if (friends.length === 0) {
    return (
      <View style={styles.noFriends}>
        <Text style={styles.noFriendsText}>No friends yet.</Text>
        <ScaleTap
          label="Add Friends"
          onPress={onOpenFriends}
          disabled={busy}
          style={[styles.addFriends, busy && styles.disabled]}
        >
          <Text style={styles.addFriendsText}>Add Friends</Text>
        </ScaleTap>
      </View>
    );
  }
  return (
    <View style={styles.friendList}>
      {friends.map((friend) => (
        <View key={friend.child_id} style={styles.friendRow}>
          <Avatar avatar={friend.avatar} size={36} />
          <Text style={styles.friendName} numberOfLines={1}>
            {friend.display_name}
          </Text>
          <ScaleTap
            label={`Battle ${friend.display_name}`}
            onPress={() => onInvite(friend)}
            disabled={busy}
            style={[styles.battlePill, busy && styles.disabled]}
          >
            <Text style={styles.battlePillText}>Battle!</Text>
          </ScaleTap>
        </View>
      ))}
    </View>
  );
}

function JoinWithCode({
  busy,
  joining,
  onJoin,
}: {
  busy: boolean;
  joining: boolean;
  onJoin: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const blocked = !code.trim() || busy;
  return (
    <View style={styles.joinRow}>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        onSubmitEditing={() => code.trim() && onJoin(code)}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="Invitation code"
        placeholderTextColor="rgba(14, 69, 39, 0.5)"
        accessibilityLabel="Invitation code"
        maxLength={32}
      />
      <ScaleTap
        label="Join"
        onPress={() => onJoin(code)}
        disabled={blocked}
        style={[styles.joinButton, blocked && styles.joinButtonDisabled]}
      >
        {joining ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.joinText, blocked && styles.joinTextDisabled]}>
            Join
          </Text>
        )}
      </ScaleTap>
    </View>
  );
}

export function FriendOptions({
  friends,
  pending,
  onInviteFriend,
  onOpenFriends,
  onJoin,
  onCreateCode,
}: {
  friends: WildlifeFriend[] | null;
  pending: string | null;
  onInviteFriend: (friend: WildlifeFriend) => void;
  onOpenFriends: () => void;
  onJoin: (code: string) => void;
  onCreateCode: () => void;
}) {
  const busy = Boolean(pending);
  return (
    <>
      <Option
        title="Invite a friend"
        body="Pick someone from your Friend List."
      >
        <InviteFromFriendList
          friends={friends}
          busy={busy}
          onInvite={onInviteFriend}
          onOpenFriends={onOpenFriends}
        />
      </Option>

      <OrDivider />

      <Option
        title="Join with a code"
        body="Got a code from a friend? Enter it here."
      >
        <JoinWithCode
          busy={busy}
          joining={pending === "Finding invitation"}
          onJoin={onJoin}
        />
      </Option>

      <OrDivider />

      <Option
        title="Create a code"
        body="Pick your card, then send the code to anyone."
      >
        <ScaleTap
          label="Create and share code"
          onPress={onCreateCode}
          disabled={busy}
          style={[styles.createButton, busy && styles.disabled]}
        >
          {pending === "Creating match" ? (
            <ActivityIndicator color={INK} />
          ) : (
            <Text style={styles.createText}>Create & Share Code</Text>
          )}
        </ScaleTap>
      </Option>
    </>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.6 },
  option: {
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 18,
  },
  optionTitle: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: GAME_COLORS.heading,
  },
  optionBody: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: GAME_COLORS.label,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: -4,
  },
  orLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: "#C9B88C" },
  orText: {
    fontFamily: FONTS.display,
    fontSize: 14,
    letterSpacing: 1,
    color: GAME_COLORS.label,
  },

  noFriends: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#C9B88C",
    borderRadius: 12,
  },
  noFriendsText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 12.5,
    color: GAME_COLORS.label,
  },
  addFriends: {
    height: 36,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GAME_COLORS.go,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 5px 0px ${INK}, inset 0px 5px 0px rgba(255, 255, 255, 0.28), inset 0px -5px 0px rgba(7, 60, 29, 0.35)`,
  },
  addFriendsText: {
    fontFamily: FONTS.display,
    fontSize: 14,
    color: "#FFFFFF",
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  friendList: { gap: 8 },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 12,
  },
  friendName: {
    flex: 1,
    fontFamily: FONTS.bodyBlack,
    fontSize: 14,
    color: GAME_COLORS.heading,
  },
  battlePill: {
    height: 34,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB938",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 999,
    boxShadow: `0px 3px 0px ${INK}`,
  },
  battlePillText: {
    fontFamily: FONTS.display,
    fontSize: 14,
    color: "#FFFFFF",
    textShadowColor: "#7A3500",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },

  joinRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    height: 46,
    paddingHorizontal: 12,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 12,
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 14,
    color: GAME_COLORS.headerGreen,
  },
  joinButton: {
    width: 74,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GAME_COLORS.go,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 12,
    boxShadow: `0px 4px 0px ${INK}`,
  },
  joinButtonDisabled: {
    backgroundColor: "#C9C3B0",
    borderColor: "#8C8570",
    boxShadow: "0px 4px 0px #8C8570",
  },
  joinText: { fontFamily: FONTS.display, fontSize: 16, color: "#FFFFFF" },
  joinTextDisabled: { color: "#F3EEE2" },

  createButton: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  createText: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: GAME_COLORS.heading,
  },
});
