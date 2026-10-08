import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { habitatBackground } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { friendlyHabitat } from "./battleText";

const INK = GAME_COLORS.ink;

export function HabitatPhotoBanner({
  habitat,
  height,
  bottomRight,
  topRight,
  style,
}: {
  habitat: string;
  height: number;
  bottomRight?: React.ReactNode;
  topRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.banner, { height }, style]}>
      <ExpoImage
        source={habitatBackground(habitat)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
      />
      <LinearGradient
        colors={["rgba(7, 40, 22, 0)", "rgba(7, 40, 22, 0.85)"]}
        locations={[0, 0.6]}
        style={styles.shade}
      >
        <View>
          <Text style={styles.kicker}>BATTLE HABITAT</Text>
          <Text style={styles.title}>{friendlyHabitat(habitat)}</Text>
        </View>
        {bottomRight}
      </LinearGradient>
      {topRight ? <View style={styles.topRight}>{topRight}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { overflow: "hidden", backgroundColor: "#8A7A52" },
  shade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 22,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  topRight: { position: "absolute", right: 10, top: 10 },
  kicker: {
    fontFamily: FONTS.bodyBlack,
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#D8ECCE",
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 26,
    color: "#FFFFFF",
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 1,
  },
});
