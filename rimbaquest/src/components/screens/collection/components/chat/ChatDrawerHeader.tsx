import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { ScaleTap } from "../../../../common/ScaleTap";
import { outlinedTitleStyle } from "../../../../common/game/gameTheme";
import { ChatAvatar } from "./ChatAvatar";
import { CHAT_COLORS, CHAT_IMAGES } from "./chatTheme";

export function ChatDrawerHeader({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.header}>
      <ChatAvatar large />
      <Text style={styles.title} numberOfLines={1}>
        We are ready to help you!
      </Text>
      <ScaleTap
        label="Close WildGuide chat"
        style={styles.close}
        onPress={onClose}
      >
        <Image
          source={CHAT_IMAGES.close}
          style={styles.closeIcon}
          resizeMode="contain"
        />
      </ScaleTap>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: CHAT_COLORS.forest,
    borderBottomWidth: 3,
    borderBottomColor: CHAT_COLORS.ink,
  },
  title: {
    ...outlinedTitleStyle,
    textShadowColor: CHAT_COLORS.ink,
    flex: 1,
    fontSize: 20,
  },
  close: {
    width: 44,
    height: 44 + 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CHAT_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: CHAT_COLORS.ink,
    borderRadius: 22,
  },
  closeIcon: { width: 20, height: 19.6 },
});
