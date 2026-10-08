import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GameButton } from "../../../common/game/GameButton";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { shareInviteCode } from "../shared/battleText";

const INK = GAME_COLORS.ink;

export function ShareCodeCard({
  code,
  invitedFriendName,
}: {
  code: string | null | undefined;
  invitedFriendName?: string;
}) {
  return (
    <View style={styles.paper}>
      {invitedFriendName ? (
        <Text style={styles.lead}>
          <Text style={styles.bold}>{invitedFriendName}</Text> gets a pop-up and
          can also find your invite on their Friends screen.
        </Text>
      ) : (
        <>
          <Text style={styles.lead}>
            Your friend taps{" "}
            <Text style={styles.bold}>
              Challenge a Friend → Join with a code
            </Text>
          </Text>
          <View style={styles.codeBox}>
            <Text
              selectable
              style={styles.code}
              adjustsFontSizeToFit
              numberOfLines={1}
              accessibilityLabel={`Invitation code ${code ?? "loading"}`}
            >
              {code ?? "······"}
            </Text>
          </View>
          {code ? (
            <GameButton label="Share" onPress={() => shareInviteCode(code)} />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 20,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  lead: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 12.5,
    lineHeight: 18,
    color: GAME_COLORS.body,
    textAlign: "center",
  },
  bold: { fontFamily: FONTS.bodyBlack, color: GAME_COLORS.heading },
  codeBox: {
    height: 60,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: INK,
    borderRadius: 14,
  },
  code: {
    fontFamily: FONTS.display,
    fontSize: 26,
    letterSpacing: 5,
    color: GAME_COLORS.heading,
  },
});
