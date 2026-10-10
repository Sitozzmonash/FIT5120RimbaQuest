import React from "react";
import { Animated, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";
import { floatStyle, useLoop } from "../shared/useLoop";

export function LobbyHero() {
  const bob = useLoop(1600);
  return (
    <View style={styles.hero}>
      <View style={styles.artBox}>
        <View style={styles.glow} />
        <Animated.Image
          source={BATTLE_IMAGES.lobbyHero}
          accessibilityLabel="Tiger explorer with an elephant and a sun bear"
          style={[styles.art as ImageStyle, floatStyle(bob)]}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Ready for Battle?</Text>
      <Text style={styles.body}>
        A habitat is picked at random. Pick an animal that lives there to get a{" "}
        <Text style={styles.highlight}>BOOST</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, minHeight: 0, width: "100%", alignItems: "center" },
  artBox: {
    flex: 1,
    minHeight: 80,
    maxHeight: 230,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 230,
    borderRadius: 150,
    backgroundColor: "rgba(155, 224, 122, 0.18)",
  },
  art: { width: "100%", height: "100%", maxWidth: 345 },
  title: {
    marginTop: 4,
    fontFamily: FONTS.display,
    fontSize: 28,
    color: GAME_COLORS.woodText,
    textAlign: "center",
    textShadowColor: GAME_COLORS.ink,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 1,
  },
  body: {
    marginTop: 6,
    paddingHorizontal: 14,
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13.5,
    lineHeight: 19,
    color: "#D8ECCE",
    textAlign: "center",
  },
  highlight: { color: GAME_COLORS.goldLight },
});
