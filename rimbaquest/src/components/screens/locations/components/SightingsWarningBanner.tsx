import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../../constants/fonts";

export function SightingsWarningBanner() {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Image
        source={require("../../../../../assets/locations/alert.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.text}>Wildlife sightings are never guaranteed!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: "#F59E0B",
  },
  icon: { width: 36, height: 36 },
  text: {
    flex: 1,
    color: "#92400E",
    fontSize: 16,
    fontFamily: FONTS.bodySemiBold,
  },
});
