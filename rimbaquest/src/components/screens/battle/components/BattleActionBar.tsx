import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../../../common/PrimaryButton";

export function BattleActionBar({
  isAttacking,
  onAttack,
}: {
  isAttacking: boolean;
  onAttack: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <PrimaryButton
        label="Basic Attack"
        displayText={isAttacking ? "Attacking…" : "Basic Attack"}
        icon="bolt"
        loading={isAttacking}
        onPress={onAttack}
      />
      <View style={styles.lockedNotice}>
        <MaterialIcons name="lock" size={13} color="#879089" />
        <Text style={styles.lockedText}>Special abilities are locked</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  lockedNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E7E3",
    borderRadius: 14,
    paddingVertical: 9,
    backgroundColor: "#F8FAF8",
  },
  lockedText: { fontSize: 11, color: "#7B857F", fontWeight: "700" },
});
