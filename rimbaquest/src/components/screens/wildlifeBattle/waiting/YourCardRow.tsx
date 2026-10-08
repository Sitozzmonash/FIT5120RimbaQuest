import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";

const INK = GAME_COLORS.ink;

export interface WaitingCard {
  name: string;
  image?: number;
}

export function YourCardRow({
  card,
  disabled,
  onChange,
}: {
  card: WaitingCard | null;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        {card?.image ? (
          <ExpoImage
            source={card.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="top"
          />
        ) : null}
      </View>
      <View style={styles.text}>
        <Text style={styles.kicker}>YOUR CARD</Text>
        <Text style={styles.name} numberOfLines={1}>
          {card?.name ?? "Your card"}
        </Text>
      </View>
      <ScaleTap
        label="Change card"
        onPress={onChange}
        disabled={disabled}
        style={[styles.change, disabled && styles.disabled]}
      >
        <Text style={styles.changeText}>Change</Text>
      </ScaleTap>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 20,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  disabled: { opacity: 0.6 },
  thumb: {
    width: 64,
    height: 64,
    overflow: "hidden",
    backgroundColor: "#2F6B3E",
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 12,
  },
  text: { flex: 1, gap: 3 },
  kicker: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10,
    letterSpacing: 1.5,
    color: GAME_COLORS.label,
  },
  name: {
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 20,
    color: GAME_COLORS.heading,
  },
  change: {
    height: 40,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  changeText: {
    fontFamily: FONTS.display,
    fontSize: 14,
    color: GAME_COLORS.heading,
  },
});
