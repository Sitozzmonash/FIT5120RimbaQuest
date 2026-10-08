import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { ScaleTap } from "../../../common/ScaleTap";

const INK = GAME_COLORS.ink;

export function LobbyTile({
  icon,
  title,
  subtitle,
  highlight,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  highlight?: boolean;
  onPress: () => void;
}) {
  return (
    <ScaleTap
      label={`${title}, ${subtitle}`}
      onPress={onPress}
      style={styles.tile}
    >
      <View style={styles.top}>
        {icon}
        <Image source={BATTLE_IMAGES.chevronRight} style={{ width: 10, height: 14 }} resizeMode="contain" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text
        style={[styles.subtitle, highlight && styles.highlight]}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    height: 104,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    backgroundColor: GAME_COLORS.paper,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 16,
    boxShadow: `0px 5px 0px ${INK}`,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: GAME_COLORS.heading,
  },
  subtitle: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 12,
    color: GAME_COLORS.label,
  },
  highlight: { color: "#C25E00" },
});
