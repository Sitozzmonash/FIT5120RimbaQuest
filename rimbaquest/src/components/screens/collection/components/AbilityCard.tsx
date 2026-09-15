import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Tap } from "../../../common/Tap";

export function AbilityCard({
  slot,
  name,
  isUnlocked,
  isNextToUnlock,
  onUnlock,
}: {
  slot: number;
  name: string;
  isUnlocked: boolean;
  isNextToUnlock: boolean;
  onUnlock: () => void;
}) {
  return (
    <View style={[styles.card, isUnlocked && styles.cardUnlocked]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, isUnlocked && styles.nameUnlocked]}>
          Ability {slot}: {name}
        </Text>
        <Text style={[styles.hint, isUnlocked && styles.hintUnlocked]}>
          {isUnlocked ? "Ready to Use" : "Earn It with a Quiz"}
        </Text>
      </View>

      {isUnlocked ? null : isNextToUnlock ? (
        <Tap
          label={`Unlock Ability ${slot}`}
          style={styles.unlockBtn}
          onPress={onUnlock}
        >
          <Text style={styles.unlockBtnText}>Take Quiz</Text>
        </Tap>
      ) : (
        <View style={styles.lockedIconWrap}>
          <MaterialIcons name="lock" size={20} color="#98A2B3" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAF7",
    marginBottom: 0,
  },
  cardUnlocked: {
    backgroundColor: "#3FBE00",
    borderColor: "#0FB500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  name: { fontSize: 14, fontWeight: "500", color: "#667085" },
  nameUnlocked: { color: "#FFFFFF", fontWeight: "700" },
  hint: { fontSize: 12, color: "#667085", marginTop: 2 },
  hintUnlocked: { color: "#FFFFFF", fontWeight: "600" },
  unlockBtn: {
    borderRadius: 99,
    backgroundColor: "#0A4D26",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  unlockBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  lockedIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
