import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { CHAT_COLORS, CHAT_IMAGES } from "./chatTheme";

export function ChatAvatar({ large = false }: { large?: boolean }) {
  return (
    <View style={[styles.circle, large ? styles.large : styles.small]}>
      <Image
        source={CHAT_IMAGES.hat}
        style={large ? styles.hatLarge : styles.hatSmall}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CHAT_COLORS.green,
    borderColor: CHAT_COLORS.ink,
  },
  large: {
    width: 48,
    height: 48 + 3,
    borderRadius: 24,
    borderWidth: 3,
    borderBottomWidth: 6,
  },
  small: { width: 34, height: 34, borderRadius: 17, borderWidth: 2 },
  hatLarge: { width: 40, height: 26.08 },
  hatSmall: { width: 26, height: 16.95 },
});
