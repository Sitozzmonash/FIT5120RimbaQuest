import React from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GameButton } from "../../../common/game/GameButton";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { AddFriendResult } from "../../../../types/wildlifeMatch";
import { errorTextStyle } from "../shared/ErrorNote";
import { AddFriendRow } from "./AddFriendRow";
import { Paper } from "./Paper";

const INK = GAME_COLORS.ink;

function shareFriendCode(code: string) {
  void Share.share({
    message: `Add me as a friend in RimbaQuest! Open Card Battle, tap Friends and enter my code ${code}.`,
  }).catch(() => {});
}

type Props = {
  code: string;
  busy: boolean;
  error: string | null;
  onAdd: (code: string) => Promise<AddFriendResult | null>;
};

/** Before the first friend: a big code to share, then a separate Add a Friend card. */
export function FriendCodeCards({ code, busy, error, onAdd }: Props) {
  return (
    <>
      <Paper>
        <Text style={[styles.kicker, styles.centered]}>YOUR FRIEND CODE</Text>
        <View style={styles.bigCodeBox}>
          <Text
            selectable
            style={styles.bigCode}
            accessibilityLabel={`Your friend code ${code}`}
          >
            {code}
          </Text>
        </View>
        <GameButton label="Share" onPress={() => shareFriendCode(code)} />
      </Paper>
      <Paper>
        <Text style={styles.title}>Add a Friend</Text>
        <AddFriendRow busy={busy} onAdd={onAdd} compact={false} />
        {error ? <Text style={errorTextStyle}>{error}</Text> : null}
        <Text style={styles.hint}>
          Adding works both ways — you'll both see each other.
        </Text>
      </Paper>
    </>
  );
}

/** With friends: code, Share and the add box in one compact card. */
export function CompactFriendCodeCard({ code, busy, error, onAdd }: Props) {
  return (
    <Paper>
      <View style={styles.compactRow}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>YOUR CODE</Text>
          <Text
            selectable
            style={styles.compactCode}
            accessibilityLabel={`Your friend code ${code}`}
          >
            {code}
          </Text>
        </View>
        <GameButton
          label="Share"
          width="hug"
          onPress={() => shareFriendCode(code)}
        />
      </View>
      <View style={styles.compactAdd}>
        <AddFriendRow busy={busy} onAdd={onAdd} compact />
      </View>
      {error ? <Text style={errorTextStyle}>{error}</Text> : null}
    </Paper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { textAlign: "center" },
  title: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: GAME_COLORS.heading,
  },
  kicker: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 11,
    letterSpacing: 1.5,
    color: GAME_COLORS.label,
  },
  hint: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11.5,
    color: GAME_COLORS.label,
  },
  bigCodeBox: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: INK,
    borderRadius: 14,
  },
  bigCode: {
    fontFamily: FONTS.display,
    fontSize: 34,
    letterSpacing: 8,
    color: GAME_COLORS.heading,
  },
  compactRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  compactCode: {
    fontFamily: FONTS.display,
    fontSize: 26,
    letterSpacing: 5,
    color: GAME_COLORS.heading,
  },
  compactAdd: { gap: 6 },
});
