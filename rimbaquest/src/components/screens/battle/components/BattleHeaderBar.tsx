import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BattleEvent } from "../../../../types/battle";
import { Tap } from "../../../common/Tap";

export function BattleHeaderBar({
  title,
  round,
  phase,
  currentEvent,
  onBack,
  backDisabled = false,
}: {
  title: string;
  round?: number;
  phase?: string;
  currentEvent?: BattleEvent | null;
  onBack?: () => void;
  backDisabled?: boolean;
}) {
  let subtitle = "";
  if (currentEvent && currentEvent.message) {
    subtitle = currentEvent.message;
  } else if (phase) {
    if (phase === "player_turn") {
      subtitle = "Your turn · Select action";
    } else if (phase === "roll") {
      subtitle = "Roll phase · Roll the nature dice";
    } else if (phase === "outcome") {
      subtitle = "Battle completed";
    } else {
      subtitle = phase;
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {onBack && (
          <Tap
            label="Go back"
            style={[styles.backBtn, backDisabled && styles.backBtnDisabled]}
            disabled={backDisabled}
            onPress={onBack}
          >
            <MaterialIcons name="chevron-left" size={20} color="#1B211C" />
          </Tap>
        )}
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {round != null && (
          <View style={styles.roundBadge}>
            <Text style={styles.roundText}>Round {round}</Text>
            {phase ? (
              <Text style={styles.phaseText}>
                · {phase === "player_turn" ? "Action" : phase === "roll" ? "Roll" : "End"}
              </Text>
            ) : null}
          </View>
        )}
      </View>
      {subtitle ? (
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2ECE4",
    paddingBottom: 4,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: 20,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2ECE4",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnDisabled: { opacity: 0.4 },
  title: { color: "#1B211C", fontSize: 18, fontWeight: "900", flex: 1 },
  roundBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roundText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2E7D32",
  },
  phaseText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4CAF50",
    textTransform: "capitalize",
  },
  subtitleRow: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#566159",
  },
});
