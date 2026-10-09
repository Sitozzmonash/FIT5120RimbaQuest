import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";
import { WildlifeIncomingInvite } from "../../../../types/wildlifeMatch";
import { Avatar } from "../shared/Avatar";
import { friendlyHabitat } from "../shared/battleText";
import { formatTimeLeft, useNow } from "../shared/countdown";
import { Chip } from "../shared/Chip";
import { HabitatPhotoBanner } from "../shared/HabitatPhotoBanner";

const INK = GAME_COLORS.ink;

function Versus({
  friendAvatar,
  myAvatar,
}: {
  friendAvatar: string | undefined;
  myAvatar: string;
}) {
  return (
    <View style={styles.versus}>
      <Avatar avatar={friendAvatar} size={64} ring />
      <Text style={styles.vs}>VS</Text>
      <Avatar avatar={myAvatar} size={64} />
    </View>
  );
}

export function InvitePopup({
  invite,
  friendAvatar,
  myAvatar,
  busy,
  onAccept,
  onNotNow,
}: {
  invite: WildlifeIncomingInvite | null;
  friendAvatar: string | undefined;
  myAvatar: string;
  busy: boolean;
  onAccept: () => void;
  onNotNow: () => void;
}) {
  const now = useNow();
  if (!invite) return null;
  const habitat = friendlyHabitat(invite.habitat);
  const timeLeft = formatTimeLeft(invite.expires_at, now);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onNotNow}>
      <View style={styles.backdrop}>
        <View
          style={styles.card}
          accessibilityRole="alert"
          accessibilityLabel={`${invite.friend_display_name} challenges you to a ${habitat} battle`}
        >
          <HabitatPhotoBanner
            habitat={invite.habitat}
            height={128}
            style={styles.banner}
            topRight={
              timeLeft ? (
                <Chip text={`Expires ${timeLeft}`} tone="expiry" />
              ) : null
            }
          />

          <View style={styles.body}>
            <Versus friendAvatar={friendAvatar} myAvatar={myAvatar} />
            <Text style={styles.title}>
              {invite.friend_display_name} challenges you!
            </Text>
            <Text style={styles.message}>
              Pick a <Text style={styles.bold}>{habitat}</Text> card for +20%
              Attack & Defence.
            </Text>
            <View style={styles.chips}>
              <Chip text="Win +5" tone="win" />
              <Chip text="Loss −3" tone="loss" />
            </View>
            <View style={styles.actions}>
              <ScaleTap
                label="Not now"
                onPress={onNotNow}
                style={[styles.button, styles.notNow]}
              >
                <Text style={styles.notNowText}>Not Now</Text>
              </ScaleTap>
              <ScaleTap
                label="Accept and pick a card"
                onPress={onAccept}
                disabled={busy}
                style={[styles.button, styles.accept, busy && styles.disabled]}
              >
                <Text style={styles.acceptText} numberOfLines={1} adjustsFontSizeToFit>
                  Accept
                </Text>
              </ScaleTap>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.6 },
  bold: { fontFamily: FONTS.bodyBlack, color: GAME_COLORS.heading },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    backgroundColor: "rgba(7, 30, 15, 0.65)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 4,
    borderColor: "#F2B233",
    borderRadius: 26,
    boxShadow: `0px 0px 0px 3px ${INK}, 0px 9px 0px 3px ${INK}`,
  },
  banner: { borderBottomWidth: 3, borderColor: INK },
  body: {
    alignItems: "center",
    gap: 10,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  versus: { flexDirection: "row", alignItems: "center", gap: 12 },
  vs: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: "#FFB938",
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 1,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 23,
    color: GAME_COLORS.heading,
    textAlign: "center",
  },
  message: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: GAME_COLORS.body,
    textAlign: "center",
  },
  chips: { flexDirection: "row", gap: 6 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
    marginTop: 4,
  },
  // Not Now and Accept share one size and shape; only the colour differs.
  button: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
  },
  notNow: { flex: 1, backgroundColor: GAME_COLORS.paper, boxShadow: `0px 5px 0px ${INK}` },
  accept: {
    flex: 1,
    backgroundColor: GAME_COLORS.go,
    boxShadow: `0px 5px 0px ${INK}, inset 0px 5px 0px rgba(255, 255, 255, 0.28), inset 0px -5px 0px rgba(7, 60, 29, 0.35)`,
  },
  acceptText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: "#FFFFFF",
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  notNowText: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: GAME_COLORS.heading,
  },
});
