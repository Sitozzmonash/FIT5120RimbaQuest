import React from "react";
import { Image, ImageStyle, StyleSheet, Text, View } from "react-native";
import { BATTLE_IMAGES } from "../../../../constants/images";
import { FONTS } from "../../../../constants/fonts";
import { GAME_COLORS } from "../../../common/game/gameTheme";

export function HabitatTip({ habitat }: { habitat: string }) {
  return (
    <View style={styles.tip}>
      <Image
        source={BATTLE_IMAGES.habitatBonus}
        style={styles.icon as ImageStyle}
        resizeMode="contain"
      />
      <Text style={styles.text}>
        <Text style={styles.bold}>Tip:</Text> a {habitat} card would have had
        +20% here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#D8ECCE",
    borderWidth: 3,
    borderColor: GAME_COLORS.ink,
    borderRadius: 16,
  },
  icon: { width: 26, height: 24 },
  text: {
    flex: 1,
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    color: "#1A4D2B",
  },
  bold: { fontFamily: FONTS.bodyBlack },
});
