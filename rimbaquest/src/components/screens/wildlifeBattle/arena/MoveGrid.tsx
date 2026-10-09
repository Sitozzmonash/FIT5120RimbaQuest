import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";
import { ScaleTap } from "../../../common/ScaleTap";
import { WildlifeAction } from "../../../../types/wildlifeMatch";
import { BattleMove, MoveCard } from "./MoveCard";

const RED = "#C7353A";

export function MoveGrid({
  moves,
  locked,
  onMove,
  onGiveUp,
  giveUpDisabled,
}: {
  moves: BattleMove[];
  locked: boolean;
  onMove: (action: WildlifeAction) => void;
  onGiveUp: () => void;
  giveUpDisabled: boolean;
}) {
  const [basic, ...skills] = moves;
  return (
    <View style={styles.grid}>
      <View style={styles.basicColumn}>
        {basic ? (
          <MoveCard
            move={basic}
            tall
            disabled={locked}
            onPress={() => onMove(basic.action)}
          />
        ) : null}
        <ScaleTap
          label="Give up this battle"
          onPress={onGiveUp}
          disabled={giveUpDisabled}
          style={[styles.giveUp, giveUpDisabled && styles.disabled]}
        >
          <Text style={styles.giveUpText}>Give Up</Text>
        </ScaleTap>
      </View>
      <View style={styles.skillColumn}>
        {skills.map((move) => (
          <MoveCard
            key={move.action}
            move={move}
            disabled={locked}
            onPress={() => onMove(move.action)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 8 },
  basicColumn: { flex: 1, gap: 8 },
  skillColumn: { flex: 1.35, gap: 8 },
  disabled: { opacity: 0.5 },
  giveUp: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBE3E0",
    borderWidth: 3,
    borderColor: RED,
    borderRadius: 16,
    boxShadow: `0px 4px 0px ${RED}`,
  },
  giveUpText: { fontFamily: FONTS.display, fontSize: 16, color: RED },
});
