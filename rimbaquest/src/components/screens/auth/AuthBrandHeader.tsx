import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { HOME_IMAGES } from "../../../constants/images";
import { AUTH_COLORS } from "./authTheme";

export function AuthBrandHeader({
  height,
  topInset,
}: {
  height: number;
  topInset: number;
}) {
  return (
    <View style={[styles.shadow, { height: height + 5 }]}>
      <View style={[styles.header, { height, paddingTop: topInset }]}>
        <Image
          source={HOME_IMAGES.brandLogo}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="RimbaQuest"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_COLORS.paper,
    borderBottomWidth: 3,
    borderBottomColor: AUTH_COLORS.ink,
  },
  logo: { width: 196, height: 45.23 },
});
