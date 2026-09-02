import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../../../common/PrimaryButton";
import { Tap } from "../../../common/Tap";

export function BattleActionBar({
  isAttacking,
  onAttack,
  onGiveUp,
}: {
  isAttacking: boolean;
  onAttack: () => void;
  onGiveUp: () => void;
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
      <Tap
        label="Give Up"
        style={styles.giveUpBtn}
        disabled={isAttacking}
        onPress={onGiveUp}
      >
        <MaterialIcons name="flag" size={15} color="#8C1D24" />
        <Text style={styles.giveUpText}>Give Up</Text>
      </Tap>
      <View style={styles.lockedNotice}>
        <MaterialIcons name="lock" size={13} color="#879089" />
        <Text style={styles.lockedText}>Special abilities are locked</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  giveUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#F2C4C4",
    backgroundColor: "#FFF6F6",
  },
  giveUpText: { color: "#8C1D24", fontSize: 14, fontWeight: "800" },
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
