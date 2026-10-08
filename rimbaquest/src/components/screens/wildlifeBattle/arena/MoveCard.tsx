import React from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { Tap } from "../../../common/Tap";
import { WildlifeAction } from "../../../../types/wildlifeMatch";

const INK = GAME_COLORS.ink;

export type BattleMove = {
  action: WildlifeAction;
  name: string;
  cost: number;
  description: string;
  unlocked: boolean;
  enabled: boolean;
  note: string;
};

export function MoveCard({
  move,
  onPress,
  disabled,
  tall = false,
}: {
  move: BattleMove;
  onPress: () => void;
  disabled: boolean;
  tall?: boolean;
}) {
  if (!move.unlocked) {
    return (
      <Tap
        label={`${move.name}, ${move.cost} Energy. Locked, pass its quiz to unlock.`}
        onPress={onPress}
        disabled
        style={[
          styles.moveCard,
          tall && styles.moveCardTall,
          styles.moveCardLocked,
        ]}
      >
        <View style={styles.moveHeader}>
          <Text
            style={[styles.moveName, styles.moveNameLocked]}
            numberOfLines={1}
          >
            {move.name}
          </Text>
          <View style={[styles.costPill, styles.costPillLocked]}>
            <Image
              source={BATTLE_IMAGES.lock}
              style={styles.lockIcon as ImageStyle}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text
          style={[styles.moveNote, styles.moveNoteLocked]}
          numberOfLines={1}
        >
          Pass its quiz to unlock
        </Text>
      </Tap>
    );
  }
  const enabled = move.enabled && !disabled;
  // The basic attack is free and always ready, so its big button is just the word.
  if (tall) {
    return (
      <Tap
        label="Attack"
        onPress={onPress}
        disabled={!enabled}
        style={[
          styles.moveCard,
          styles.moveCardTall,
          !enabled && styles.moveCardInactive,
        ]}
      >
        <Text style={[styles.moveName, styles.moveNameTall]}>Attack</Text>
      </Tap>
    );
  }
  // A short reason ("Not enough Energy") replaces the description when the move can't be used.
  const blocked = move.note !== move.description;
  return (
    <Tap
      label={`${move.name}, ${move.cost} Energy. ${move.note}`}
      onPress={onPress}
      disabled={!enabled}
      style={[styles.moveCard, !enabled && styles.moveCardInactive]}
    >
      <View style={styles.moveHeader}>
        <Text style={styles.moveName} numberOfLines={1}>
          {move.name}
        </Text>
        <View style={styles.costPill}>
          <Image
            source={BATTLE_IMAGES.energy}
            style={styles.costIcon as ImageStyle}
          />
          <Text style={styles.costText}>{move.cost}</Text>
        </View>
      </View>
      <Text
        style={[styles.moveDescription, blocked && styles.moveNote]}
        numberOfLines={1}
      >
        {blocked ? move.note : move.description}
      </Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  moveCard: {
    minHeight: 52,
    gap: 2,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 5px 0px ${INK}, inset 0px 5px 0px rgba(255, 255, 255, 0.5)`,
  },
  moveCardTall: { flex: 1, alignItems: "center" },
  moveCardInactive: { opacity: 0.55 },
  moveCardLocked: {
    backgroundColor: GAME_COLORS.track,
    borderColor: "#6F6A55",
    boxShadow: "0px 4px 0px #6F6A55",
  },
  moveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  moveName: {
    flexShrink: 1,
    fontFamily: FONTS.display,
    fontSize: 16,
    color: GAME_COLORS.heading,
  },
  moveNameTall: { fontSize: 26, textAlign: "center" },
  moveNameLocked: { fontSize: 16, color: "#4E4A3A" },
  costPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFE7A8",
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    paddingLeft: 3,
    paddingRight: 8,
  },
  // Lock only: even padding so the icon sits centred (the cost pill's is lopsided for the number).
  costPillLocked: {
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#E4DCC6",
    borderColor: "#8C8570",
  },
  costIcon: { width: 16, height: 20.27 },
  costText: { fontFamily: FONTS.display, fontSize: 15, color: "#7A3500" },
  moveDescription: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: GAME_COLORS.body,
  },
  moveNote: { fontFamily: FONTS.bodyBlack, fontSize: 10.5, color: "#7A3500" },
  moveNoteLocked: { color: "#6F6A55" },
  lockIcon: { width: 14, height: 16.5 },
});
