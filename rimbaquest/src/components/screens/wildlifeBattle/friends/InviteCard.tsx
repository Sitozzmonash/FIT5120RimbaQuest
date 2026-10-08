import React from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GameButton } from "../../../common/game/GameButton";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import { WildlifeIncomingInvite } from "../../../../types/wildlifeMatch";
import { friendlyHabitat } from "../shared/battleText";
import { formatTimeLeft, useNow } from "../shared/countdown";
import { Avatar } from "../shared/Avatar";
import { Chip } from "../shared/Chip";

const INK = GAME_COLORS.ink;

export function InviteCard({
  invite,
  avatar,
  busy,
  onAccept,
  onDecline,
}: {
  invite: WildlifeIncomingInvite;
  avatar: string | undefined;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const timeLeft = formatTimeLeft(invite.expires_at, useNow());
  return (
    <View style={styles.inviteCard}>
      <View style={styles.inviteTop}>
        <View>
          <Avatar avatar={avatar} size={52} />
          <Image
            source={BATTLE_IMAGES.swords}
            style={styles.inviteSwords as ImageStyle}
            resizeMode="contain"
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.inviteTitle} numberOfLines={2}>
            {invite.friend_display_name} challenges you!
          </Text>
          <View style={styles.chipRow}>
            <Chip
              text={`${friendlyHabitat(invite.habitat)} habitat`}
              tone="habitat"
            />
            {timeLeft ? (
              <Chip text={`Expires ${timeLeft}`} tone="expiry" />
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.inviteActions}>
        <ScaleTap
          label={`Decline ${invite.friend_display_name}'s battle`}
          onPress={onDecline}
          disabled={busy}
          style={[styles.declineButton, busy && styles.disabled]}
        >
          <Text style={styles.declineText}>Decline</Text>
        </ScaleTap>
        <View style={styles.flex}>
          <GameButton label="Accept" onPress={onAccept} disabled={busy} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.45 },
  flex: { flex: 1 },
  inviteCard: {
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFE7A8",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 20,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  inviteTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  inviteSwords: {
    position: "absolute",
    right: -10,
    bottom: -6,
    width: 30,
    height: 28,
  },
  inviteTitle: {
    fontFamily: FONTS.display,
    fontSize: 17,
    lineHeight: 19,
    color: GAME_COLORS.heading,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 3 },
  inviteActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  declineButton: {
    width: 110,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  declineText: {
    fontFamily: FONTS.display,
    fontSize: 15,
    color: GAME_COLORS.heading,
  },
});
