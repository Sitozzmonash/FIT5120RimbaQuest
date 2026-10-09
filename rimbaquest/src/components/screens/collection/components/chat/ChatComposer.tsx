import React from "react";
import { Image, StyleSheet, TextInput, View } from "react-native";
import { FONTS } from "../../../../../constants/fonts";
import { ScaleTap } from "../../../../common/ScaleTap";
import { CHAT_COLORS, CHAT_IMAGES } from "./chatTheme";

export function ChatComposer({
  value,
  speciesName,
  disabled,
  bottomPadding,
  onFocus,
  onBlur,
  onChangeText,
  onSend,
}: {
  value: string;
  speciesName: string;
  disabled: boolean;
  bottomPadding: number;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <View style={[styles.bar, { paddingBottom: bottomPadding }]}>
      <View style={styles.inputWrap}>
        <View style={styles.insetShade} />
        <TextInput
          accessibilityLabel={`Ask a question about ${speciesName}`}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Ask about this species..."
          placeholderTextColor="rgba(11, 61, 34, 0.6)"
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={onSend}
          maxLength={300}
        />
      </View>
      <ScaleTap
        label="Send question"
        style={[styles.send, disabled && styles.disabled]}
        disabled={disabled}
        onPress={onSend}
      >
        <View style={styles.sendShine} />
        <Image
          source={CHAT_IMAGES.send}
          style={styles.sendIcon}
          resizeMode="contain"
        />
      </ScaleTap>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: CHAT_COLORS.sand,
    borderTopWidth: 3,
    borderTopColor: CHAT_COLORS.ink,
  },
  inputWrap: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: CHAT_COLORS.ink,
    borderRadius: 999,
    overflow: "hidden",
  },
  insetShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(7, 60, 29, 0.1)",
  },
  input: {
    fontFamily: FONTS.bodyBold,
    color: CHAT_COLORS.heading,
    fontSize: 15,
    paddingVertical: 0,
    // Hides the browser focus ring react-native-web draws around inputs.
    outlineWidth: 0,
  },
  send: {
    width: 52,
    height: 52 + 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CHAT_COLORS.paper,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: CHAT_COLORS.ink,
    borderRadius: 26,
    overflow: "hidden",
  },
  sendShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  sendIcon: { width: 30, height: 26.13 },
  disabled: { opacity: 0.45 },
});
