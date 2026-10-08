// Friend-code input and Add button; confirms who was added.
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { GameButton } from "../../../common/game/GameButton";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { WildlifeFriend } from "../../../../types/wildlifeMatch";

const INK = GAME_COLORS.ink;

export function AddFriendRow({
  busy,
  onAdd,
  compact,
}: {
  busy: boolean;
  onAdd: (code: string) => Promise<WildlifeFriend | null>;
  compact: boolean;
}) {
  const [code, setCode] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const submit = async () => {
    setAdded(null);
    const friend = await onAdd(code);
    if (friend) {
      setCode("");
      setAdded(`${friend.display_name} is in your Friend List.`);
    }
  };
  return (
    <>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.codeInput, compact && styles.codeInputCompact]}
          value={code}
          onChangeText={(value) => {
            setCode(value);
            setAdded(null);
          }}
          onSubmitEditing={() => void submit()}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={
            compact ? "Add a friend's code" : "Enter their 6-letter code"
          }
          placeholderTextColor="rgba(14, 69, 39, 0.5)"
          accessibilityLabel="Friend code"
          maxLength={6}
        />
        <GameButton
          label="Add"
          width="hug"
          onPress={() => void submit()}
          disabled={!code.trim() || busy}
        />
      </View>
      {added ? <Text style={styles.successText}>{added}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  successText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: GAME_COLORS.go,
  },
  addRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  codeInput: {
    flex: 1,
    minWidth: 0,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 14,
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 15,
    letterSpacing: 1,
    color: GAME_COLORS.headerGreen,
  },
  codeInputCompact: { height: 44, fontSize: 14, borderRadius: 12 },
});
