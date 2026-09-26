import React from "react";
import { Image, StyleSheet, View, ViewStyle } from "react-native";
import { ScaleTap } from "../../../../common/ScaleTap";
import { DETAIL_COLORS, DETAIL_IMAGES } from "./detailTheme";

const SIZE = 64;

// Floating yellow button that opens the species chat.
export function ChatFab({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <ScaleTap label={label} style={[styles.slot, style]} onPress={onPress}>
      <View style={[styles.circle, styles.shadow]} />
      <View style={[styles.circle, styles.face]}>
        <Image
          source={DETAIL_IMAGES.chatBubble}
          style={styles.bubble}
          resizeMode="contain"
        />
      </View>
    </ScaleTap>
  );
}

const styles = StyleSheet.create({
  slot: { position: "absolute", width: SIZE, height: SIZE + 5 },
  circle: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  shadow: { top: 5, backgroundColor: DETAIL_COLORS.ink },
  face: {
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFB938",
    borderWidth: 3,
    borderColor: DETAIL_COLORS.ink,
    overflow: "hidden",
  },
  bubble: { width: 38, height: 32.07 },
});
